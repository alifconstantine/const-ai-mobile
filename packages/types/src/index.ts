// Operating Modes for Const AI Agent
export type OperatingMode =
  | "plan_mode"
  | "ask_before_change"
  | "edit_automatically"
  | "full_access_yolo";

// Voice Engine & Preset Styles
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

// HITL Pending Action Status
export type PendingActionStatus = "pending" | "approved" | "rejected";
export type PolicyDecision = "allow" | "ask" | "deny";
