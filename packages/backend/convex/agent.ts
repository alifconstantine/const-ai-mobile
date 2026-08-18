/**
 * Const AI Mobile — Agent Reasoning & Orchestration Engine (Hermes Agent Pattern)
 * Coordinates Multi-LLM provider execution, tool dispatching, HITL policy interception, and execution loops.
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { CONST_DEVICE_TOOLS, buildSystemPrompt } from "./tools";
import {
  executeLLMCompletion,
  discoverProviderModels,
  LLMMessage,
  LLMProviderType,
  DiscoveredModel,
} from "./llmTransport";
import { evaluateToolPolicy } from "./policyEngine";
import { ConstToolName, OperatingMode } from "@const-ai/types";

export interface EvaluatedToolCall {
  id: string;
  toolName: ConstToolName;
  args: Record<string, unknown>;
  policyDecision: "allow" | "ask";
  status: "running" | "waiting_hitl";
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  content?: string;
  toolCalls?: EvaluatedToolCall[];
  error?: string;
}

export interface SubmitToolResultResponse {
  success: boolean;
  messageId?: string;
  content?: string;
  error?: string;
}

export const sendMessage = action({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
    conversationId: v.id("conversations"),
    userMessage: v.string(),
    targetDeviceId: v.optional(v.id("devices")),
    modelOverride: v.optional(v.string()),
    operatingModeOverride: v.optional(v.string()),
    customApiKeyOverride: v.optional(v.string()),
    customBaseUrlOverride: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<SendMessageResult> => {
    // 1. Save user's incoming message
    await ctx.runMutation(api.messages.insertMessage, {
      conversationId: args.conversationId,
      role: "user",
      content: args.userMessage,
    });

    // 2. Fetch User Config & Message History
    const userConfig = await ctx.runQuery(api.users.getUserConfig, {
      userId: args.userId,
    });

    const history = await ctx.runQuery(api.messages.listMessages, {
      conversationId: args.conversationId,
    });

    // Read user config or use sensible defaults
    const operatingMode: OperatingMode =
      (args.operatingModeOverride as OperatingMode) ||
      userConfig?.operatingMode ||
      "ask_before_change";

    const activeModel =
      args.modelOverride || userConfig?.activeModel || "Const";

    const provider: LLMProviderType =
      (userConfig?.provider as LLMProviderType) ||
      (activeModel === "Const" ? "custom_openai" : "openrouter");

    const customBaseUrl =
      args.customBaseUrlOverride ||
      userConfig?.customBaseUrl ||
      (typeof process !== "undefined" && process.env.CUSTOM_LLM_BASE_URL) ||
      "";

    // Resolve API key by provider preference & environment variables
    const envKey =
      (typeof process !== "undefined" &&
        (provider === "openrouter"
          ? process.env.OPENROUTER_API_KEY
          : provider === "gemini"
          ? process.env.GEMINI_API_KEY
          : provider === "anthropic"
          ? process.env.ANTHROPIC_API_KEY
          : process.env.CUSTOM_LLM_API_KEY ||
            process.env.OPENAI_API_KEY ||
            process.env.OPENROUTER_API_KEY)) ||
      "";

    const apiKey =
      args.customApiKeyOverride ||
      (provider === "gemini"
        ? userConfig?.customApiKeys?.gemini
        : provider === "anthropic"
        ? userConfig?.customApiKeys?.anthropic
        : provider === "openrouter"
        ? userConfig?.customApiKeys?.openRouter
        : userConfig?.customApiKeys?.openAi || userConfig?.customApiKeys?.openRouter) ||
      envKey ||
      "";

    // 3. Build System Prompt & Canonical Messages Array
    const systemPrompt = buildSystemPrompt({
      operatingMode,
      activeModel,
      platform: "android",
    });

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-15).map(
        (m: {
          role: string;
          content: string;
          toolCalls?: Array<{ id: string; toolName: string; args: any }>;
        }) => ({
          role: m.role as "system" | "user" | "assistant" | "tool",
          content: m.content,
          tool_calls: m.toolCalls?.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.toolName,
              arguments: JSON.stringify(tc.args),
            },
          })),
        })
      ),
    ];

    // 4. Dispatch to LLM Provider via Hermes Transport Layer
    let llmResponse;
    try {
      llmResponse = await executeLLMCompletion(messages, {
        provider,
        model: activeModel,
        apiKey,
        customBaseUrl,
        tools: CONST_DEVICE_TOOLS,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // Save error message as assistant response
      await ctx.runMutation(api.messages.insertMessage, {
        conversationId: args.conversationId,
        role: "assistant",
        content: `⚠️ Maaf, terjadi kendala saat memanggil model AI (${activeModel}):\n${errorMsg}`,
      });
      return { success: false, error: errorMsg };
    }

    // 5. Handle LLM Tool Calls vs Plain Text Response
    if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
      // Plain text response without tool calls
      const assistantMessageId: string = await ctx.runMutation(
        api.messages.insertMessage,
        {
          conversationId: args.conversationId,
          role: "assistant",
          content: llmResponse.content,
          modelUsed: llmResponse.modelUsed,
          promptTokens: llmResponse.usage?.promptTokens,
          completionTokens: llmResponse.usage?.completionTokens,
        }
      );

      return {
        success: true,
        messageId: assistantMessageId,
        content: llmResponse.content,
        toolCalls: [],
      };
    }

    // Process each Tool Call through Policy Engine (HITL Safety Evaluation)
    const evaluatedToolCalls: EvaluatedToolCall[] = [];

    for (const tc of llmResponse.toolCalls) {
      const toolName = tc.name as ConstToolName;
      const toolArgs = tc.arguments;

      // Evaluate against operating mode
      const policy = evaluateToolPolicy(operatingMode, toolName, toolArgs);

      if (policy.decision === "ask") {
        // Intercept action into pendingActions table
        if (args.targetDeviceId) {
          await ctx.runMutation(api.pendingActions.createPendingAction, {
            userId: args.userId,
            conversationId: args.conversationId,
            targetDeviceId: args.targetDeviceId,
            toolName: toolName,
            actionType: policy.suggestedActionType,
            command: policy.userFacingSummary,
          });
        }

        evaluatedToolCalls.push({
          id: tc.id,
          toolName,
          args: toolArgs,
          policyDecision: "ask" as const,
          status: "waiting_hitl" as const,
        });
      } else {
        // Direct execution allowed
        evaluatedToolCalls.push({
          id: tc.id,
          toolName,
          args: toolArgs,
          policyDecision: "allow" as const,
          status: "running" as const,
        });
      }
    }

    // Save assistant message with tool calls
    const assistantMessageId: string = await ctx.runMutation(
      api.messages.insertMessage,
      {
        conversationId: args.conversationId,
        role: "assistant",
        content:
          llmResponse.content || "Menyiapkan eksekusi perintah perangkat...",
        toolCalls: evaluatedToolCalls,
        modelUsed: llmResponse.modelUsed,
        promptTokens: llmResponse.usage?.promptTokens,
        completionTokens: llmResponse.usage?.completionTokens,
      }
    );

    return {
      success: true,
      messageId: assistantMessageId,
      content: llmResponse.content,
      toolCalls: evaluatedToolCalls,
    };
  },
});

/**
 * Resumes agent reasoning loop when a tool execution completes on the device.
 */
export const submitToolResult = action({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
    conversationId: v.id("conversations"),
    assistantMessageId: v.id("messages"),
    toolCallId: v.string(),
    result: v.any(),
    status: v.union(v.literal("success"), v.literal("failed")),
  },
  handler: async (ctx, args): Promise<SubmitToolResultResponse> => {
    // 1. Update the tool call record in the message
    await ctx.runMutation(api.messages.updateToolCallResult, {
      messageId: args.assistantMessageId,
      toolCallId: args.toolCallId,
      result: args.result,
      status: args.status,
    });

    // 2. Insert tool result as a role: "tool" message in conversation history
    await ctx.runMutation(api.messages.insertMessage, {
      conversationId: args.conversationId,
      role: "tool",
      content: JSON.stringify(args.result),
    });

    // 3. Re-fetch message history to resume reasoning loop
    const history = await ctx.runQuery(api.messages.listMessages, {
      conversationId: args.conversationId,
    });

    const activeModel = "google/gemini-2.0-flash-001";
    const apiKey =
      (typeof process !== "undefined" &&
        (process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY)) ||
      "demo_key";

    const systemPrompt = buildSystemPrompt({
      operatingMode: "ask_before_change",
      activeModel,
      platform: "android",
    });

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-15).map((m: { role: string; content: string }) => ({
        role: m.role as "system" | "user" | "assistant" | "tool",
        content: m.content,
        tool_call_id: m.role === "tool" ? args.toolCallId : undefined,
      })),
    ];

    // 4. Continue generation to summarize tool result for user
    const continuation = await executeLLMCompletion(messages, {
      provider: "openrouter",
      model: activeModel,
      apiKey,
      tools: CONST_DEVICE_TOOLS,
    });

    // 5. Save the final assistant follow-up response
    const nextMessageId: string = await ctx.runMutation(
      api.messages.insertMessage,
      {
        conversationId: args.conversationId,
        role: "assistant",
        content: continuation.content,
        modelUsed: continuation.modelUsed,
        promptTokens: continuation.usage?.promptTokens,
        completionTokens: continuation.usage?.completionTokens,
      }
    );

    return {
      success: true,
      messageId: nextMessageId,
      content: continuation.content,
    };
  },
});

/**
 * Discovers available models from provider
 */
export const detectAvailableModels = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
    customBaseUrl: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<DiscoveredModel[]> => {
    return await discoverProviderModels(
      args.provider as LLMProviderType,
      args.apiKey,
      args.customBaseUrl
    );
  },
});

/**
 * Tests a specific model ping and reports response latency and output
 */
export const testModelEndpoint = action({
  args: {
    provider: v.string(),
    model: v.string(),
    apiKey: v.optional(v.string()),
    customBaseUrl: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const startTime = Date.now();
    try {
      const response = await executeLLMCompletion(
        [{ role: "user", content: "Ping! Respond with 'pong' if you receive this." }],
        {
          provider: args.provider as LLMProviderType,
          model: args.model,
          apiKey: args.apiKey || "demo_key",
          customBaseUrl: args.customBaseUrl,
          maxTokens: 50,
          temperature: 0.1,
        }
      );
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        latencyMs,
        modelUsed: response.modelUsed || args.model,
        reply: response.content.trim() || "OK",
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        latencyMs,
        error: err?.message || String(err),
      };
    }
  },
});
