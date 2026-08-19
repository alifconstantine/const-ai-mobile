import { useEffect, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@const-ai/backend";
import { DeviceBridge } from "../services/device/DeviceBridge";
import { ShizukuBridge } from "../services/shizuku/ShizukuBridge";
import { AccessibilityBridge } from "../services/accessibility/AccessibilityBridge";
import { TermuxBridge } from "../services/termux/TermuxBridge";
import { ChatMessage } from "../components/chat/ChatMessageItem";

interface UseDeviceAgentRunnerOptions {
  conversationId: string;
  userId?: string | null;
  messages?: ChatMessage[];
}

export function useDeviceAgentRunner({
  conversationId,
  userId,
  messages,
}: UseDeviceAgentRunnerOptions) {
  const submitToolResultAction = useAction(api.agent.submitToolResult);
  const executedToolCallsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!messages || messages.length === 0 || !conversationId) return;

    // Find the latest assistant message with toolCalls
    const assistantMessages = messages.filter(
      (m) => m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0
    );

    if (assistantMessages.length === 0) return;

    const latestAssistantMsg = assistantMessages[assistantMessages.length - 1];

    if (!latestAssistantMsg.toolCalls) return;

    for (const toolCall of latestAssistantMsg.toolCalls) {
      // If tool is in status 'running' and hasn't been executed yet by this client session
      if (
        toolCall.status === "running" &&
        !executedToolCallsRef.current.has(toolCall.id)
      ) {
        executedToolCallsRef.current.add(toolCall.id);

        executeToolCall(
          toolCall.id,
          toolCall.toolName,
          toolCall.args,
          latestAssistantMsg._id
        );
      }
    }
  }, [messages, conversationId]);

  const executeToolCall = async (
    toolCallId: string,
    toolName: string,
    args: Record<string, unknown>,
    assistantMessageId: string
  ) => {
    let result: unknown = null;
    let status: "success" | "failed" = "success";

    try {
      switch (toolName) {
        // 1. Termux Linux Shell / CLI Script Execution
        case "termux_runScript": {
          const script = (args.script as string) || (args.command as string) || "";
          result = await TermuxBridge.executeScript(script);
          break;
        }

        // 2. Shizuku Privileged System / ADB Execution
        case "shizuku_executeCommand": {
          const cmd = (args.command as string) || "";
          if (args.action === "list_protected" || args.action === "list") {
            result = await ShizukuBridge.listProtectedFolder((args.targetPath as string) || "/sdcard/Android/data");
          } else if (args.action === "clear_cache") {
            result = await ShizukuBridge.clearProtectedFolderCache((args.targetPath as string) || "/sdcard/Android/data");
          } else if (args.action === "trim_caches") {
            result = await ShizukuBridge.trimCaches((args.desiredFreeBytes as number) || 500 * 1024 * 1024);
          } else if (args.action === "silent_uninstall") {
            result = await ShizukuBridge.silentUninstall((args.packageName as string) || "");
          } else {
            result = await ShizukuBridge.executeCommand(cmd);
          }
          break;
        }

        // 3. Direct Native Android - Contacts
        case "device_manageContacts": {
          result = await DeviceBridge.manageContacts(args as any);
          break;
        }

        // 4. Direct Native Android - Storage & Media
        case "device_manageStorage": {
          result = await DeviceBridge.manageStorage(args as any);
          break;
        }

        // 5. Direct Native Android - App Management
        case "device_manageApps": {
          result = await DeviceBridge.manageApps(args as any);
          break;
        }

        // 6. Direct Native Android - Hardware Controls
        case "device_controlHardware": {
          result = await DeviceBridge.controlHardware(args as any);
          break;
        }

        // 7. Accessibility Spatial Interaction Loop
        case "accessibility_performAction": {
          result = await AccessibilityBridge.performAction(args as any);
          break;
        }

        default: {
          result = { success: true, message: `Tool ${toolName} executed locally.` };
        }
      }
    } catch (err: any) {
      status = "failed";
      result = { error: err?.message || String(err) };
    }

    try {
      await submitToolResultAction({
        userId: userId ? (userId as any) : undefined,
        conversationId: conversationId as any,
        assistantMessageId: assistantMessageId as any,
        toolCallId,
        result,
        status,
      });
    } catch (submitErr) {
      console.warn("Failed to submit tool result to Convex:", submitErr);
    }
  };
}
