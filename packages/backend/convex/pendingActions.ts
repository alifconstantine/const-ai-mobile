import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireAuthenticatedUser,
} from "./authUtils";

export const listPendingByDevice = query({
  args: {
    targetDeviceId: v.id("devices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pendingActions")
      .withIndex("by_target_device_status", (q: any) =>
        q.eq("targetDeviceId", args.targetDeviceId).eq("status", "pending")
      )
      .collect();
  },
});

export const listPendingByConversation = query({
  args: {
    conversationId: v.optional(v.union(v.id("conversations"), v.string())),
  },
  handler: async (ctx, args) => {
    if (!args.conversationId || args.conversationId.startsWith("local_")) return [];
    try {
      return await ctx.db
        .query("pendingActions")
        .filter((q: any) => q.eq(q.field("conversationId"), args.conversationId as any))
        .collect();
    } catch {
      return [];
    }
  },
});

export const createPendingAction = mutation({
  args: {
    userId: v.optional(v.union(v.id("users"), v.string())),
    conversationId: v.id("conversations"),
    targetDeviceId: v.id("devices"),
    toolName: v.string(),
    actionType: v.optional(
      v.union(
        v.literal("shell_command"),
        v.literal("device_control"),
        v.literal("file_delete")
      )
    ),
    command: v.string(),
    workingDir: v.optional(v.string()),
    diffContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    return await ctx.db.insert("pendingActions", {
      userId,
      conversationId: args.conversationId,
      targetDeviceId: args.targetDeviceId,
      toolName: args.toolName,
      actionType: args.actionType,
      command: args.command,
      workingDir: args.workingDir,
      diffContent: args.diffContent,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const resolvePendingAction = mutation({
  args: {
    pendingActionId: v.id("pendingActions"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    stdout: v.optional(v.string()),
    stderr: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    await ctx.db.patch(args.pendingActionId, {
      status: args.status,
      stdout: args.stdout,
      stderr: args.stderr,
    });
  },
});
