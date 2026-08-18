import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

/**
 * Returns the currently authenticated user based on Convex Auth session, or null if unauthenticated.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      ...user,
      config,
    };
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
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Please sign in to update your profile");
    }

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
      .withIndex("by_email", (q) => q.eq("email", email))
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
        customBaseUrl: "http://localhost:20128/v1",
        customApiKeys: {
          openAi: "sk-7852144cf1690e4d-297ffa-3396d47a",
          openRouter: "sk-7852144cf1690e4d-297ffa-3396d47a",
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
    } else if (config.customBaseUrl === "http://localhost:20128/v1/response") {
      await ctx.db.patch(config._id, {
        customBaseUrl: "http://localhost:20128/v1",
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
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const updateUserConfig = mutation({
  args: {
    userId: v.id("users"),
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
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("userConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!config) return null;

    const patchPayload: Record<string, unknown> = {};
    if (args.activeModel !== undefined) patchPayload.activeModel = args.activeModel;
    if (args.operatingMode !== undefined) patchPayload.operatingMode = args.operatingMode;
    if (args.provider !== undefined) patchPayload.provider = args.provider;
    if (args.customBaseUrl !== undefined) patchPayload.customBaseUrl = args.customBaseUrl;
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
