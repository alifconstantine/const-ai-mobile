import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPlanByConversation = query({
  args: { conversationId: v.optional(v.union(v.id("conversations"), v.string())) },
  handler: async (ctx, args) => {
    if (!args.conversationId || args.conversationId.startsWith("local_")) {
      return null;
    }
    try {
      return await ctx.db
        .query("implementationPlans")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId as any))
        .order("desc")
        .first();
    } catch {
      return null;
    }
  },
});

export const createImplementationPlan = mutation({
  args: {
    conversationId: v.id("conversations"),
    goal: v.string(),
    proposedChanges: v.array(
      v.object({
        filePath: v.string(),
        action: v.union(
          v.literal("create"),
          v.literal("modify"),
          v.literal("delete")
        ),
        explanation: v.string(),
      })
    ),
    verificationSteps: v.array(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const planId = await ctx.db.insert("implementationPlans", {
      conversationId: args.conversationId,
      goal: args.goal,
      proposedChanges: args.proposedChanges,
      verificationSteps: args.verificationSteps,
      status: args.status,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.conversationId, {
      currentPlanId: planId,
      updatedAt: Date.now(),
    });

    return planId;
  },
});

export const updatePlanStatus = mutation({
  args: {
    planId: v.id("implementationPlans"),
    status: v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, {
      status: args.status,
    });
  },
});
