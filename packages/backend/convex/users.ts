import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
        customBaseUrl: "http://localhost:20128/v1",
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
        customBaseUrl: "http://localhost:20128/v1",
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

