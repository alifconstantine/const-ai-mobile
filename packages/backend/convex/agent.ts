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
  policyDecision: "allow" | "ask" | "deny";
  status: "running" | "waiting_hitl" | "failed" | "success";
  error?: string;
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
      "normal_mode";

    // Clean active model string (strip UI prefixes/suffixes if present)
    const rawModel = args.modelOverride || userConfig?.activeModel || "Const";
    const activeModel = rawModel.split(" (")[0].trim();

    // Check if the requested model belongs to any custom provider in userConfig
    const customProvidersList = userConfig?.customProviders || [];
    const matchedCustomProvider = customProvidersList.find((p: any) =>
      p.models?.some((m: any) => m.id === activeModel || m.name === activeModel || m.id === rawModel)
    ) || customProvidersList.find((p: any) => p.isActive) || customProvidersList[0];

    // Determine LLM provider type
    let provider: LLMProviderType = "custom_openai";
    let matchedBaseUrl = "";
    let matchedApiKey = "";

    if (matchedCustomProvider && (matchedCustomProvider.models?.some((m: any) => m.id === activeModel || m.name === activeModel) || activeModel === "Const")) {
      provider = "custom_openai";
      matchedBaseUrl = matchedCustomProvider.baseUrl || "";
      matchedApiKey = matchedCustomProvider.apiKey || "";
    } else if (activeModel.toLowerCase().startsWith("gemini") || activeModel.toLowerCase().startsWith("google/")) {
      provider = "gemini";
    } else if (activeModel.toLowerCase().startsWith("claude") || activeModel.toLowerCase().startsWith("anthropic/")) {
      provider = "anthropic";
    } else if (activeModel.toLowerCase().startsWith("gpt-") || activeModel.toLowerCase().startsWith("o3-") || activeModel.toLowerCase().startsWith("o1-")) {
      provider = "openai";
    } else if (activeModel.toLowerCase().startsWith("deepseek") || activeModel.toLowerCase().startsWith("openrouter/")) {
      provider = "openrouter";
    } else if (userConfig?.provider) {
      provider = userConfig.provider as LLMProviderType;
    } else {
      provider = "custom_openai";
    }

    const customBaseUrl =
      args.customBaseUrlOverride ||
      matchedBaseUrl ||
      userConfig?.customBaseUrl ||
      "http://localhost:20128/v1";

    // Resolve API key strictly from database user config / custom provider (No server process.env fallback)
    const apiKey =
      args.customApiKeyOverride ||
      matchedApiKey ||
      (provider === "gemini"
        ? userConfig?.customApiKeys?.gemini
        : provider === "anthropic"
        ? userConfig?.customApiKeys?.anthropic
        : provider === "openrouter"
        ? userConfig?.customApiKeys?.openRouter
        : provider === "openai"
        ? userConfig?.customApiKeys?.openAi
        : "") ||
      "";

    if (provider !== "custom_openai" && !apiKey) {
      const providerLabel =
        provider === "gemini"
          ? "Google Gemini"
          : provider === "anthropic"
          ? "Anthropic Claude"
          : provider === "openai"
          ? "OpenAI"
          : "OpenRouter";
      throw new Error(
        `API Key untuk ${providerLabel} belum dikonfigurasi di akun Anda. Silakan masukkan API Key Anda di menu Settings.`
      );
    }

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
    const toolsForLLM = operatingMode === "normal_mode" ? undefined : CONST_DEVICE_TOOLS;

    try {
      llmResponse = await executeLLMCompletion(messages, {
        provider,
        model: activeModel,
        apiKey,
        customBaseUrl,
        tools: toolsForLLM,
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
    const pendingInterceptions: Array<{
      tcId: string;
      toolName: ConstToolName;
      toolArgs: Record<string, unknown>;
      suggestedActionType?: "shell_command" | "device_control" | "file_delete";
      userFacingSummary: string;
      riskLevel: string;
    }> = [];

    for (const tc of llmResponse.toolCalls) {
      const toolName = tc.name as ConstToolName;
      const toolArgs = tc.arguments;

      // Evaluate against operating mode
      const policy = evaluateToolPolicy(operatingMode, toolName, toolArgs);

      if (policy.decision === "deny") {
        evaluatedToolCalls.push({
          id: tc.id,
          toolName,
          args: toolArgs,
          policyDecision: "deny" as const,
          status: "failed" as const,
          error: policy.reason,
        });
      } else if (policy.decision === "ask") {
        pendingInterceptions.push({
          tcId: tc.id,
          toolName,
          toolArgs,
          suggestedActionType: policy.suggestedActionType,
          userFacingSummary: policy.userFacingSummary,
          riskLevel: policy.riskLevel,
        });

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

    // Create pending actions linked to this assistant message
    for (const pi of pendingInterceptions) {
      await ctx.runMutation(api.pendingActions.createPendingAction, {
        userId: args.userId,
        conversationId: args.conversationId,
        targetDeviceId: args.targetDeviceId,
        assistantMessageId: assistantMessageId as any,
        toolCallId: pi.tcId,
        toolName: pi.toolName,
        toolArgs: pi.toolArgs,
        actionType: pi.suggestedActionType,
        command: pi.userFacingSummary,
        riskLevel: pi.riskLevel,
      });
    }

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

    // 2. Insert tool result as a role: "tool" message in conversation history (with context compaction)
    const rawResultStr =
      typeof args.result === "string"
        ? args.result
        : JSON.stringify(args.result, null, 2);
    const compactedResult =
      rawResultStr.length > 4000
        ? rawResultStr.slice(0, 4000) + "\n...[Output truncated to 4000 chars]"
        : rawResultStr;

    await ctx.runMutation(api.messages.insertMessage, {
      conversationId: args.conversationId,
      role: "tool",
      content: compactedResult,
    });

    // 3. Re-fetch message history to resume reasoning loop
    const history = await ctx.runQuery(api.messages.listMessages, {
      conversationId: args.conversationId,
    });

    // Fetch user config to resolve active model and provider
    const userConfig = await ctx.runQuery(api.users.getUserConfig, {
      userId: args.userId,
    });

    const operatingMode: OperatingMode =
      userConfig?.operatingMode || "normal_mode";

    // Find the last assistant modelUsed if available
    const lastAssistantMsg = [...history].reverse().find((m: any) => m.role === "assistant" && m.modelUsed);
    const rawModel = lastAssistantMsg?.modelUsed || userConfig?.activeModel || "Const";
    const activeModel = rawModel.split(" (")[0].trim();

    // Check if the requested model belongs to any custom provider
    const customProvidersList = userConfig?.customProviders || [];
    const matchedCustomProvider = customProvidersList.find((p: any) =>
      p.models?.some((m: any) => m.id === activeModel || m.name === activeModel || m.id === rawModel)
    ) || customProvidersList.find((p: any) => p.isActive) || customProvidersList[0];

    let provider: LLMProviderType = "custom_openai";
    let matchedBaseUrl = "";
    let matchedApiKey = "";

    if (matchedCustomProvider && (matchedCustomProvider.models?.some((m: any) => m.id === activeModel || m.name === activeModel) || activeModel === "Const")) {
      provider = "custom_openai";
      matchedBaseUrl = matchedCustomProvider.baseUrl || "";
      matchedApiKey = matchedCustomProvider.apiKey || "";
    } else if (activeModel.toLowerCase().startsWith("gemini") || activeModel.toLowerCase().startsWith("google/")) {
      provider = "gemini";
    } else if (activeModel.toLowerCase().startsWith("claude") || activeModel.toLowerCase().startsWith("anthropic/")) {
      provider = "anthropic";
    } else if (activeModel.toLowerCase().startsWith("gpt-") || activeModel.toLowerCase().startsWith("o3-") || activeModel.toLowerCase().startsWith("o1-")) {
      provider = "openai";
    } else if (activeModel.toLowerCase().startsWith("deepseek") || activeModel.toLowerCase().startsWith("openrouter/")) {
      provider = "openrouter";
    } else if (userConfig?.provider) {
      provider = userConfig.provider as LLMProviderType;
    } else {
      provider = "custom_openai";
    }

    const customBaseUrl =
      matchedBaseUrl ||
      userConfig?.customBaseUrl ||
      "http://localhost:20128/v1";

    const apiKey =
      matchedApiKey ||
      (provider === "gemini"
        ? userConfig?.customApiKeys?.gemini
        : provider === "anthropic"
        ? userConfig?.customApiKeys?.anthropic
        : provider === "openrouter"
        ? userConfig?.customApiKeys?.openRouter
        : provider === "openai"
        ? userConfig?.customApiKeys?.openAi
        : "") ||
      "";

    if (provider !== "custom_openai" && !apiKey) {
      const providerLabel =
        provider === "gemini"
          ? "Google Gemini"
          : provider === "anthropic"
          ? "Anthropic Claude"
          : provider === "openai"
          ? "OpenAI"
          : "OpenRouter";
      throw new Error(
        `API Key untuk ${providerLabel} belum dikonfigurasi di akun Anda. Silakan masukkan API Key Anda di menu Settings.`
      );
    }

    const systemPrompt = buildSystemPrompt({
      operatingMode,
      activeModel,
      platform: "android",
    });

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-15).map((m: { role: string; content: string; toolCalls?: any[] }) => {
        const msg: LLMMessage = {
          role: m.role as "system" | "user" | "assistant" | "tool",
          content: m.content,
        };
        if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
          msg.tool_calls = m.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.toolName,
              arguments: typeof tc.args === "string" ? tc.args : JSON.stringify(tc.args),
            },
          }));
        }
        if (m.role === "tool") {
          msg.tool_call_id = args.toolCallId;
        }
        return msg;
      }),
    ];

    // 4. Continue generation to summarize tool result for user
    const continuation = await executeLLMCompletion(messages, {
      provider,
      model: activeModel,
      customBaseUrl,
      apiKey,
      tools: operatingMode === "normal_mode" ? undefined : CONST_DEVICE_TOOLS,
    });

    // If continuation requested further tool calls, evaluate and save
    if (continuation.toolCalls && continuation.toolCalls.length > 0) {
      const evaluatedToolCalls: EvaluatedToolCall[] = [];
      const pendingInterceptions: Array<{
        tcId: string;
        toolName: ConstToolName;
        toolArgs: Record<string, unknown>;
        suggestedActionType?: "shell_command" | "device_control" | "file_delete";
        userFacingSummary: string;
        riskLevel: string;
      }> = [];

      for (const tc of continuation.toolCalls) {
        const toolName = tc.name as ConstToolName;
        const toolArgs = tc.arguments;
        const policy = evaluateToolPolicy(operatingMode, toolName, toolArgs);

        if (policy.decision === "deny") {
          evaluatedToolCalls.push({
            id: tc.id,
            toolName,
            args: toolArgs,
            policyDecision: "deny" as const,
            status: "failed" as const,
            error: policy.reason,
          });
        } else if (policy.decision === "ask") {
          pendingInterceptions.push({
            tcId: tc.id,
            toolName,
            toolArgs,
            suggestedActionType: policy.suggestedActionType,
            userFacingSummary: policy.userFacingSummary,
            riskLevel: policy.riskLevel,
          });
          evaluatedToolCalls.push({
            id: tc.id,
            toolName,
            args: toolArgs,
            policyDecision: "ask" as const,
            status: "waiting_hitl" as const,
          });
        } else {
          evaluatedToolCalls.push({
            id: tc.id,
            toolName,
            args: toolArgs,
            policyDecision: "allow" as const,
            status: "running" as const,
          });
        }
      }

      const nextMessageId: string = await ctx.runMutation(
        api.messages.insertMessage,
        {
          conversationId: args.conversationId,
          role: "assistant",
          content:
            continuation.content || "Menjalankan instruksi lanjutan perangkat...",
          toolCalls: evaluatedToolCalls,
          modelUsed: continuation.modelUsed,
          promptTokens: continuation.usage?.promptTokens,
          completionTokens: continuation.usage?.completionTokens,
        }
      );

      for (const pi of pendingInterceptions) {
        await ctx.runMutation(api.pendingActions.createPendingAction, {
          userId: args.userId,
          conversationId: args.conversationId,
          assistantMessageId: nextMessageId as any,
          toolCallId: pi.tcId,
          toolName: pi.toolName,
          toolArgs: pi.toolArgs,
          actionType: pi.suggestedActionType,
          command: pi.userFacingSummary,
          riskLevel: pi.riskLevel,
        });
      }

      return {
        success: true,
        messageId: nextMessageId,
        content: continuation.content,
      };
    }

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
    const apiKey = args.apiKey || "";

    if (args.provider !== "custom_openai" && !apiKey) {
      return {
        success: false,
        latencyMs: 0,
        error: "API Key belum diisi. Silakan masukkan API Key untuk menguji model ini.",
      };
    }

    try {
      const response = await executeLLMCompletion(
        [{ role: "user", content: "Ping! Respond with 'pong' if you receive this." }],
        {
          provider: args.provider as LLMProviderType,
          model: args.model,
          apiKey,
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
