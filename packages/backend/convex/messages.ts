import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listMessages = query({
  args: { conversationId: v.optional(v.union(v.id("conversations"), v.string())) },
  handler: async (ctx, args) => {
    if (!args.conversationId || args.conversationId.startsWith("local_")) {
      return [];
    }
    try {
      return await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId as any))
        .order("asc")
        .collect();
    } catch {
      return [];
    }
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
    totalDurationMs: v.optional(v.number()),
    ttftMs: v.optional(v.number()),
    tokensPerSec: v.optional(v.number()),
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
      totalDurationMs: args.totalDurationMs,
      ttftMs: args.ttftMs,
      tokensPerSec: args.tokensPerSec,
      costUsd: args.costUsd,
      createdAt: now,
    });

    // Update conversation updatedAt timestamp and accumulate stats
    const conv = await ctx.db.get(args.conversationId);
    if (conv) {
      const addedTokens = (args.promptTokens || 0) + (args.completionTokens || 0);
      const currentTokens = conv.totalTokens || 0;
      const currentSpend = conv.totalSpendUsd || 0;
      await ctx.db.patch(args.conversationId, {
        updatedAt: now,
        totalTokens: currentTokens + addedTokens,
        totalSpendUsd: currentSpend + (args.costUsd || 0),
      });
    }

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
