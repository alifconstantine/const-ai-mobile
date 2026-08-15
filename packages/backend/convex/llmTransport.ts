/**
 * Const AI Mobile — Multi-LLM Provider Transport Layer (Hermes Agent Pattern)
 * Universal, provider-agnostic bridge for OpenRouter, Gemini, Anthropic, OpenAI, and Custom Endpoints.
 */

import { ToolDefinition } from "./tools";

export type LLMProviderType =
  | "openrouter"
  | "gemini"
  | "anthropic"
  | "openai"
  | "custom_openai";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: LLMToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd?: number;
  };
  modelUsed: string;
}

export interface ProviderCallOptions {
  provider?: LLMProviderType;
  model?: string;
  apiKey?: string;
  customBaseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
}

export interface DiscoveredModel {
  id: string;
  name: string;
  provider: string;
  contextLength?: number;
  supportsTools: boolean;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

/**
 * Universal dispatcher for LLM completions (Hermes Agent Pattern)
 */
export async function executeLLMCompletion(
  messages: LLMMessage[],
  options: ProviderCallOptions
): Promise<LLMResponse> {
  const {
    provider = "openrouter",
    model = "google/gemini-2.0-flash-001",
    apiKey,
    customBaseUrl,
    temperature = 0.7,
    maxTokens = 2048,
    tools = [],
  } = options;

  if (!apiKey) {
    throw new Error(
      `No API key configured for provider "${provider}". Please configure your API key in Settings.`
    );
  }

  // 1. Resolve Endpoint & Headers based on provider
  let endpoint = "https://openrouter.ai/api/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  switch (provider) {
    case "openrouter":
      endpoint = "https://openrouter.ai/api/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["HTTP-Referer"] = "https://constai.platform";
      headers["X-Title"] = "Const AI Mobile";
      break;

    case "gemini":
      // Uses Gemini's official OpenAI-compatible endpoint
      endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      break;

    case "openai":
      endpoint = "https://api.openai.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      break;

    case "anthropic":
      // Can be routed via OpenRouter or direct messages API adapter
      if (customBaseUrl) {
        endpoint = `${customBaseUrl.replace(/\/+$/, "")}/v1/chat/completions`;
      } else {
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
      }
      headers["Authorization"] = `Bearer ${apiKey}`;
      break;

    case "custom_openai":
      if (!customBaseUrl) {
        throw new Error("Custom Base URL is required for custom_openai provider.");
      }
      endpoint = `${customBaseUrl.replace(/\/+$/, "")}/chat/completions`;
      headers["Authorization"] = `Bearer ${apiKey}`;
      break;
  }

  // 2. Prepare payload in canonical format
  const bodyPayload: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (tools.length > 0) {
    bodyPayload["tools"] = tools;
    bodyPayload["tool_choice"] = "auto";
  }

  // 3. Make HTTP request
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Provider error (${response.status}): ${response.statusText}`;
    try {
      const errJson = JSON.parse(errorText);
      errorMessage = errJson.error?.message || errJson.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage} — ${errorText.slice(0, 300)}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  const choice = result.choices?.[0];
  const message = choice?.message;

  // 4. Parse Tool Calls from Canonical response or Hermes XML fallback
  const parsedToolCalls: LLMToolCall[] = [];

  if (message?.tool_calls && Array.isArray(message.tool_calls)) {
    for (const tc of message.tool_calls) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs =
          typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments;
      } catch {
        parsedArgs = { raw: tc.function.arguments };
      }

      parsedToolCalls.push({
        id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: tc.function.name,
        arguments: parsedArgs,
      });
    }
  }

  // Hermes fallback: Check for <tool_call> tags in content text if native tool_calls was empty
  let textContent = message?.content || "";
  if (parsedToolCalls.length === 0 && textContent.includes("<tool_call>")) {
    const regex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
    let match;
    while ((match = regex.exec(textContent)) !== null) {
      try {
        const rawJson = JSON.parse(match[1].trim());
        if (rawJson.name) {
          parsedToolCalls.push({
            id: `hermes_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: rawJson.name,
            arguments: rawJson.arguments || {},
          });
        }
      } catch {
        // Ignore unparseable tags
      }
    }
    // Clean tool tags from user-facing text
    textContent = textContent.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "").trim();
  }

  return {
    content: textContent,
    toolCalls: parsedToolCalls.length > 0 ? parsedToolCalls : undefined,
    usage: result.usage
      ? {
          promptTokens: result.usage.prompt_tokens || 0,
          completionTokens: result.usage.completion_tokens || 0,
          totalTokens: result.usage.total_tokens || 0,
        }
      : undefined,
    modelUsed: result.model || model,
  };
}

/**
 * Discovers available models from the provider (Hermes Model Discovery)
 */
export async function discoverProviderModels(
  provider: LLMProviderType,
  apiKey: string,
  customBaseUrl?: string
): Promise<DiscoveredModel[]> {
  try {
    let endpoint = "https://openrouter.ai/api/v1/models";
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
    };

    if (provider === "gemini") {
      endpoint = "https://generativelanguage.googleapis.com/v1beta/openai/models";
    } else if (provider === "openai") {
      endpoint = "https://api.openai.com/v1/models";
    } else if (provider === "custom_openai" && customBaseUrl) {
      endpoint = `${customBaseUrl.replace(/\/+$/, "")}/models`;
    }

    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      return getCuratedDefaultModels();
    }

    const data = await res.json();
    const rawList = data.data || [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return getCuratedDefaultModels();
    }

    return rawList.slice(0, 50).map((m: Record<string, unknown>) => ({
      id: String(m.id || ""),
      name: String(m.name || m.id || ""),
      provider: provider,
      contextLength: Number(m.context_length || 128000),
      supportsTools: true,
    }));
  } catch {
    return getCuratedDefaultModels();
  }
}

/**
 * Curated preset models fallback
 */
export function getCuratedDefaultModels(): DiscoveredModel[] {
  return [
    {
      id: "google/gemini-2.0-flash-001",
      name: "Gemini 2.0 Flash (Fastest & Native Tools)",
      provider: "openrouter",
      contextLength: 1000000,
      supportsTools: true,
      pricing: { prompt: 0.1, completion: 0.4 },
    },
    {
      id: "anthropic/claude-3.7-sonnet",
      name: "Claude 3.7 Sonnet (Hybrid Reasoning)",
      provider: "openrouter",
      contextLength: 200000,
      supportsTools: true,
      pricing: { prompt: 3.0, completion: 15.0 },
    },
    {
      id: "deepseek/deepseek-chat",
      name: "DeepSeek V3 (High Efficiency)",
      provider: "openrouter",
      contextLength: 64000,
      supportsTools: true,
      pricing: { prompt: 0.14, completion: 0.28 },
    },
    {
      id: "openai/gpt-4o-mini",
      name: "GPT-4o Mini (Budget Friendly)",
      provider: "openrouter",
      contextLength: 128000,
      supportsTools: true,
      pricing: { prompt: 0.15, completion: 0.6 },
    },
  ];
}
