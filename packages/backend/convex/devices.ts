import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser, getAuthenticatedUser } from "./authUtils";

/**
 * Generates a 6-digit alphanumeric pairing code for Web Dashboard QR/PIN pairing.
 */
export const generatePairingCode = mutation({
  args: {
    deviceName: v.optional(v.string()),
    platform: v.optional(
      v.union(
        v.literal("android"),
        v.literal("ios"),
        v.literal("windows"),
        v.literal("macos"),
        v.literal("linux")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);

    // Generate clean 6-digit uppercase alphanumeric code, e.g. CNST-4892
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const pairingCode = `CNST-${randomSuffix}`;
    const now = Date.now();

    // Check if a pending pairing device record already exists
    const existingPending = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isOnline"), false))
      .first();

    let deviceId;
    if (existingPending) {
      await ctx.db.patch(existingPending._id, {
        pairingCode,
        lastPingAt: now,
        deviceName: args.deviceName || existingPending.deviceName || "Android Mobile Companion",
      });
      deviceId = existingPending._id;
    } else {
      deviceId = await ctx.db.insert("devices", {
        userId,
        deviceName: args.deviceName || "Android Mobile Companion",
        platform: args.platform || "android",
        deviceRole: "remote_client",
        pairingCode,
        isOnline: false,
        lastPingAt: now,
      });
    }

    const qrPayload = `constai://pair?code=${pairingCode}&userId=${userId}&ts=${now}`;

    return {
      pairingCode,
      qrPayload,
      deviceId,
      expiresInSeconds: 600, // 10 minutes
    };
  },
});

/**
 * Called by Mobile App to confirm pairing using the 6-digit code or QR payload.
 */
export const pairDevice = mutation({
  args: {
    pairingCode: v.string(),
    deviceName: v.string(),
    platform: v.union(
      v.literal("android"),
      v.literal("ios"),
      v.literal("windows"),
      v.literal("macos"),
      v.literal("linux")
    ),
    deviceToken: v.optional(v.string()),
    termuxVersion: v.optional(v.string()),
    shizukuActive: v.optional(v.boolean()),
    accessibilityActive: v.optional(v.boolean()),
    batteryLevel: v.optional(v.number()),
    isCharging: v.optional(v.boolean()),
    ramFreeMb: v.optional(v.number()),
    ramTotalMb: v.optional(v.number()),
    storageFreeGb: v.optional(v.number()),
    storageTotalGb: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cleanCode = args.pairingCode.trim().toUpperCase();

    // Look up device with this pairing code
    const device = await ctx.db
      .query("devices")
      .withIndex("by_pairing_code", (q) => q.eq("pairingCode", cleanCode))
      .first();

    if (!device) {
      // Check if user is authenticated and create device directly
      const authUser = await getAuthenticatedUser(ctx);
      if (authUser.userId) {
        const now = Date.now();
        const newDeviceId = await ctx.db.insert("devices", {
          userId: authUser.userId,
          deviceName: args.deviceName,
          platform: args.platform,
          deviceRole: "standalone_host",
          deviceToken: args.deviceToken,
          isOnline: true,
          lastPingAt: now,
          termuxVersion: args.termuxVersion,
          shizukuActive: args.shizukuActive,
          accessibilityActive: args.accessibilityActive,
          batteryLevel: args.batteryLevel,
          isCharging: args.isCharging,
          ramFreeMb: args.ramFreeMb,
          ramTotalMb: args.ramTotalMb,
          storageFreeGb: args.storageFreeGb,
          storageTotalGb: args.storageTotalGb,
        });

        return {
          success: true,
          deviceId: newDeviceId,
          message: "Device paired directly via active session",
        };
      }

      throw new Error(`Invalid or expired pairing code: ${cleanCode}`);
    }

    const now = Date.now();
    await ctx.db.patch(device._id, {
      deviceName: args.deviceName,
      platform: args.platform,
      deviceToken: args.deviceToken,
      isOnline: true,
      lastPingAt: now,
      termuxVersion: args.termuxVersion,
      shizukuActive: args.shizukuActive,
      accessibilityActive: args.accessibilityActive,
      batteryLevel: args.batteryLevel,
      isCharging: args.isCharging,
      ramFreeMb: args.ramFreeMb,
      ramTotalMb: args.ramTotalMb,
      storageFreeGb: args.storageFreeGb,
      storageTotalGb: args.storageTotalGb,
    });

    return {
      success: true,
      deviceId: device._id,
      userId: device.userId,
      message: "Device successfully paired to Web Dashboard",
    };
  },
});

/**
 * Lists all connected devices for the current user.
 */
export const listUserDevices = query({
  args: {},
  handler: async (ctx) => {
    const authResult = await getAuthenticatedUser(ctx);
    if (!authResult.userId) {
      return [];
    }

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_user", (q) => q.eq("userId", authResult.userId!))
      .collect();

    const now = Date.now();
    return devices.map((d) => {
      // Mark as offline if no ping in last 3 minutes
      const isActuallyOnline = d.isOnline && now - d.lastPingAt < 3 * 60 * 1000;
      return {
        ...d,
        isOnline: isActuallyOnline,
      };
    });
  },
});

/**
 * Updates telemetry and heartbeat for a mobile device.
 */
export const updateDeviceHeartbeat = mutation({
  args: {
    deviceId: v.id("devices"),
    batteryLevel: v.optional(v.number()),
    isCharging: v.optional(v.boolean()),
    ramFreeMb: v.optional(v.number()),
    storageFreeGb: v.optional(v.number()),
    shizukuActive: v.optional(v.boolean()),
    accessibilityActive: v.optional(v.boolean()),
    termuxVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      return { success: false, message: "Device not found" };
    }

    await ctx.db.patch(args.deviceId, {
      isOnline: true,
      lastPingAt: Date.now(),
      batteryLevel: args.batteryLevel ?? device.batteryLevel,
      isCharging: args.isCharging ?? device.isCharging,
      ramFreeMb: args.ramFreeMb ?? device.ramFreeMb,
      storageFreeGb: args.storageFreeGb ?? device.storageFreeGb,
      shizukuActive: args.shizukuActive ?? device.shizukuActive,
      accessibilityActive: args.accessibilityActive ?? device.accessibilityActive,
      termuxVersion: args.termuxVersion ?? device.termuxVersion,
    });

    return { success: true };
  },
});

/**
 * Unpairs and removes a device.
 */
export const unpairDevice = mutation({
  args: {
    deviceId: v.id("devices"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuthenticatedUser(ctx);
    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== userId) {
      throw new Error("Unauthorized or device not found");
    }

    await ctx.db.delete(args.deviceId);
    return { success: true };
  },
});
