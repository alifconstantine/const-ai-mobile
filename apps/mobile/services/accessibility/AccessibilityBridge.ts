/**
 * Const AI Mobile — Accessibility Spatial Controller Service
 * TypeScript interface and wrapper for Android UI perception and autonomous spatial gesture execution.
 */

import type {
  AccessibilityActionArgs,
  AccessibilityNodeInfo,
  SpatialUIHierarchySnapshot,
} from "@const-ai/types";

// Safe dynamic accessor for React Native native modules (supporting Web, Node, and Test environments)
let NativeAccessibilityBridge: any = null;
let currentPlatform: string = "web";

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RN = require("react-native");
  if (RN && RN.NativeModules) {
    NativeAccessibilityBridge = RN.NativeModules.AccessibilityBridge || null;
  }
  if (RN && RN.Platform) {
    currentPlatform = RN.Platform.OS;
  }
} catch {
  currentPlatform = typeof process !== "undefined" ? "node" : "web";
}

const isAndroidNative = currentPlatform === "android" && Boolean(NativeAccessibilityBridge);

export interface AccessibilityServiceStatus {
  isServiceRunning: boolean;
  isPermissionGranted: boolean;
  serviceName: string;
}

/**
 * Mock Provider for non-Android environments (Web, Node, Tests, Desktop Companion).
 */
export class AccessibilityBridgeMock {
  static getMockStatus(): AccessibilityServiceStatus {
    return {
      isServiceRunning: true,
      isPermissionGranted: true,
      serviceName: "ConstAccessibilityServiceMock",
    };
  }

  static getMockHierarchySnapshot(): SpatialUIHierarchySnapshot {
    const screenWidth = 1080;
    const screenHeight = 2400;

    const interactiveElements: AccessibilityNodeInfo[] = [
      {
        id: 1,
        text: "WhatsApp",
        contentDescription: "WhatsApp",
        className: "android.widget.TextView",
        packageName: "com.whatsapp",
        viewIdResourceName: "com.whatsapp:id/action_bar_title",
        bounds: [48, 120, 320, 192],
        centerX: 184,
        centerY: 156,
        isClickable: false,
        isEditable: false,
        isScrollable: false,
        isEnabled: true,
      },
      {
        id: 2,
        text: "Search",
        contentDescription: "Search messages and contacts",
        className: "android.widget.ImageView",
        packageName: "com.whatsapp",
        viewIdResourceName: "com.whatsapp:id/menuitem_search",
        bounds: [880, 120, 960, 192],
        centerX: 920,
        centerY: 156,
        isClickable: true,
        isEditable: false,
        isScrollable: false,
        isEnabled: true,
      },
      {
        id: 3,
        text: "Chats",
        contentDescription: "Chats tab",
        className: "android.widget.TextView",
        packageName: "com.whatsapp",
        viewIdResourceName: "com.whatsapp:id/tab_chats",
        bounds: [48, 210, 360, 290],
        centerX: 204,
        centerY: 250,
        isClickable: true,
        isEditable: false,
        isScrollable: false,
        isEnabled: true,
      },
      {
        id: 4,
        text: "John Doe",
        contentDescription: "Chat with John Doe: Hey, are you free today?",
        className: "android.view.ViewGroup",
        packageName: "com.whatsapp",
        viewIdResourceName: "com.whatsapp:id/conversations_row_contact_name",
        bounds: [48, 320, 1032, 480],
        centerX: 540,
        centerY: 400,
        isClickable: true,
        isEditable: false,
        isScrollable: false,
        isEnabled: true,
      },
      {
        id: 5,
        text: "Type a message",
        contentDescription: "Message input text box",
        className: "android.widget.EditText",
        packageName: "com.whatsapp",
        viewIdResourceName: "com.whatsapp:id/entry",
        bounds: [48, 2220, 920, 2340],
        centerX: 484,
        centerY: 2280,
        isClickable: true,
        isEditable: true,
        isScrollable: false,
        isEnabled: true,
      },
      {
        id: 6,
        text: "Send",
        contentDescription: "Send message button",
        className: "android.widget.ImageButton",
        packageName: "com.whatsapp",
        viewIdResourceName: "com.whatsapp:id/send",
        bounds: [940, 2220, 1032, 2340],
        centerX: 986,
        centerY: 2280,
        isClickable: true,
        isEditable: false,
        isScrollable: false,
        isEnabled: true,
      },
    ];

    return {
      timestamp: Date.now(),
      packageName: "com.whatsapp",
      activityName: "com.whatsapp.HomeActivity",
      screenWidth,
      screenHeight,
      interactiveElements,
    };
  }
}

/**
 * Main AccessibilityBridge TypeScript API
 */
export const AccessibilityBridge = {
  /**
   * Returns whether native Accessibility module is loaded on Android
   */
  isNativeAvailable(): boolean {
    return isAndroidNative;
  },

  /**
   * Checks whether ConstAccessibilityService is actively running and enabled
   */
  async checkStatus(): Promise<AccessibilityServiceStatus> {
    if (!isAndroidNative) {
      return AccessibilityBridgeMock.getMockStatus();
    }
    try {
      return await NativeAccessibilityBridge.checkStatus();
    } catch (e: any) {
      return {
        isServiceRunning: false,
        isPermissionGranted: false,
        serviceName: "ConstAccessibilityService",
      };
    }
  },

  /**
   * Opens Android Accessibility settings to enable service
   */
  async openSettings(): Promise<boolean> {
    if (!isAndroidNative) {
      return true;
    }
    const res = await NativeAccessibilityBridge.openAccessibilitySettings();
    return Boolean(res?.success);
  },

  /**
   * Captures active screen UI hierarchy and returns spatial coordinate map
   */
  async captureUIHierarchy(): Promise<SpatialUIHierarchySnapshot> {
    if (!isAndroidNative) {
      return AccessibilityBridgeMock.getMockHierarchySnapshot();
    }
    return await NativeAccessibilityBridge.captureUIHierarchy();
  },

  /**
   * Executes a unified spatial accessibility action
   */
  async performAction(args: AccessibilityActionArgs): Promise<{ success: boolean; actionType?: string; targetNodeId?: number }> {
    if (!isAndroidNative) {
      return {
        success: true,
        actionType: args.actionType,
        targetNodeId: args.targetNodeId,
      };
    }
    return await NativeAccessibilityBridge.performAction(args);
  },

  /**
   * Simulates a screen tap at exact (x, y) coordinates
   */
  async tapCoordinates(x: number, y: number): Promise<{ success: boolean }> {
    return await this.performAction({
      actionType: "tap_coordinates",
      coordinates: [x, y],
    });
  },

  /**
   * Simulates a tap targeting a specific UI element node
   */
  async tapNode(nodeId: number, coordinates?: [number, number]): Promise<{ success: boolean }> {
    return await this.performAction({
      actionType: "tap_node",
      targetNodeId: nodeId,
      coordinates,
    });
  },

  /**
   * Simulates a swipe/drag gesture
   */
  async swipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number = 300
  ): Promise<{ success: boolean }> {
    return await this.performAction({
      actionType: "swipe",
      swipeCoordinates: {
        startX,
        startY,
        endX,
        endY,
        durationMs,
      },
    });
  },

  /**
   * Injects text into an editable view or active focused field
   */
  async inputText(text: string, targetNodeId?: number): Promise<{ success: boolean }> {
    return await this.performAction({
      actionType: "input_text",
      text,
      targetNodeId,
    });
  },

  /**
   * Press system Back button
   */
  async pressBack(): Promise<{ success: boolean }> {
    return await this.performAction({ actionType: "press_back" });
  },

  /**
   * Press system Home button
   */
  async pressHome(): Promise<{ success: boolean }> {
    return await this.performAction({ actionType: "press_home" });
  },

  /**
   * Press system Recents / Overview button
   */
  async pressRecents(): Promise<{ success: boolean }> {
    return await this.performAction({ actionType: "press_recents" });
  },

  /**
   * Scrolls forward on scrollable content
   */
  async scrollForward(targetNodeId?: number): Promise<{ success: boolean }> {
    return await this.performAction({
      actionType: "scroll_forward",
      targetNodeId,
    });
  },

  /**
   * Scrolls backward on scrollable content
   */
  async scrollBackward(targetNodeId?: number): Promise<{ success: boolean }> {
    return await this.performAction({
      actionType: "scroll_backward",
      targetNodeId,
    });
  },
};
