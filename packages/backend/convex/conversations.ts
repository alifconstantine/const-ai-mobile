import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const listConversations = query({
  args: { userId: v.optional(v.union(v.id("users"), v.string())) },
  handler: async (ctx, args) => {
    let targetUserId: Id<"users"> | null = null;

    if (args.userId && typeof args.userId === "string") {
      try {
        const userDoc = await ctx.db.get(args.userId as Id<"users">);
        if (userDoc) targetUserId = userDoc._id;
      } catch {
        // not a direct Convex ID
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
      const defaultUser = await ctx.db.query("users").first();
      if (defaultUser) {
        targetUserId = defaultUser._id;
      }
    }

    if (!targetUserId) {
      return [];
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", targetUserId))
      .order("desc")
      .collect();
  },
});

export const getConversation = query({
  args: { conversationId: v.optional(v.union(v.id("conversations"), v.string())) },
  handler: async (ctx, args) => {
    if (!args.conversationId || args.conversationId.startsWith("local_")) {
      return null;
    }
    try {
      return await ctx.db.get(args.conversationId as any);
    } catch {
      return null;
    }
  },
});

export const createConversation = mutation({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
    title: v.string(),
    targetRunnerDeviceId: v.optional(v.id("devices")),
  },
  handler: async (ctx, args) => {
    let targetUserId: Id<"users"> | null = null;

    if (args.userId && typeof args.userId === "string") {
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
      const defaultUser = await ctx.db.query("users").first();
      if (defaultUser) {
        targetUserId = defaultUser._id;
      } else {
        targetUserId = await ctx.db.insert("users", {
          email: "operator@constai.platform",
          name: "Operator",
          subscriptionStatus: "active",
          subscriptionPlan: "yearly",
          subscriptionExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          creditsBalanceUsd: 50.0,
          createdAt: Date.now(),
        });
      }
    }

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: targetUserId,
      title: args.title,
      isPinned: false,
      targetRunnerDeviceId: args.targetRunnerDeviceId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const togglePinConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      isPinned: args.isPinned,
      updatedAt: Date.now(),
    });
  },
});
