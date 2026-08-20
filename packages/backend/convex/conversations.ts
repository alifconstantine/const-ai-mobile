import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireAuthenticatedUser,
  resolveTargetUserId,
} from "./authUtils";

export const listConversations = query({
  args: { userId: v.optional(v.union(v.id("users"), v.string())) },
  handler: async (ctx, args) => {
    const targetUserId = await resolveTargetUserId(ctx, args.userId);

    if (!targetUserId) {
      return [];
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q: any) => q.eq("userId", targetUserId))
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
    workspaceType: v.optional(
      v.union(v.literal("standalone"), v.literal("project_folder"))
    ),
    workingDirectory: v.optional(v.string()),
    targetRunnerDeviceId: v.optional(v.id("devices")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId,
      title: args.title,
      isPinned: false,
      workspaceType: args.workspaceType || "standalone",
      workingDirectory: args.workingDirectory,
      totalTokens: 0,
      totalSpendUsd: 0,
      targetRunnerDeviceId: args.targetRunnerDeviceId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateConversationWorkspace = mutation({
  args: {
    conversationId: v.id("conversations"),
    workspaceType: v.union(v.literal("standalone"), v.literal("project_folder")),
    workingDirectory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    await ctx.db.patch(args.conversationId, {
      workspaceType: args.workspaceType,
      workingDirectory: args.workingDirectory,
      updatedAt: Date.now(),
    });
  },
});

export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const updateConversationStats = mutation({
  args: {
    conversationId: v.id("conversations"),
    addedTokens: v.number(),
    addedCostUsd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return;

    const currentTokens = conv.totalTokens || 0;
    const currentSpend = conv.totalSpendUsd || 0;

    await ctx.db.patch(args.conversationId, {
      totalTokens: currentTokens + args.addedTokens,
      totalSpendUsd: currentSpend + (args.addedCostUsd || 0),
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
    await requireAuthenticatedUser(ctx);

    await ctx.db.patch(args.conversationId, {
      isPinned: args.isPinned,
      updatedAt: Date.now(),
    });
  },
});

