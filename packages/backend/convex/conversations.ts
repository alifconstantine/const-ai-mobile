import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const createConversation = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    targetRunnerDeviceId: v.optional(v.id("devices")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: args.userId,
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
