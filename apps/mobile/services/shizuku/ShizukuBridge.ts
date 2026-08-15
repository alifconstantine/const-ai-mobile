/**
 * Const AI Mobile — Shizuku Privileged Bridge Service
 * TypeScript interface and wrapper for privileged Android operations (ADB level without Root).
 */

import type {
  ShizukuAppActionArgs,
  ShizukuAppActionResult,
  ShizukuCommandArgs,
  ShizukuCommandResult,
  ShizukuFolderOperationArgs,
  ShizukuFolderOperationResult,
  ShizukuProtectedFileItem,
  ShizukuStatus,
  ShizukuTrimCacheArgs,
  ShizukuTrimCacheResult,
} from "@const-ai/types";

// Safe dynamic accessor for React Native native modules (supporting Web, Node, and Test environments)
let NativeShizukuBridge: any = null;
let currentPlatform: string = "web";

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require("react-native");
  if (RN && RN.NativeModules) {
    NativeShizukuBridge = RN.NativeModules.ShizukuBridge || null;
  }
  if (RN && RN.Platform) {
    currentPlatform = RN.Platform.OS;
  }
} catch {
  currentPlatform = typeof process !== "undefined" ? "node" : "web";
}

const isAndroidNative = currentPlatform === "android" && Boolean(NativeShizukuBridge);

/**
 * Mock Provider for non-Android environments (Web, Node, Tests, Desktop Companion).
 */
export class ShizukuBridgeMock {
  static getMockStatus(): ShizukuStatus {
    return {
      isAvailable: true,
      isPermissionGranted: true,
      version: 13,
      uid: 2000, // ADB Shell UID
    };
  }

  static getMockFolderItems(targetPath: string = "/sdcard/Android/data"): ShizukuProtectedFileItem[] {
    return [
      {
        name: "com.whatsapp",
        path: `${targetPath}/com.whatsapp`,
        isDirectory: true,
        sizeBytes: 1250 * 1024 * 1024,
        lastModified: Date.now() - 3600000,
      },
      {
        name: "com.google.android.youtube",
        path: `${targetPath}/com.google.android.youtube`,
        isDirectory: true,
        sizeBytes: 420 * 1024 * 1024,
        lastModified: Date.now() - 86400000,
      },
      {
        name: "com.miHoYo.GenshinImpact",
        path: `${targetPath}/com.miHoYo.GenshinImpact`,
        isDirectory: true,
        sizeBytes: 18500 * 1024 * 1024,
        lastModified: Date.now() - 172800000,
      },
      {
        name: "cache",
        path: `${targetPath}/cache`,
        isDirectory: true,
        sizeBytes: 650 * 1024 * 1024,
        lastModified: Date.now() - 600000,
      },
    ];
  }

  static getMockCommandResult(command: string): ShizukuCommandResult {
    const trimmed = command.trim();
    if (trimmed.startsWith("pm trim-caches")) {
      return {
        exitCode: 0,
        stdout: "Trimmed 1.2 GB of system cache.",
        stderr: "",
        durationMs: 85,
      };
    }
    if (trimmed.startsWith("pm uninstall")) {
      return {
        exitCode: 0,
        stdout: "Success",
        stderr: "",
        durationMs: 140,
      };
    }
    if (trimmed.startsWith("pm disable-user") || trimmed.startsWith("pm disable")) {
      return {
        exitCode: 0,
        stdout: "Package disabled",
        stderr: "",
        durationMs: 65,
      };
    }
    if (trimmed.startsWith("id") || trimmed.startsWith("whoami")) {
      return {
        exitCode: 0,
        stdout: "uid=2000(shell) gid=2000(shell) groups=2000(shell)",
        stderr: "",
        durationMs: 12,
      };
    }
    return {
      exitCode: 0,
      stdout: `Mock execution of: ${command}`,
      stderr: "",
      durationMs: 25,
    };
  }
}

/**
 * Main ShizukuBridge TypeScript API
 */
export const ShizukuBridge = {
  /**
   * Returns whether native Shizuku module is loaded on Android
   */
  isNativeAvailable(): boolean {
    return isAndroidNative;
  },

  /**
   * Checks whether Shizuku server is alive and permission is granted
   */
  async checkStatus(): Promise<ShizukuStatus> {
    if (!isAndroidNative) {
      return ShizukuBridgeMock.getMockStatus();
    }
    try {
      return await NativeShizukuBridge.checkStatus();
    } catch (e: any) {
      return {
        isAvailable: false,
        isPermissionGranted: false,
        version: -1,
        uid: -1,
        error: e.message || "Failed to check Shizuku status",
      };
    }
  },

  /**
   * Requests Shizuku permission dialog
   */
  async requestPermission(): Promise<ShizukuStatus> {
    if (!isAndroidNative) {
      return ShizukuBridgeMock.getMockStatus();
    }
    return await NativeShizukuBridge.requestPermission();
  },

  /**
   * Executes a privileged shell command via Shizuku ADB process
   */
  async executeCommand(
    command: string,
    options: { workingDir?: string; timeoutMs?: number } = {}
  ): Promise<ShizukuCommandResult> {
    const { workingDir = "", timeoutMs = 15000 } = options;
    if (!isAndroidNative) {
      return ShizukuBridgeMock.getMockCommandResult(command);
    }
    return await NativeShizukuBridge.executeCommand(command, workingDir, timeoutMs);
  },

  /**
   * Accesses protected Android folder (/Android/data or /Android/obb)
   */
  async accessFolder(args: ShizukuFolderOperationArgs): Promise<ShizukuFolderOperationResult> {
    if (!isAndroidNative) {
      const targetPath = args.targetPath || "/sdcard/Android/data";
      if (args.action === "list") {
        return {
          path: targetPath,
          success: true,
          files: ShizukuBridgeMock.getMockFolderItems(targetPath),
        };
      }
      if (args.action === "calculate_size") {
        return {
          path: targetPath,
          success: true,
          totalSizeBytes: 20820 * 1024 * 1024, // ~20.8 GB
        };
      }
      if (args.action === "delete") {
        return {
          path: targetPath,
          success: true,
          deletedCount: 1,
        };
      }
      if (args.action === "clear_cache") {
        return {
          path: targetPath,
          success: true,
          freedBytes: 650 * 1024 * 1024,
          output: "Cleared 650 MB of hidden app cache.",
        };
      }
    }
    return await NativeShizukuBridge.accessFolder(args);
  },

  /**
   * List files inside protected folder
   */
  async listProtectedFolder(
    targetPath: string = "/sdcard/Android/data",
    recursive: boolean = false
  ): Promise<ShizukuProtectedFileItem[]> {
    const res = await this.accessFolder({ action: "list", targetPath, recursive });
    return res.files || [];
  },

  /**
   * Calculate size of protected folder
   */
  async calculateFolderSize(targetPath: string): Promise<number> {
    const res = await this.accessFolder({ action: "calculate_size", targetPath });
    return res.totalSizeBytes || 0;
  },

  /**
   * Delete specific protected path
   */
  async deleteProtectedPath(targetPath: string): Promise<boolean> {
    const res = await this.accessFolder({ action: "delete", targetPath });
    return Boolean(res.success);
  },

  /**
   * Clear cache inside protected folder
   */
  async clearProtectedFolderCache(
    targetPath: string = "/sdcard/Android/data"
  ): Promise<ShizukuFolderOperationResult> {
    return await this.accessFolder({ action: "clear_cache", targetPath });
  },

  /**
   * Manage app with privileged ADB commands (silent uninstall, disable, enable, force stop, clear data)
   */
  async manageApp(args: ShizukuAppActionArgs): Promise<ShizukuAppActionResult> {
    if (!isAndroidNative) {
      return {
        packageName: args.packageName,
        action: args.action,
        success: true,
        output: `Successfully executed ${args.action} on ${args.packageName}`,
      };
    }
    return await NativeShizukuBridge.manageAppPrivileged(args);
  },

  /**
   * Silent uninstall without system prompt
   */
  async silentUninstall(packageName: string, keepData: boolean = false): Promise<ShizukuAppActionResult> {
    return await this.manageApp({
      action: "uninstall",
      packageName,
      keepData,
    });
  },

  /**
   * Disable app/bloatware without uninstalling
   */
  async disableApp(packageName: string): Promise<ShizukuAppActionResult> {
    return await this.manageApp({
      action: "disable",
      packageName,
    });
  },

  /**
   * Re-enable previously disabled app
   */
  async enableApp(packageName: string): Promise<ShizukuAppActionResult> {
    return await this.manageApp({
      action: "enable",
      packageName,
    });
  },

  /**
   * Force stop app
   */
  async forceStopApp(packageName: string): Promise<ShizukuAppActionResult> {
    return await this.manageApp({
      action: "force_stop",
      packageName,
    });
  },

  /**
   * Clear app data
   */
  async clearAppData(packageName: string): Promise<ShizukuAppActionResult> {
    return await this.manageApp({
      action: "clear_data",
      packageName,
    });
  },

  /**
   * Deep system cache trimming (pm trim-caches)
   */
  async trimCaches(desiredFreeBytes: number = 4 * 1024 * 1024 * 1024): Promise<ShizukuTrimCacheResult> {
    if (!isAndroidNative) {
      return {
        desiredFreeBytes,
        freedBytes: 1200 * 1024 * 1024,
        success: true,
        output: "System caches trimmed successfully (1.2 GB freed).",
      };
    }
    return await NativeShizukuBridge.trimCaches(desiredFreeBytes);
  },
};
