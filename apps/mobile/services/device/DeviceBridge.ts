/**
 * Const AI Mobile — Device Bridge Service
 * TypeScript interface and wrapper for native on-device Android operations.
 */

import type {
  AppItem,
  AppManageArgs,
  ContactItem,
  ContactQueryArgs,
  DuplicatePhotoGroup,
  HardwareControlArgs,
  HardwareStatusResult,
  PhotoItem,
  StorageManageArgs,
  StorageScanResult,
} from "@const-ai/types";

// Safe dynamic accessor for React Native modules to support Web, Node, and Test environments
let DeviceOperator: any = null;
let currentPlatform: string = "web";

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require("react-native");
  if (RN && RN.NativeModules) {
    DeviceOperator = RN.NativeModules.DeviceOperator || null;
  }
  if (RN && RN.Platform) {
    currentPlatform = RN.Platform.OS;
  }
} catch {
  currentPlatform = typeof process !== "undefined" ? "node" : "web";
}

const isAndroidNative = currentPlatform === "android" && Boolean(DeviceOperator);

/**
 * Mock Fallback Data Provider for Web, Test, and non-Android environments.
 */
class DeviceBridgeMock {
  static getMockContacts(): ContactItem[] {
    return [
      {
        id: "1",
        displayName: "Alice Developer",
        phoneNumbers: ["+6281234567890"],
        emails: ["alice@example.com"],
      },
      {
        id: "2",
        displayName: "Bob Engineer",
        phoneNumbers: ["+6289876543210"],
        emails: ["bob@example.com"],
      },
      {
        id: "3",
        displayName: "Test Contact",
        phoneNumbers: ["+628111222333"],
      },
    ];
  }

  static getMockStorageScan(): StorageScanResult {
    return {
      totalStorageBytes: 128 * 1024 * 1024 * 1024, // 128 GB
      freeStorageBytes: 42 * 1024 * 1024 * 1024,  // 42 GB
      junkTotalBytes: 1420 * 1024 * 1024,          // 1.42 GB
      junkFiles: [
        {
          path: "/sdcard/Download/app-release-old.apk",
          fileName: "app-release-old.apk",
          sizeBytes: 85 * 1024 * 1024,
          category: "apk_installer",
        },
        {
          path: "/data/user/0/com.constai.mobile/cache/temp_stream.tmp",
          fileName: "temp_stream.tmp",
          sizeBytes: 12 * 1024 * 1024,
          category: "temp_file",
        },
        {
          path: "/sdcard/Android/data/com.browser/cache",
          fileName: "cache",
          sizeBytes: 450 * 1024 * 1024,
          category: "cache",
        },
      ],
      scannedAt: Date.now(),
    };
  }

  static getMockApps(): AppItem[] {
    return [
      {
        packageName: "com.whatsapp",
        appName: "WhatsApp",
        versionName: "2.24.12.7",
        isSystemApp: false,
      },
      {
        packageName: "com.google.android.youtube",
        appName: "YouTube",
        versionName: "19.34.35",
        isSystemApp: false,
      },
      {
        packageName: "com.gojek.app",
        appName: "Gojek",
        versionName: "4.89.1",
        isSystemApp: false,
      },
      {
        packageName: "com.android.chrome",
        appName: "Chrome",
        versionName: "128.0.6613.88",
        isSystemApp: true,
      },
    ];
  }
}

/**
 * Main DeviceBridge API
 */
export const DeviceBridge = {
  /**
   * Check if native module is available
   */
  isAvailable(): boolean {
    return isAndroidNative;
  },

  // ==========================================
  // 1. Unified Dispatcher Methods
  // ==========================================

  async manageContacts(
    args: ContactQueryArgs
  ): Promise<ContactItem[] | { success: boolean; contactId?: string }> {
    if (!isAndroidNative) {
      if (args.action === "get_all" || args.action === "search") {
        const mock = DeviceBridgeMock.getMockContacts();
        if (args.query) {
          const q = args.query.toLowerCase();
          return mock.filter(
            (c) =>
              c.displayName.toLowerCase().includes(q) ||
              c.phoneNumbers.some((p) => p.includes(q))
          );
        }
        return mock;
      }
      if (args.action === "add") {
        return { success: true, contactId: `mock_${Date.now()}` };
      }
      if (args.action === "delete") {
        return { success: true };
      }
    }
    return await DeviceOperator.manageContacts(args);
  },

  async manageStorage(
    args: StorageManageArgs
  ): Promise<
    | StorageScanResult
    | DuplicatePhotoGroup[]
    | PhotoItem[]
    | { deletedCount: number; freedBytes: number; success?: boolean; status?: string }
  > {
    if (!isAndroidNative) {
      if (args.action === "scan_junk") {
        return DeviceBridgeMock.getMockStorageScan();
      }
      if (args.action === "clean_junk") {
        return {
          deletedCount: args.targetPaths?.length || 5,
          freedBytes: 520 * 1024 * 1024,
          status: "success",
        };
      }
      if (args.action === "scan_duplicates") {
        return [
          {
            originalPhoto: {
              id: "101",
              uri: "content://media/external/images/media/101",
              fileName: "IMG_20260810_001.jpg",
              sizeBytes: 4.2 * 1024 * 1024,
              dateAdded: Math.floor(Date.now() / 1000) - 86400,
              width: 4000,
              height: 3000,
            },
            duplicates: [
              {
                id: "102",
                uri: "content://media/external/images/media/102",
                fileName: "IMG_20260810_001_copy.jpg",
                sizeBytes: 4.2 * 1024 * 1024,
                dateAdded: Math.floor(Date.now() / 1000) - 86000,
                width: 4000,
                height: 3000,
              },
            ],
            potentialSavingsBytes: 4.2 * 1024 * 1024,
          },
        ];
      }
      if (args.action === "scan_screenshots") {
        return [
          {
            id: "201",
            uri: "content://media/external/images/media/201",
            fileName: "Screenshot_20260801-120000.png",
            sizeBytes: 1.5 * 1024 * 1024,
            dateAdded: Math.floor(Date.now() / 1000) - 86400 * 14,
            width: 1080,
            height: 2400,
          },
        ];
      }
      if (args.action === "delete_photos") {
        return {
          deletedCount: args.targetPhotoIds?.length || 1,
          freedBytes: (args.targetPhotoIds?.length || 1) * 3 * 1024 * 1024,
          success: true,
        };
      }
    }
    return await DeviceOperator.manageStorage(args);
  },

  async manageApps(
    args: AppManageArgs
  ): Promise<AppItem[] | { success: boolean }> {
    if (!isAndroidNative) {
      if (args.action === "list_installed") {
        const apps = DeviceBridgeMock.getMockApps();
        if (args.query) {
          const q = args.query.toLowerCase();
          return apps.filter(
            (a) =>
              a.appName.toLowerCase().includes(q) ||
              a.packageName.toLowerCase().includes(q)
          );
        }
        return apps;
      }
      if (args.action === "launch") {
        return { success: true };
      }
    }
    return await DeviceOperator.manageApps(args);
  },

  async controlHardware(
    args: HardwareControlArgs
  ): Promise<HardwareStatusResult | { success: boolean }> {
    if (!isAndroidNative) {
      if (args.target === "flashlight") {
        return {
          flashlightOn: args.action === "turn_on" ? true : args.action === "turn_off" ? false : true,
        };
      }
      if (args.target === "volume") {
        return {
          volumeLevel: args.level ?? 75,
        };
      }
      if (args.target === "battery") {
        return {
          batteryLevel: 85,
          isCharging: true,
        };
      }
      if (args.target === "wifi") {
        return {
          wifiEnabled: true,
        };
      }
    }
    return await DeviceOperator.controlHardware(args);
  },

  // ==========================================
  // 2. Granular Direct Methods
  // ==========================================

  async getContacts(query?: string): Promise<ContactItem[]> {
    return (await this.manageContacts({ action: "get_all", query })) as ContactItem[];
  },

  async searchContacts(query: string): Promise<ContactItem[]> {
    return (await this.manageContacts({ action: "search", query })) as ContactItem[];
  },

  async addContact(
    name: string,
    phoneNumber: string,
    email?: string
  ): Promise<{ success: boolean; contactId?: string }> {
    return (await this.manageContacts({
      action: "add",
      contact: { name, phoneNumber, email },
    })) as { success: boolean; contactId?: string };
  },

  async deleteContact(
    targetContactId?: string,
    targetContactName?: string
  ): Promise<{ success: boolean }> {
    return (await this.manageContacts({
      action: "delete",
      targetContactId,
      targetContactName,
    })) as { success: boolean };
  },

  async scanDuplicatePhotos(): Promise<DuplicatePhotoGroup[]> {
    return (await this.manageStorage({ action: "scan_duplicates" })) as DuplicatePhotoGroup[];
  },

  async scanScreenshots(olderThanDays: number = 0): Promise<PhotoItem[]> {
    return (await this.manageStorage({
      action: "scan_screenshots",
      olderThanDays,
    })) as PhotoItem[];
  },

  async deletePhotos(
    photoIds: string[]
  ): Promise<{ deletedCount: number; freedBytes: number; success?: boolean }> {
    return (await this.manageStorage({
      action: "delete_photos",
      targetPhotoIds: photoIds,
    })) as { deletedCount: number; freedBytes: number; success?: boolean };
  },

  async scanJunkStorage(): Promise<StorageScanResult> {
    return (await this.manageStorage({ action: "scan_junk" })) as StorageScanResult;
  },

  async cleanJunkFiles(
    targetPaths?: string[]
  ): Promise<{ deletedCount: number; freedBytes: number; status?: string }> {
    return (await this.manageStorage({
      action: "clean_junk",
      targetPaths,
    })) as { deletedCount: number; freedBytes: number; status?: string };
  },

  async getInstalledApps(query?: string): Promise<AppItem[]> {
    return (await this.manageApps({ action: "list_installed", query })) as AppItem[];
  },

  async launchApp(packageName: string): Promise<{ success: boolean }> {
    return (await this.manageApps({ action: "launch", packageName })) as { success: boolean };
  },

  async toggleFlashlight(state?: boolean): Promise<{ flashlightOn: boolean }> {
    const action = state === true ? "turn_on" : state === false ? "turn_off" : "toggle";
    const res = await this.controlHardware({ target: "flashlight", action });
    return res as { flashlightOn: boolean };
  },

  async setVolume(
    level: number
  ): Promise<{ volumeLevel: number; streamType?: string }> {
    const res = await this.controlHardware({
      target: "volume",
      action: "set_level",
      level,
    });
    return res as { volumeLevel: number };
  },

  async getBatteryLevel(): Promise<{ batteryLevel: number; isCharging?: boolean }> {
    const res = await this.controlHardware({ target: "battery", action: "get_status" });
    return res as { batteryLevel: number; isCharging?: boolean };
  },

  async getWifiStatus(): Promise<{ wifiEnabled: boolean }> {
    const res = await this.controlHardware({ target: "wifi", action: "get_status" });
    return res as { wifiEnabled: boolean };
  },
};
