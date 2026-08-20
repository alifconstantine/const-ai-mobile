import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  getAuthenticatedUser,
  requireAuthenticatedUser,
  resolveTargetUserId,
} from "./authUtils";

/**
 * Returns the currently authenticated user based on Clerk JWT identity or Convex Auth session.
 * Safely returns null if unauthenticated without leaking any other user's data.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const authResult = await getAuthenticatedUser(ctx);

    if (authResult.user) {
      const config = await ctx.db
        .query("userConfigs")
        .withIndex("by_user", (q: any) => q.eq("userId", authResult.user!._id))
        .first();

      return {
        ...authResult.user,
        config: sanitizeUserConfig(config),
      };
    }

    if (authResult.isVirtualClerkPreview && authResult.virtualProfile) {
      return {
        _id: undefined,
        name: authResult.virtualProfile.name,
        email: authResult.virtualProfile.email,
        username: authResult.virtualProfile.username,
        avatarUrl: authResult.virtualProfile.avatarUrl,
        image: authResult.virtualProfile.avatarUrl,
        config: null,
      };
    }

    return null;
  },
});

/**
 * Updates the profile of the current authenticated user (Full Name, username, avatar).
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    initials: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const patchPayload: Record<string, unknown> = {};
    if (args.name !== undefined) patchPayload.name = args.name;
    if (args.username !== undefined) patchPayload.username = args.username;
    if (args.avatarUrl !== undefined) patchPayload.avatarUrl = args.avatarUrl;
    if (args.initials !== undefined) patchPayload.initials = args.initials;
    if (args.onboardingCompleted !== undefined)
      patchPayload.onboardingCompleted = args.onboardingCompleted;

    await ctx.db.patch(userId, patchPayload);
    return await ctx.db.get(userId);
  },
});

function sanitizeUserConfig(config: any) {
  if (!config) return config;
  const isDummy = (k?: string) => !k || k.startsWith("sk-7852144") || k === "demo_key";
  const customApiKeys = {
    gemini: isDummy(config.customApiKeys?.gemini) ? "" : config.customApiKeys.gemini,
    anthropic: isDummy(config.customApiKeys?.anthropic) ? "" : config.customApiKeys.anthropic,
    openAi: isDummy(config.customApiKeys?.openAi) ? "" : config.customApiKeys.openAi,
    openRouter: isDummy(config.customApiKeys?.openRouter) ? "" : config.customApiKeys.openRouter,
  };
  const customProviders = (config.customProviders || []).map((p: any) => ({
    ...p,
    apiKey: isDummy(p.apiKey) ? "" : p.apiKey,
  }));
  return {
    ...config,
    customApiKeys,
    customProviders,
  };
}

const DEFAULT_CUSTOM_PROVIDERS: any[] = [];

export const getOrCreateDefaultUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if caller is authenticated first
    const authResult = await getAuthenticatedUser(ctx);
    let targetUser = authResult.user;

    const email = args.email || authResult.virtualProfile?.email || targetUser?.email || "alif@constai.platform";
    const name = args.name || authResult.virtualProfile?.name || targetUser?.name || "Alif Constantine";

    const now = Date.now();

    if (!targetUser) {
      targetUser = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", email))
        .first();
    }

    if (!targetUser) {
      const userId = await ctx.db.insert("users", {
        email,
        name,
        subscriptionStatus: "active",
        subscriptionPlan: "yearly",
        subscriptionExpiresAt: now + 365 * 24 * 60 * 60 * 1000,
        creditsBalanceUsd: 100.0,
        createdAt: now,
      });
      targetUser = await ctx.db.get(userId);
    }

    if (!targetUser) {
      throw new Error("Failed to initialize user session");
    }

    let config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUser._id))
      .first();

    if (!config) {
      const configId = await ctx.db.insert("userConfigs", {
        userId: targetUser._id,
        inferenceMode: "byok",
        activeModel: "",
        operatingMode: "normal_mode",
        provider: "custom_openai",
        customBaseUrl: "http://localhost:20128/v1",
        customApiKeys: {
          openAi: "",
          openRouter: "",
          gemini: "",
          anthropic: "",
        },
        customProviders: DEFAULT_CUSTOM_PROVIDERS,
        sessionSpendCapUsd: 50.0,
        systemPersona: "Senior Autonomous AI Mobile System Operator",
        timezone: "Asia/Jakarta",
        temperature: 0.7,
        voiceSettings: {
          ttsEngine: "local_supertonic",
          selectedVoiceStyle: "M1",
          speakingRate: 1.0,
          enableEmotionTags: true,
          autoPlayVoiceResponse: false,
        },
      });
      config = await ctx.db.get(configId);
    } else if (config.customBaseUrl?.includes("/response")) {
      await ctx.db.patch(config._id, {
        customBaseUrl: "http://localhost:20128/v1",
      });
      config = await ctx.db.get(config._id);
    }

    return {
      user: targetUser,
      config: sanitizeUserConfig(config),
    };
  },
});

export const getUserConfig = query({
  args: { userId: v.optional(v.union(v.id("users"), v.string())) },
  handler: async (ctx, args) => {
    const targetUserId = await resolveTargetUserId(ctx, args.userId);
    if (!targetUserId) {
      return null;
    }
    const config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
      .first();
    return sanitizeUserConfig(config);
  },
});

export const updateUserConfig = mutation({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
    activeModel: v.optional(v.string()),
    operatingMode: v.optional(
      v.union(
        v.literal("normal_mode"),
        v.literal("ask_before_change"),
        v.literal("plan_mode"),
        v.literal("full_access_yolo")
      )
    ),
    provider: v.optional(v.string()),
    customBaseUrl: v.optional(v.string()),
    customApiKeys: v.optional(
      v.object({
        gemini: v.optional(v.string()),
        anthropic: v.optional(v.string()),
        openAi: v.optional(v.string()),
        openRouter: v.optional(v.string()),
      })
    ),
    customProviders: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          baseUrl: v.string(),
          apiKey: v.optional(v.string()),
          apiFormat: v.string(),
          isActive: v.boolean(),
          models: v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              contextLength: v.optional(v.number()),
              contextWindow: v.optional(v.number()),
              supportsTools: v.optional(v.boolean()),
            })
          ),
        })
      )
    ),
    sessionSpendCapUsd: v.optional(v.number()),
    systemPersona: v.optional(v.string()),
    timezone: v.optional(v.string()),
    temperature: v.optional(v.number()),
    voiceSettings: v.optional(
      v.object({
        ttsEngine: v.optional(v.union(v.literal("local_supertonic"), v.literal("cloud_fallback"))),
        selectedVoiceStyle: v.optional(v.string()),
        speakingRate: v.optional(v.number()),
        enableEmotionTags: v.optional(v.boolean()),
        autoPlayVoiceResponse: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    const patchPayload: Record<string, unknown> = {};
    if (args.activeModel !== undefined) patchPayload.activeModel = args.activeModel;
    if (args.operatingMode !== undefined) patchPayload.operatingMode = args.operatingMode;
    if (args.provider !== undefined) patchPayload.provider = args.provider;
    if (args.customBaseUrl !== undefined) patchPayload.customBaseUrl = args.customBaseUrl;
    if (args.customApiKeys !== undefined) {
      patchPayload.customApiKeys = {
        gemini: args.customApiKeys.gemini ?? "",
        anthropic: args.customApiKeys.anthropic ?? "",
        openAi: args.customApiKeys.openAi ?? "",
        openRouter: args.customApiKeys.openRouter ?? "",
      };
    }
    if (args.customProviders !== undefined) patchPayload.customProviders = args.customProviders;
    if (args.sessionSpendCapUsd !== undefined)
      patchPayload.sessionSpendCapUsd = args.sessionSpendCapUsd;
    if (args.systemPersona !== undefined) patchPayload.systemPersona = args.systemPersona;
    if (args.timezone !== undefined) patchPayload.timezone = args.timezone;
    if (args.temperature !== undefined) patchPayload.temperature = args.temperature;
    if (args.voiceSettings !== undefined) patchPayload.voiceSettings = args.voiceSettings;

    if (!config) {
      const configId = await ctx.db.insert("userConfigs", {
        userId,
        inferenceMode: "byok",
        activeModel: (args.activeModel as string) || "",
        operatingMode: (args.operatingMode as any) || "normal_mode",
        provider: args.provider || "custom_openai",
        customBaseUrl: args.customBaseUrl || "http://localhost:20128/v1",
        customApiKeys: (args.customApiKeys as any) || {},
        customProviders: (args.customProviders as any) || DEFAULT_CUSTOM_PROVIDERS,
        sessionSpendCapUsd: 50.0,
        systemPersona: "Senior Autonomous AI Mobile System Operator",
        timezone: "Asia/Jakarta",
        temperature: 0.7,
        voiceSettings: {
          ttsEngine: "local_supertonic",
          selectedVoiceStyle: "M1",
          speakingRate: 1.0,
          enableEmotionTags: true,
          autoPlayVoiceResponse: false,
        },
      });
      const res = await ctx.db.get(configId);
      return sanitizeUserConfig(res);
    }

    await ctx.db.patch(config._id, patchPayload);
    const updated = await ctx.db.get(config._id);
    return sanitizeUserConfig(updated);
  },
});

/**
 * Synchronizes a Clerk authenticated user with Convex database.
 */
export const syncClerkUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const email = args.email || identity?.email;
    if (!email) {
      throw new Error("Cannot sync user without email");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", email))
      .first();

    const name = args.name || identity?.name || email.split("@")[0];
    const username =
      args.username ||
      (identity?.nickname as string) ||
      email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
    const avatarUrl = args.avatarUrl || identity?.pictureUrl;

    const now = Date.now();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email,
        name,
        username,
        avatarUrl,
        subscriptionStatus: "active",
        subscriptionPlan: "yearly",
        subscriptionExpiresAt: now + 365 * 24 * 60 * 60 * 1000,
        creditsBalanceUsd: 50.0,
        createdAt: now,
      });
      user = await ctx.db.get(userId);
    } else {
      await ctx.db.patch(user._id, {
        name,
        username: user.username || username,
        avatarUrl: avatarUrl || user.avatarUrl,
      });
      user = await ctx.db.get(user._id);
    }

    if (!user) return null;

    let config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .first();

    if (!config) {
      const configId = await ctx.db.insert("userConfigs", {
        userId: user._id,
        inferenceMode: "byok",
        activeModel: "Const",
        operatingMode: "normal_mode",
        provider: "custom_openai",
        customBaseUrl: "http://localhost:20128/v1",
        customApiKeys: {
          openAi: "",
          openRouter: "",
          gemini: "",
          anthropic: "",
        },
        customProviders: DEFAULT_CUSTOM_PROVIDERS,
        sessionSpendCapUsd: 50.0,
        systemPersona: "Senior Autonomous AI Mobile System Operator",
        timezone: "Asia/Jakarta",
        temperature: 0.7,
        voiceSettings: {
          ttsEngine: "local_supertonic",
          selectedVoiceStyle: "M1",
          speakingRate: 1.0,
          enableEmotionTags: true,
          autoPlayVoiceResponse: false,
        },
      });
      config = await ctx.db.get(configId);
    }

    return {
      user,
      config: sanitizeUserConfig(config),
    };
  },
});

export const resetAllProviders = mutation({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    if (config) {
      await ctx.db.patch(config._id, {
        customApiKeys: {
          gemini: "",
          anthropic: "",
          openAi: "",
          openRouter: "",
        },
        customProviders: [],
        activeModel: "Const",
      });
      return await ctx.db.get(config._id);
    }
    return null;
  },
});

/**
 * Returns comprehensive live dashboard summary metrics for the active authenticated user.
 * If unauthenticated or no activity yet, safely returns zeroed default metrics.
 */
export const getDashboardSummary = query({
  args: {},
  handler: async (ctx) => {
    const authResult = await getAuthenticatedUser(ctx);
    const targetUserId = authResult.userId;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const heatmapDates: { date: string; count: number; level: number }[] = [];
    const dateCountMap = new Map<string, number>();

    for (let i = 97; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      heatmapDates.push({ date: dStr, count: 0, level: 0 });
      dateCountMap.set(dStr, 0);
    }

    const last7DaysMap = new Map<string, { day: string; tokensIn: number; tokensOut: number; messages: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      last7DaysMap.set(dStr, { day: dayLabel, tokensIn: 0, tokensOut: 0, messages: 0 });
    }

    const defaultStats = {
      totalSessions: 0,
      totalMessages: 0,
      activeDays: 0,
      currentStreak: 0,
      favoriteModel: "None",
      tokensIn: 0,
      tokensOut: 0,
      totalTokens: 0,
      ioRatio: "0.0",
      providerBreakdown: {
        all: { tokensIn: 0, tokensOut: 0, label: "All Providers Combined" },
        omniroute: { tokensIn: 0, tokensOut: 0, label: "OmniRoute (Local Gateway)" },
        gemini: { tokensIn: 0, tokensOut: 0, label: "Google Gemini Direct" },
        openrouter: { tokensIn: 0, tokensOut: 0, label: "OpenRouter Multi-LLM" },
        anthropic: { tokensIn: 0, tokensOut: 0, label: "Anthropic Claude" },
        openai: { tokensIn: 0, tokensOut: 0, label: "OpenAI GPT" },
      },
      dailyTrend: Array.from(last7DaysMap.values()),
      heatmap: heatmapDates,
    };

    if (!targetUserId) {
      return defaultStats;
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q: any) => q.eq("userId", targetUserId))
      .collect();

    const totalSessions = conversations.length;
    if (totalSessions === 0) {
      return defaultStats;
    }

    let totalMessages = 0;
    let tokensIn = 0;
    let tokensOut = 0;
    const modelFrequency = new Map<string, number>();
    const activeDateSet = new Set<string>();

    const providerTokens: Record<string, { tokensIn: number; tokensOut: number; label: string }> = {
      all: { tokensIn: 0, tokensOut: 0, label: "All Providers Combined" },
      omniroute: { tokensIn: 0, tokensOut: 0, label: "OmniRoute (Local Gateway)" },
      gemini: { tokensIn: 0, tokensOut: 0, label: "Google Gemini Direct" },
      openrouter: { tokensIn: 0, tokensOut: 0, label: "OpenRouter Multi-LLM" },
      anthropic: { tokensIn: 0, tokensOut: 0, label: "Anthropic Claude" },
      openai: { tokensIn: 0, tokensOut: 0, label: "OpenAI GPT" },
    };

    for (const conv of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", conv._id))
        .collect();

      totalMessages += messages.length;

      for (const msg of messages) {
        const msgDate = new Date(msg.createdAt).toISOString().split("T")[0];
        activeDateSet.add(msgDate);

        if (dateCountMap.has(msgDate)) {
          dateCountMap.set(msgDate, (dateCountMap.get(msgDate) || 0) + 1);
        }

        const msgIn = msg.promptTokens || 0;
        const msgOut = msg.completionTokens || 0;

        tokensIn += msgIn;
        tokensOut += msgOut;
        providerTokens.all.tokensIn += msgIn;
        providerTokens.all.tokensOut += msgOut;

        const modelName = msg.modelUsed?.toLowerCase() || "";
        if (modelName) {
          modelFrequency.set(modelName, (modelFrequency.get(modelName) || 0) + 1);

          if (modelName.includes("omni") || modelName.includes("localhost") || modelName.includes("const")) {
            providerTokens.omniroute.tokensIn += msgIn;
            providerTokens.omniroute.tokensOut += msgOut;
          } else if (modelName.includes("gemini")) {
            providerTokens.gemini.tokensIn += msgIn;
            providerTokens.gemini.tokensOut += msgOut;
          } else if (modelName.includes("claude") || modelName.includes("anthropic")) {
            providerTokens.anthropic.tokensIn += msgIn;
            providerTokens.anthropic.tokensOut += msgOut;
          } else if (modelName.includes("gpt") || modelName.includes("openai")) {
            providerTokens.openai.tokensIn += msgIn;
            providerTokens.openai.tokensOut += msgOut;
          } else {
            providerTokens.openrouter.tokensIn += msgIn;
            providerTokens.openrouter.tokensOut += msgOut;
          }
        }

        if (last7DaysMap.has(msgDate)) {
          const entry = last7DaysMap.get(msgDate)!;
          entry.tokensIn += msgIn;
          entry.tokensOut += msgOut;
          entry.messages += 1;
        }
      }
    }

    let favoriteModel = "None";
    let maxFreq = 0;
    for (const [model, freq] of modelFrequency.entries()) {
      if (freq > maxFreq) {
        maxFreq = freq;
        favoriteModel = model;
      }
    }

    let currentStreak = 0;
    const checkDate = new Date(now);
    const todayActive = activeDateSet.has(todayStr);
    if (todayActive) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split("T")[0];
      if (!activeDateSet.has(yesterdayStr)) {
        currentStreak = 0;
      }
    }

    if (currentStreak > 0 || activeDateSet.has(checkDate.toISOString().split("T")[0])) {
      while (true) {
        const dStr = checkDate.toISOString().split("T")[0];
        if (activeDateSet.has(dStr)) {
          if (!todayActive && currentStreak === 0) {
            currentStreak = 1;
          } else if (todayActive) {
            currentStreak++;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    let maxDayCount = 1;
    for (const count of dateCountMap.values()) {
      if (count > maxDayCount) maxDayCount = count;
    }

    const computedHeatmap = heatmapDates.map((item) => {
      const count = dateCountMap.get(item.date) || 0;
      let level = 0;
      if (count > 0) {
        const ratio = count / maxDayCount;
        level = ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
      }
      return {
        date: item.date,
        count,
        level,
      };
    });

    const totalTokens = tokensIn + tokensOut;
    const ioRatio = tokensOut > 0 ? (tokensIn / tokensOut).toFixed(1) : "0.0";

    return {
      totalSessions,
      totalMessages,
      activeDays: activeDateSet.size,
      currentStreak,
      favoriteModel: favoriteModel === "None" ? "None" : favoriteModel,
      tokensIn,
      tokensOut,
      totalTokens,
      ioRatio,
      providerBreakdown: providerTokens,
      dailyTrend: Array.from(last7DaysMap.values()),
      heatmap: computedHeatmap,
    };
  },
});

/**
 * Returns recent LLM call logs for the inspector table.
 */
export const listRecentLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxItems = args.limit || 50;
    const authResult = await getAuthenticatedUser(ctx);
    const targetUserId = authResult.userId;

    if (!targetUserId) return [];

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q: any) => q.eq("userId", targetUserId))
      .collect();

    if (conversations.length === 0) return [];

    const logs = [];

    for (const conv of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", conv._id))
        .order("desc")
        .take(maxItems);

      for (const msg of messages) {
        if (msg.role === "assistant" || (msg.toolCalls && msg.toolCalls.length > 0)) {
          const model = msg.modelUsed || "const-agent";
          let provider: "OMNIROUTE" | "GEMINI" | "OPENROUTER" | "ANTHROPIC" | "OPENAI" | "CUSTOM" = "CUSTOM";

          const lower = model.toLowerCase();
          if (lower.includes("omni") || lower.includes("localhost") || lower.includes("const")) {
            provider = "OMNIROUTE";
          } else if (lower.includes("gemini")) {
            provider = "GEMINI";
          } else if (lower.includes("claude") || lower.includes("anthropic")) {
            provider = "ANTHROPIC";
          } else if (lower.includes("gpt") || lower.includes("openai")) {
            provider = "OPENAI";
          } else if (lower.includes("openrouter") || lower.includes("/")) {
            provider = "OPENROUTER";
          }

          logs.push({
            id: msg._id,
            timestamp: msg.createdAt,
            status: (msg.toolCalls?.some((t: any) => t.status === "failed") ? 500 : 200) as 200 | 400 | 429 | 500,
            model,
            provider,
            tokensIn: msg.promptTokens || 0,
            tokensOut: msg.completionTokens || 0,
            durationMs: 0,
            promptSnippet: `Conversation: ${conv.title}`,
            responseSnippet: msg.content || "Tool calling execution turn",
            toolsCalled: msg.toolCalls?.map((t: any) => t.toolName) || [],
          });
        }
      }
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, maxItems);
  },
});

/**
 * Lists connected devices for the authenticated user.
 */
export const listDevices = query({
  args: {},
  handler: async (ctx) => {
    const authResult = await getAuthenticatedUser(ctx);
    const targetUserId = authResult.userId;

    if (!targetUserId) return [];

    return await ctx.db
      .query("devices")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
      .collect();
  },
});
