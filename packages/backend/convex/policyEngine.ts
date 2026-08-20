/**
 * Const AI Mobile — Policy & Safety Governance Engine
 * Evaluates tool calls against Operating Modes and Safety Risk Matrices.
 */

import {
  ConstToolName,
  OperatingMode,
  PolicyDecision,
  PolicyEvaluationResult,
  RiskLevel,
} from "@const-ai/types";

interface GenericToolArgs {
  action?: string;
  command?: string;
  script?: string;
  target?: string;
  packageName?: string;
  targetContactName?: string;
  targetPhotoIds?: string[];
  targetPaths?: string[];
  [key: string]: unknown;
}

/**
 * Evaluates the risk level and human-readable summary of a tool execution.
 */
export function classifyToolRisk(
  toolName: ConstToolName,
  args: GenericToolArgs
): {
  riskLevel: RiskLevel;
  userFacingSummary: string;
  actionType: "shell_command" | "device_control" | "file_delete";
} {
  switch (toolName) {
    case "device_manageContacts": {
      const action = args.action || "get_all";
      if (action === "delete") {
        return {
          riskLevel: "critical",
          userFacingSummary: `Menghapus kontak ${args.targetContactName ? `"${args.targetContactName}"` : "yang dipilih"} dari buku telepon.`,
          actionType: "device_control",
        };
      }
      if (action === "add") {
        return {
          riskLevel: "medium",
          userFacingSummary: "Menambahkan kontak baru ke buku telepon.",
          actionType: "device_control",
        };
      }
      return {
        riskLevel: "low",
        userFacingSummary: "Membaca atau mencari daftar kontak.",
        actionType: "device_control",
      };
    }

    case "device_manageStorage": {
      const action = args.action || "scan_junk";
      if (action === "delete_photos") {
        const count = args.targetPhotoIds?.length || 0;
        return {
          riskLevel: count > 10 ? "critical" : "medium",
          userFacingSummary: `Menghapus ${count > 0 ? `${count} ` : ""}foto/screenshot dari galeri penyimpanan.`,
          actionType: "file_delete",
        };
      }
      if (action === "clean_junk") {
        return {
          riskLevel: "medium",
          userFacingSummary: "Membersihkan file cache dan temporary sampah dari penyimpanan.",
          actionType: "file_delete",
        };
      }
      return {
        riskLevel: "low",
        userFacingSummary: "Memindai file sampah atau mencari foto duplikat.",
        actionType: "device_control",
      };
    }

    case "device_manageApps": {
      const action = args.action || "list_installed";
      if (action === "uninstall" || action === "disable") {
        return {
          riskLevel: "critical",
          userFacingSummary: `Menghapus instalasi aplikasi "${args.packageName || "aplikasi target"}".`,
          actionType: "device_control",
        };
      }
      return {
        riskLevel: "low",
        userFacingSummary: action === "launch" 
          ? `Membuka aplikasi "${args.packageName || "aplikasi"}".`
          : "Melihat daftar aplikasi yang terpasang.",
        actionType: "device_control",
      };
    }

    case "device_controlHardware": {
      const target = args.target || "flashlight";
      return {
        riskLevel: "low",
        userFacingSummary: `Mengatur hardware ${target} (${args.action || "toggle"}).`,
        actionType: "device_control",
      };
    }

    case "accessibility_performAction": {
      const actionType = args.actionType || "tap_coordinates";
      if (actionType === "press_back" || actionType === "press_home" || actionType === "scroll_forward" || actionType === "scroll_backward") {
        return {
          riskLevel: "low",
          userFacingSummary: `Navigasi layar (${actionType}).`,
          actionType: "device_control",
        };
      }
      return {
        riskLevel: "medium",
        userFacingSummary: `Melakukan interaksi visual pada layar (${actionType}).`,
        actionType: "device_control",
      };
    }

    case "shizuku_executeCommand": {
      const cmd = (args.command || "").trim().toLowerCase();
      const isDestructive =
        cmd.includes("rm -rf") ||
        cmd.includes("pm uninstall") ||
        cmd.includes("format") ||
        cmd.includes("dd ");
      return {
        riskLevel: isDestructive ? "critical" : "medium",
        userFacingSummary: `Mengeksekusi perintah Shizuku ADB: "${args.command || ""}"`,
        actionType: "shell_command",
      };
    }

    case "termux_runScript": {
      const script = (args.script || "").trim().toLowerCase();
      const isDestructive =
        script.includes("rm -rf /") ||
        script.includes(":(){ :|:& };:") ||
        script.includes("mkfs");
      return {
        riskLevel: isDestructive ? "critical" : "medium",
        userFacingSummary: `Menjalankan skrip Linux Termux: "${args.script || ""}"`,
        actionType: "shell_command",
      };
    }

    case "system_updatePlan":
    case "system_recordMemory":
    default: {
      return {
        riskLevel: "low",
        userFacingSummary: "Menyimpan catatan memori atau memperbarui rencana kerja.",
        actionType: "device_control",
      };
    }
  }
}

/**
 * Main Policy Decision Maker:
 * Evaluates whether an action is allowed directly, requires user prompt (HITL), or is denied.
 */
export function evaluateToolPolicy(
  operatingMode: OperatingMode,
  toolName: ConstToolName,
  args: GenericToolArgs,
  hasApprovedPlan: boolean = false
): PolicyEvaluationResult {
  const { riskLevel, userFacingSummary, actionType } = classifyToolRisk(toolName, args);

  // 1. Normal Mode (Default): Pure conversational & code assistant. All device & terminal tools are disabled.
  if (operatingMode === "normal_mode") {
    return {
      decision: "deny",
      riskLevel,
      reason: "Semua eksekusi terminal dan perintah sistem dinonaktifkan pada Normal Mode. Const AI beroperasi sebagai asisten teks & kode murni.",
      userFacingSummary,
      suggestedActionType: actionType,
    };
  }

  // 2. Ask Before Change Mode (Strict Human-in-the-Loop)
  if (operatingMode === "ask_before_change") {
    if (riskLevel === "low") {
      return {
        decision: "allow",
        riskLevel,
        reason: "Low-risk queries and read operations execute automatically.",
        userFacingSummary,
        suggestedActionType: actionType,
      };
    }
    return {
      decision: "ask",
      riskLevel,
      reason: `Action has ${riskLevel} risk and requires user confirmation in Ask-Before-Change mode.`,
      userFacingSummary,
      suggestedActionType: actionType,
    };
  }

  // 3. Plan Mode: AI cannot execute modifying actions without an approved plan
  if (operatingMode === "plan_mode") {
    if (riskLevel === "low") {
      return {
        decision: "allow",
        riskLevel,
        reason: "Read-only and inspection actions are allowed in Plan Mode.",
        userFacingSummary,
        suggestedActionType: actionType,
      };
    }
    if (!hasApprovedPlan) {
      return {
        decision: "ask",
        riskLevel,
        reason: "Modifying action requires an approved Implementation Plan first.",
        userFacingSummary,
        suggestedActionType: actionType,
      };
    }
    return {
      decision: "allow",
      riskLevel,
      reason: "Action permitted under approved Implementation Plan.",
      userFacingSummary,
      suggestedActionType: actionType,
    };
  }

  // 4. Full Access YOLO Mode (Zero Confirmation)
  if (operatingMode === "full_access_yolo") {
    return {
      decision: "allow",
      riskLevel,
      reason: "All actions permitted instantly under Full Access YOLO mode.",
      userFacingSummary,
      suggestedActionType: actionType,
    };
  }

  // Default Fallback
  return {
    decision: "ask",
    riskLevel,
    reason: "Default safety fallback triggered.",
    userFacingSummary,
    suggestedActionType: actionType,
  };
}
