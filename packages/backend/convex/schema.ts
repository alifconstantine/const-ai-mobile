import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // 1. Users & Subscription (Convex Auth custom user schema)
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    initials: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("expired"),
        v.literal("pending_payment")
      )
    ),
    subscriptionPlan: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("quarterly"),
        v.literal("yearly")
      )
    ),
    subscriptionExpiresAt: v.optional(v.number()),
    creditsBalanceUsd: v.optional(v.number()),
    createdAt: v.optional(v.number()),
  }).index("email", ["email"]),

  // 2. User Configuration & Operating Mode + Voice Settings
  userConfigs: defineTable({
    userId: v.id("users"),
    inferenceMode: v.union(v.literal("byok"), v.literal("managed_credits")),
    activeModel: v.string(),
    operatingMode: v.union(
      v.literal("plan_mode"),
      v.literal("ask_before_change"),
      v.literal("edit_automatically"),
      v.literal("full_access_yolo")
    ),
    customApiKeys: v.object({
      gemini: v.optional(v.string()),
      anthropic: v.optional(v.string()),
      openAi: v.optional(v.string()),
      openRouter: v.optional(v.string()),
    }),
    customBaseUrl: v.optional(v.string()),
    provider: v.optional(v.string()),
    sessionSpendCapUsd: v.number(),
    systemPersona: v.string(),
    timezone: v.string(),
    temperature: v.number(),

    voiceSettings: v.object({
      ttsEngine: v.union(
        v.literal("local_supertonic"),
        v.literal("cloud_fallback")
      ),
      selectedVoiceStyle: v.string(),
      speakingRate: v.number(),
      enableEmotionTags: v.boolean(),
      autoPlayVoiceResponse: v.boolean(),
      customVoiceStyleId: v.optional(v.id("voiceStyles")),
    }),
  }).index("by_user", ["userId"]),

  // 3. Custom Voice Styles & Presets
  voiceStyles: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    styleKey: v.string(),
    isPreset: v.boolean(),
    description: v.optional(v.string()),
    styleJson: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // 4. Long-Term Memory
  memories: defineTable({
    userId: v.id("users"),
    key: v.string(),
    value: v.string(),
    category: v.union(
      v.literal("preference"),
      v.literal("fact"),
      v.literal("system_instruction")
    ),
    updatedAt: v.number(),
  }).index("by_user_key", ["userId", "key"]),

  // 5. Registered Devices & Pairings
  devices: defineTable({
    userId: v.id("users"),
    deviceName: v.string(),
    platform: v.union(
      v.literal("android"),
      v.literal("ios"),
      v.literal("windows"),
      v.literal("macos"),
      v.literal("linux")
    ),
    deviceRole: v.union(
      v.literal("standalone_host"),
      v.literal("remote_client"),
      v.literal("desktop_runner")
    ),
    publicKey: v.string(),
    isOnline: v.boolean(),
    lastPingAt: v.number(),
    localModelDownloaded: v.optional(v.boolean()),
    shizukuActive: v.optional(v.boolean()),
    accessibilityActive: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  devicePairings: defineTable({
    userId: v.id("users"),
    clientDeviceId: v.id("devices"),
    runnerDeviceId: v.id("devices"),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("revoked")),
    allowedPaths: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_client", ["clientDeviceId"]),

  // 6. Conversations & Chat Threads
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    isPinned: v.boolean(),
    currentPlanId: v.optional(v.id("implementationPlans")),
    targetRunnerDeviceId: v.optional(v.id("devices")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_updated", ["userId", "updatedAt"]),

  // 7. Implementation Plans
  implementationPlans: defineTable({
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
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // 8. Messages & Tool Streams
  messages: defineTable({
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
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // 9. Human-in-the-Loop (HITL) Action Queue
  pendingActions: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    targetDeviceId: v.id("devices"),
    toolName: v.string(),
    actionType: v.optional(v.union(v.literal("shell_command"), v.literal("device_control"), v.literal("file_delete"))),
    command: v.string(),
    workingDir: v.optional(v.string()),
    diffContent: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    stdout: v.optional(v.string()),
    stderr: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_target_device_status", ["targetDeviceId", "status"]),

  // 10. Scheduled Tasks
  scheduledTasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    promptInstruction: v.string(),
    cronExpression: v.string(),
    attachedMcpTools: v.array(v.string()),
    isActive: v.boolean(),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.number(),
  }).index("by_user", ["userId"]),

  // 11. Notes & Reminders
  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    isSyncedToNativeApp: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // 12. Usage Analytics & Cost Tracking
  usageLogs: defineTable({
    userId: v.id("users"),
    model: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    costUsd: v.number(),
    inferenceSource: v.union(v.literal("byok"), v.literal("managed_credits")),
    timestamp: v.number(),
  }).index("by_user_timestamp", ["userId", "timestamp"]),
});
