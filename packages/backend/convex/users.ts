import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { auth } from "./auth";

/**
 * Returns the currently authenticated user based on Clerk JWT identity or Convex Auth session.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    // 1. Check Clerk JWT Identity
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const email = identity.email || "";
      const user = email
        ? await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", email))
            .first()
        : null;

      if (user) {
        const config = await ctx.db
          .query("userConfigs")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        return {
          ...user,
          config,
        };
      }

      // Return virtual identity preview before initial sync
      return {
        _id: undefined,
        name: identity.name || (email ? email.split("@")[0] : "Operator"),
        email: email || undefined,
        username: (identity.nickname as string) || (email ? email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") : "operator"),
        avatarUrl: identity.pictureUrl,
        image: identity.pictureUrl,
        config: null,
      };
    }

    // 2. Check Convex Auth Session
    try {
      const userId = await auth.getUserId(ctx);
      if (userId) {
        const user = await ctx.db.get(userId);
        if (user) {
          const config = await ctx.db
            .query("userConfigs")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();

          return {
            ...user,
            config,
          };
        }
      }
    } catch {
      // ignore
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
    let targetUserId = null;

    const identity = await ctx.auth.getUserIdentity();
    if (identity && identity.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();
      if (user) {
        targetUserId = user._id;
      }
    }

    if (!targetUserId) {
      try {
        targetUserId = await auth.getUserId(ctx);
      } catch {
        // ignore
      }
    }

    if (!targetUserId) {
      throw new Error("Unauthorized: Please sign in to update your profile");
    }

    const patchPayload: Record<string, unknown> = {};
    if (args.name !== undefined) patchPayload.name = args.name;
    if (args.username !== undefined) patchPayload.username = args.username;
    if (args.avatarUrl !== undefined) patchPayload.avatarUrl = args.avatarUrl;
    if (args.initials !== undefined) patchPayload.initials = args.initials;
    if (args.onboardingCompleted !== undefined)
      patchPayload.onboardingCompleted = args.onboardingCompleted;

    await ctx.db.patch(targetUserId, patchPayload);
    return await ctx.db.get(targetUserId);
  },
});

export const getOrCreateDefaultUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email || "alif@constai.platform";
    const name = args.name || "Alif Constantine";

    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    const now = Date.now();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        email,
        name,
        subscriptionStatus: "active",
        subscriptionPlan: "yearly",
        subscriptionExpiresAt: now + 365 * 24 * 60 * 60 * 1000,
        creditsBalanceUsd: 100.0,
        createdAt: now,
      });
      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error("Failed to initialize default user");
    }

    let config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!config) {
      const configId = await ctx.db.insert("userConfigs", {
        userId: user._id,
        inferenceMode: "byok",
        activeModel: "Const",
        operatingMode: "ask_before_change",
        provider: "custom_openai",
        customBaseUrl:
          (typeof process !== "undefined" &&
            process.env.CUSTOM_LLM_BASE_URL) ||
          "",
        customApiKeys: {
          openAi: "",
          openRouter: "",
        },
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
      const defaultUrl =
        (typeof process !== "undefined" && process.env.CUSTOM_LLM_BASE_URL) ||
        "";
      await ctx.db.patch(config._id, {
        customBaseUrl: defaultUrl,
      });
      config = await ctx.db.get(config._id);
    }

    return {
      user,
      config,
    };
  },
});

export const getUserConfig = query({
  args: { userId: v.optional(v.union(v.id("users"), v.string())) },
  handler: async (ctx, args) => {
    let targetUserId: Id<"users"> | null = null;
    if (args.userId && typeof args.userId === "string" && !args.userId.startsWith("user_")) {
      try {
        const userDoc = await ctx.db.get(args.userId as Id<"users">);
        if (userDoc) targetUserId = userDoc._id;
      } catch {
        // ignore
      }
    }
    if (!targetUserId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email))
          .first();
        if (user) targetUserId = user._id;
      }
    }
    if (!targetUserId) {
      return null;
    }
    return await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();
  },
});

export const updateUserConfig = mutation({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
    activeModel: v.optional(v.string()),
    operatingMode: v.optional(
      v.union(
        v.literal("plan_mode"),
        v.literal("ask_before_change"),
        v.literal("edit_automatically"),
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
              supportsTools: v.optional(v.boolean()),
            })
          ),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    let targetUserId: Id<"users"> | null = null;
    if (args.userId && typeof args.userId === "string" && !args.userId.startsWith("user_")) {
      try {
        const userDoc = await ctx.db.get(args.userId as Id<"users">);
        if (userDoc) targetUserId = userDoc._id;
      } catch {
        // ignore
      }
    }
    if (!targetUserId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const user = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email))
          .first();
        if (user) targetUserId = user._id;
      }
    }
    if (!targetUserId) return null;

    const config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();

    if (!config) return null;

    const patchPayload: Record<string, unknown> = {};
    if (args.activeModel !== undefined) patchPayload.activeModel = args.activeModel;
    if (args.operatingMode !== undefined) patchPayload.operatingMode = args.operatingMode;
    if (args.provider !== undefined) patchPayload.provider = args.provider;
    if (args.customBaseUrl !== undefined) patchPayload.customBaseUrl = args.customBaseUrl;
    if (args.customProviders !== undefined) patchPayload.customProviders = args.customProviders;
    if (args.customApiKeys !== undefined) {
      patchPayload.customApiKeys = {
        ...config.customApiKeys,
        ...args.customApiKeys,
      };
    }

    await ctx.db.patch(config._id, patchPayload);
    return await ctx.db.get(config._id);
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
      .withIndex("email", (q) => q.eq("email", email))
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
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!config) {
      const configId = await ctx.db.insert("userConfigs", {
        userId: user._id,
        inferenceMode: "byok",
        activeModel: "Const",
        operatingMode: "ask_before_change",
        provider: "custom_openai",
        customBaseUrl:
          (typeof process !== "undefined" &&
            process.env.CUSTOM_LLM_BASE_URL) ||
          "",
        customApiKeys: {
          openAi: "",
          openRouter: "",
        },
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
      config,
    };
  },
});

/**
 * Returns comprehensive live dashboard summary metrics for the active authenticated user.
 * If there is no activity yet, returns actual zeroed metrics.
 */
export const getDashboardSummary = query({
  args: {},
  handler: async (ctx) => {
    let targetUserId = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity && identity.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();
      if (user) targetUserId = user._id;
    }

    if (!targetUserId) {
      try {
        targetUserId = await auth.getUserId(ctx);
      } catch {
        // ignore
      }
    }

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
      .withIndex("by_user_updated", (q) => q.eq("userId", targetUserId))
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
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
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
    let targetUserId = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity && identity.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();
      if (user) targetUserId = user._id;
    }

    if (!targetUserId) {
      try {
        targetUserId = await auth.getUserId(ctx);
      } catch {
        // ignore
      }
    }

    if (!targetUserId) return [];

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", targetUserId))
      .collect();

    if (conversations.length === 0) return [];

    const logs = [];

    for (const conv of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
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
            status: (msg.toolCalls?.some((t) => t.status === "failed") ? 500 : 200) as 200 | 400 | 429 | 500,
            model,
            provider,
            tokensIn: msg.promptTokens || 0,
            tokensOut: msg.completionTokens || 0,
            durationMs: 0,
            promptSnippet: `Conversation: ${conv.title}`,
            responseSnippet: msg.content || "Tool calling execution turn",
            toolsCalled: msg.toolCalls?.map((t) => t.toolName) || [],
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
    let targetUserId = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity && identity.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();
      if (user) targetUserId = user._id;
    }

    if (!targetUserId) {
      try {
        targetUserId = await auth.getUserId(ctx);
      } catch {
        // ignore
      }
    }

    if (!targetUserId) return [];

    return await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .collect();
  },
});


