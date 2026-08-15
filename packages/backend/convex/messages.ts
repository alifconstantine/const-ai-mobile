import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

export const insertMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
      v.literal("tool")
    ),
    content: v.string(),
    toolCalls: v.optional(
      v.array(
        v.object({
          id: v.string(),
          toolName: v.string(),
          args: v.any(),
          result: v.optional(v.any()),
          policyDecision: v.union(
            v.literal("allow"),
            v.literal("ask"),
            v.literal("deny")
          ),
          status: v.union(
            v.literal("running"),
            v.literal("waiting_hitl"),
            v.literal("success"),
            v.literal("failed")
          ),
        })
      )
    ),
    modelUsed: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    costUsd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls,
      modelUsed: args.modelUsed,
      promptTokens: args.promptTokens,
      completionTokens: args.completionTokens,
      costUsd: args.costUsd,
      createdAt: now,
    });

    // Update conversation updatedAt timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: now,
    });

    return messageId;
  },
});

export const updateToolCallResult = mutation({
  args: {
    messageId: v.id("messages"),
    toolCallId: v.string(),
    result: v.any(),
    status: v.union(
      v.literal("running"),
      v.literal("waiting_hitl"),
      v.literal("success"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || !message.toolCalls) return;

    const updatedToolCalls = message.toolCalls.map((tc) => {
      if (tc.id === args.toolCallId) {
        return {
          ...tc,
          result: args.result,
          status: args.status,
        };
      }
      return tc;
    });

    await ctx.db.patch(args.messageId, {
      toolCalls: updatedToolCalls,
    });
  },
});
