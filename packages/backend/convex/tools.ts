/**
 * Const AI Mobile — Tool Declaration Registry
 * Canonical JSON Schema definitions for all native, visual, privileged, and system tools.
 */

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export const CONST_DEVICE_TOOLS: ToolDefinition[] = [
  // 1. Contacts Management
  {
    type: "function",
    function: {
      name: "device_manageContacts",
      description:
        "Manage phone contacts directly via Android ContactsContract. Supports querying, searching, adding, and deleting contacts.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["get_all", "search", "add", "delete"],
            description: "The contact operation to perform.",
          },
          query: {
            type: "string",
            description: "Search query for contact name or phone number.",
          },
          contact: {
            type: "object",
            description: "Contact details when adding a new contact.",
            properties: {
              name: { type: "string" },
              phoneNumber: { type: "string" },
              email: { type: "string" },
            },
            required: ["name", "phoneNumber"],
          },
          targetContactId: {
            type: "string",
            description: "ID of the contact to delete.",
          },
          targetContactName: {
            type: "string",
            description: "Display name of the contact to delete.",
          },
        },
        required: ["action"],
      },
    },
  },

  // 2. Storage & Media Management
  {
    type: "function",
    function: {
      name: "device_manageStorage",
      description:
        "Scan and clean phone internal storage, find junk cache files, obsolete APKs, duplicate photos, and screenshots.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "scan_junk",
              "clean_junk",
              "scan_duplicates",
              "delete_photos",
              "scan_screenshots",
            ],
            description: "Storage action to perform.",
          },
          targetPaths: {
            type: "array",
            items: { type: "string" },
            description: "List of junk file paths to clean.",
          },
          targetPhotoIds: {
            type: "array",
            items: { type: "string" },
            description: "List of photo IDs or URIs to delete from gallery.",
          },
          olderThanDays: {
            type: "number",
            description: "Filter screenshots older than specified days.",
          },
        },
        required: ["action"],
      },
    },
  },

  // 3. App Management
  {
    type: "function",
    function: {
      name: "device_manageApps",
      description:
        "List installed applications, launch applications, or uninstall applications.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["list_installed", "launch", "uninstall", "disable"],
            description: "App management action.",
          },
          packageName: {
            type: "string",
            description: "The Android package name (e.g. com.google.android.youtube).",
          },
          query: {
            type: "string",
            description: "Search query for app name.",
          },
          forceSilentViaShizuku: {
            type: "boolean",
            description: "Whether to perform silent uninstall using Shizuku privileged ADB bridge.",
          },
        },
        required: ["action"],
      },
    },
  },

  // 4. Hardware Controls
  {
    type: "function",
    function: {
      name: "device_controlHardware",
      description:
        "Inspect and control phone hardware components such as flashlight, volume, battery, and WiFi.",
      parameters: {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["flashlight", "volume", "battery", "wifi"],
            description: "The hardware component.",
          },
          action: {
            type: "string",
            enum: ["get_status", "turn_on", "turn_off", "toggle", "set_level"],
            description: "Action to perform on the hardware component.",
          },
          level: {
            type: "number",
            description: "Level value (e.g. volume level 0-100).",
          },
        },
        required: ["target", "action"],
      },
    },
  },

  // 5. Accessibility Spatial UI Controller
  {
    type: "function",
    function: {
      name: "accessibility_performAction",
      description:
        "Interact visually with the active phone screen using Android Accessibility Service. Simulates taps on (X, Y) coordinates, swipes, text typing, and system navigation.",
      parameters: {
        type: "object",
        properties: {
          actionType: {
            type: "string",
            enum: [
              "tap_coordinates",
              "tap_node",
              "swipe",
              "input_text",
              "press_back",
              "press_home",
              "press_recents",
              "scroll_forward",
              "scroll_backward",
            ],
            description: "The UI interaction action type.",
          },
          coordinates: {
            type: "array",
            items: { type: "number" },
            description: "[X, Y] screen pixel coordinate for tap action.",
          },
          targetNodeId: {
            type: "number",
            description: "ID of the target UI element from the accessibility tree.",
          },
          text: {
            type: "string",
            description: "Text string to input into focused editable field.",
          },
          swipeCoordinates: {
            type: "object",
            properties: {
              startX: { type: "number" },
              startY: { type: "number" },
              endX: { type: "number" },
              endY: { type: "number" },
              durationMs: { type: "number" },
            },
            description: "Coordinates for swipe gestures.",
          },
        },
        required: ["actionType"],
      },
    },
  },

  // 6. Privileged Shizuku Command Execution
  {
    type: "function",
    function: {
      name: "shizuku_executeCommand",
      description:
        "Execute privileged ADB shell commands via Shizuku without requiring device root. Can access /sdcard/Android/data, silent uninstall, and trim caches.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The ADB shell command line to execute (e.g. pm trim-caches 500M).",
          },
          workingDir: {
            type: "string",
            description: "Optional working directory.",
          },
          timeoutMs: {
            type: "number",
            description: "Execution timeout in milliseconds.",
          },
        },
        required: ["command"],
      },
    },
  },

  // 7. Linux Termux Command Execution
  {
    type: "function",
    function: {
      name: "termux_runScript",
      description:
        "Execute Linux terminal scripts (bash, node, python, git) inside the local Termux environment on Android.",
      parameters: {
        type: "object",
        properties: {
          script: {
            type: "string",
            description: "The bash/shell script commands to run.",
          },
          workingDir: {
            type: "string",
            description: "Working directory in Termux (e.g. ~/projects).",
          },
          background: {
            type: "boolean",
            description: "Run in the background without launching foreground terminal window.",
          },
        },
        required: ["script"],
      },
    },
  },

  // 8. Long-Term Memory & Preferences
  {
    type: "function",
    function: {
      name: "system_recordMemory",
      description:
        "Save an important fact, preference, or user instruction to long-term memory for future conversations.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "Unique identifier/topic key (e.g. user_nickname, coding_style).",
          },
          value: {
            type: "string",
            description: "The information or preference to remember.",
          },
          category: {
            type: "string",
            enum: ["preference", "fact", "system_instruction"],
            description: "Category of memory.",
          },
        },
        required: ["key", "value", "category"],
      },
    },
  },
];

/**
 * Builds the comprehensive system prompt for the Const AI agent.
 */
export function buildSystemPrompt(options: {
  persona?: string;
  operatingMode?: string;
  platform?: string;
  memories?: Array<{ key: string; value: string; category: string }>;
  activeModel?: string;
}): string {
  const {
    persona = "You are Const AI, a fast, proactive, and intelligent personal phone assistant and OS operator.",
    operatingMode = "ask_before_change",
    platform = "android",
    memories = [],
    activeModel = "auto",
  } = options;

  let memoryContext = "";
  if (memories.length > 0) {
    memoryContext = `\n\n### User Long-Term Memories & Preferences:\n${memories
      .map((m) => `- [${m.category}] ${m.key}: ${m.value}`)
      .join("\n")}`;
  }

  return `${persona}

### Operational Context:
- Operating Platform: ${platform}
- Active Operating Mode: ${operatingMode}
- Active Model: ${activeModel}
- Current Date/Time: ${new Date().toISOString()}

### Operating Rules:
1. **Device OS Operator**: You have direct tools to query/modify contacts, scan/clean storage, inspect apps, and toggle hardware. Always prefer calling direct native tools for instant results.
2. **Safety & HITL Governance**: Destructive actions (deletions, uninstalls) will be automatically evaluated by the Policy Engine. Be explicit and transparent about what you are about to do.
3. **Response Style**: Be concise, helpful, and natural. When the task involves device actions, invoke the corresponding tool rather than telling the user how to do it manually.${memoryContext}`;
}
