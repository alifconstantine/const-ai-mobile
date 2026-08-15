import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listPendingByDevice = query({
  args: {
    targetDeviceId: v.id("devices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pendingActions")
      .withIndex("by_target_device_status", (q) =>
        q.eq("targetDeviceId", args.targetDeviceId).eq("status", "pending")
      )
      .collect();
  },
});

export const createPendingAction = mutation({
  args: {
    userId: v.id("users"),
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
    return await ctx.db.insert("pendingActions", {
      userId: args.userId,
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
    await ctx.db.patch(args.pendingActionId, {
      status: args.status,
      stdout: args.stdout,
      stderr: args.stderr,
    });
  },
});
