/**
 * Const AI Mobile — Shared Types Definition
 * Single Source of Truth for Backend, Mobile App, Web Dashboard, and Desktop Companion.
 */

// ==========================================
// 1. Operating Modes & Governance
// ==========================================

export type OperatingMode =
  | "plan_mode"
  | "ask_before_change"
  | "edit_automatically"
  | "full_access_yolo";

export type RiskLevel = "low" | "medium" | "critical";
export type PolicyDecision = "allow" | "ask" | "deny";

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  riskLevel: RiskLevel;
  reason: string;
  userFacingSummary: string;
  suggestedActionType?: "shell_command" | "device_control" | "file_delete";
}

// ==========================================
// 2. Voice & On-Device Neural TTS (Supertonic-3)
// ==========================================

export type VoiceEngineType = "local_supertonic" | "cloud_fallback";

export type SupertonicPresetVoice =
  | "M1"
  | "M2"
  | "M3"
  | "M4"
  | "M5"
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5";

export interface VoiceSettings {
  ttsEngine: VoiceEngineType;
  selectedVoiceStyle: string;
  speakingRate: number;
  enableEmotionTags: boolean;
  autoPlayVoiceResponse: boolean;
  customVoiceStyleId?: string;
}

export interface VoiceStylePreset {
  id?: string;
  name: string;
  styleKey: string;
  isPreset: boolean;
  description?: string;
  styleJson: string;
  sampleAudioUrl?: string;
}

// ==========================================
// 3. Android Direct Native Fast-Path Types
// ==========================================

// Contacts Management
export interface ContactItem {
  id: string;
  displayName: string;
  phoneNumbers: string[];
  emails?: string[];
  photoUri?: string;
}

export interface ContactQueryArgs {
  action: "get_all" | "search" | "add" | "delete";
  query?: string;
  contact?: {
    name: string;
    phoneNumber: string;
    email?: string;
  };
  targetContactId?: string;
  targetContactName?: string;
}

// Storage & Media Management
export interface JunkFileItem {
  path: string;
  fileName: string;
  sizeBytes: number;
  category: "cache" | "apk_installer" | "temp_file" | "empty_folder" | "download";
}

export interface StorageScanResult {
  totalStorageBytes: number;
  freeStorageBytes: number;
  junkTotalBytes: number;
  junkFiles: JunkFileItem[];
  scannedAt: number;
}

export interface PhotoItem {
  id: string;
  uri: string;
  fileName: string;
  sizeBytes: number;
  dateAdded: number;
  width?: number;
  height?: number;
}

export interface DuplicatePhotoGroup {
  originalPhoto: PhotoItem;
  duplicates: PhotoItem[];
  potentialSavingsBytes: number;
}

export interface StorageManageArgs {
  action: "scan_junk" | "clean_junk" | "scan_duplicates" | "delete_photos" | "scan_screenshots";
  targetPaths?: string[];
  targetPhotoIds?: string[];
  olderThanDays?: number;
}

// Installed App Management
export interface AppItem {
  packageName: string;
  appName: string;
  versionName?: string;
  isSystemApp: boolean;
  iconUri?: string;
}

export interface AppManageArgs {
  action: "list_installed" | "launch" | "uninstall" | "disable";
  packageName?: string;
  query?: string;
  forceSilentViaShizuku?: boolean;
}

// Hardware Controls
export type HardwareTarget = "flashlight" | "volume" | "battery" | "wifi";

export interface HardwareControlArgs {
  target: HardwareTarget;
  action: "get_status" | "turn_on" | "turn_off" | "toggle" | "set_level";
  level?: number; // 0-100 or volume index
}

export interface HardwareStatusResult {
  flashlightOn?: boolean;
  volumeLevel?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  wifiEnabled?: boolean;
}

// ==========================================
// 4. Accessibility Spatial Interaction Types
// ==========================================

export interface AccessibilityNodeInfo {
  id: number;
  text: string;
  contentDescription: string;
  className: string;
  packageName: string;
  viewIdResourceName?: string;
  bounds: [number, number, number, number]; // [left, top, right, bottom]
  centerX: number;
  centerY: number;
  isClickable: boolean;
  isEditable: boolean;
  isScrollable: boolean;
  isCheckable?: boolean;
  isChecked?: boolean;
  isEnabled: boolean;
  children?: AccessibilityNodeInfo[];
}

export interface SpatialUIHierarchySnapshot {
  timestamp: number;
  packageName: string;
  activityName?: string;
  screenWidth: number;
  screenHeight: number;
  interactiveElements: AccessibilityNodeInfo[];
}

export type AccessibilityActionType =
  | "tap_coordinates"
  | "tap_node"
  | "swipe"
  | "input_text"
  | "press_back"
  | "press_home"
  | "press_recents"
  | "scroll_forward"
  | "scroll_backward";

export interface AccessibilityActionArgs {
  actionType: AccessibilityActionType;
  coordinates?: [number, number]; // [x, y]
  targetNodeId?: number;
  text?: string;
  swipeCoordinates?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    durationMs?: number;
  };
}

// ==========================================
// 5. Privileged Bridges (Shizuku & Termux)
// ==========================================

export interface ShizukuStatus {
  isAvailable: boolean;
  isPermissionGranted: boolean;
  version?: number;
  uid?: number;
  error?: string;
}

export interface ShizukuCommandArgs {
  command: string;
  workingDir?: string;
  timeoutMs?: number;
}

export interface ShizukuCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ShizukuProtectedFileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  lastModified?: number;
}

export interface ShizukuFolderOperationArgs {
  action: "list" | "delete" | "calculate_size" | "clear_cache";
  targetPath: string;
  recursive?: boolean;
}

export interface ShizukuFolderOperationResult {
  path: string;
  success: boolean;
  files?: ShizukuProtectedFileItem[];
  totalSizeBytes?: number;
  deletedCount?: number;
  freedBytes?: number;
  output?: string;
  error?: string;
}

export interface ShizukuAppActionArgs {
  action: "uninstall" | "disable" | "enable" | "force_stop" | "clear_data";
  packageName: string;
  keepData?: boolean;
}

export interface ShizukuAppActionResult {
  packageName: string;
  action: string;
  success: boolean;
  output?: string;
  error?: string;
}

export interface ShizukuTrimCacheArgs {
  desiredFreeBytes?: number;
}

export interface ShizukuTrimCacheResult {
  desiredFreeBytes?: number;
  freedBytes?: number;
  success: boolean;
  output?: string;
  error?: string;
}

export interface TermuxCommandArgs {
  script: string;
  workingDir?: string;
  background?: boolean;
  sessionName?: string;
}

export interface TermuxCommandResult {
  exitCode: number;
  output: string;
  error?: string;
}

// ==========================================
// 6. Tool Calling Schemas & HITL Queue
// ==========================================

export type ConstToolName =
  | "device_manageContacts"
  | "device_manageStorage"
  | "device_manageApps"
  | "device_controlHardware"
  | "accessibility_performAction"
  | "shizuku_executeCommand"
  | "termux_runScript"
  | "system_updatePlan"
  | "system_recordMemory";

export type PendingActionStatus = "pending" | "approved" | "rejected";

export interface PendingActionItem {
  id: string;
  userId: string;
  conversationId: string;
  targetDeviceId: string;
  toolName: ConstToolName;
  actionType: "shell_command" | "device_control" | "file_delete";
  command: string;
  workingDir?: string;
  diffContent?: string;
  status: PendingActionStatus;
  userFacingSummary: string;
  riskLevel: RiskLevel;
  createdAt: number;
}

export interface ToolCallRecord {
  id: string;
  toolName: ConstToolName;
  args: Record<string, unknown>;
  result?: unknown;
  policyDecision: PolicyDecision;
  status: "running" | "waiting_hitl" | "success" | "failed";
  error?: string;
}

// ==========================================
// 7. Device & Platform Context
// ==========================================

export type SupportedPlatform = "android" | "ios" | "windows" | "macos" | "linux";
export type DeviceRole = "standalone_host" | "remote_client" | "desktop_runner";

export interface DeviceInfo {
  id: string;
  deviceName: string;
  platform: SupportedPlatform;
  deviceRole: DeviceRole;
  isOnline: boolean;
  lastPingAt: number;
  localModelDownloaded?: boolean;
  shizukuActive?: boolean;
  accessibilityActive?: boolean;
}
