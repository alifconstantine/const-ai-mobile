import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Terminal,
  ThumbsUp,
  ThumbsDown,
  Volume2,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

export interface ToolCallItem {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "running" | "waiting_hitl" | "success" | "failed";
}

export interface ChatMessage {
  _id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: ToolCallItem[];
  modelUsed?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  createdAt: number;
}

interface Props {
  message: ChatMessage;
  onCopyPrompt?: (text: string) => void;
}

export function ChatMessageItem({ message, onCopyPrompt }: Props) {
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { openSideTab } = useNavigation();

  const handleCopy = () => {
    setIsCopied(true);
    if (onCopyPrompt) {
      onCopyPrompt(message.content);
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 1. Render User Message Bubble
  if (message.role === "user") {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
        <View style={styles.userFooter}>
          <TouchableOpacity
            style={styles.btnActionMini}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            {isCopied ? (
              <Check size={12} color="#22c55e" />
            ) : (
              <Copy size={12} color="#71717a" />
            )}
            <Text style={styles.btnActionMiniText}>
              {isCopied ? "Copied" : "Copy"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. Render Assistant Response
  const hasToolCalls = Boolean(message.toolCalls && message.toolCalls.length > 0);

  return (
    <View style={styles.aiContainer}>
      {/* Activity Accordion if tools were executed */}
      {hasToolCalls && (
        <View style={styles.activityContainer}>
          <TouchableOpacity
            style={styles.activityHeader}
            onPress={() => setIsActivityExpanded(!isActivityExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.activityHeaderLeft}>
              <Sparkles size={13} color="#38bdf8" />
              <Text style={styles.activityTitle}>
                Executed {message.toolCalls?.length} tools & actions
              </Text>
            </View>
            {isActivityExpanded ? (
              <ChevronDown size={14} color="#71717a" />
            ) : (
              <ChevronRight size={14} color="#71717a" />
            )}
          </TouchableOpacity>

          {isActivityExpanded && (
            <View style={styles.activityBody}>
              {message.toolCalls?.map((tc, idx) => (
                <View key={tc.id || idx} style={styles.activityStepRow}>
                  <Terminal size={11} color="#38bdf8" />
                  <Text style={styles.activityStepText} numberOfLines={1}>
                    {tc.toolName}: {JSON.stringify(tc.args)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Main AI Markdown Text */}
      <View style={styles.aiTextContainer}>
        {message.content.split("\n\n").map((para, pIdx) => {
          if (!para.trim()) return null;
          return (
            <Text key={pIdx} style={styles.aiParagraph}>
              {para}
            </Text>
          );
        })}
      </View>

      {/* Assistant Message Footer */}
      <View style={styles.aiFooter}>
        <View style={styles.footerLeft}>
          {message.modelUsed && (
            <Text style={styles.modelTag}>{message.modelUsed}</Text>
          )}
        </View>
        <View style={styles.footerRight}>
          <TouchableOpacity
            style={styles.footerIconBtn}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            {isCopied ? (
              <Check size={13} color="#22c55e" />
            ) : (
              <Copy size={13} color="#71717a" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerIconBtn} activeOpacity={0.7}>
            <ThumbsUp size={13} color="#71717a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerIconBtn} activeOpacity={0.7}>
            <ThumbsDown size={13} color="#71717a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerIconBtn} activeOpacity={0.7}>
            <Volume2 size={13} color="#71717a" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    marginVertical: 8,
    alignSelf: "flex-end",
    maxWidth: "88%",
  },
  userBubble: {
    backgroundColor: "#18181b",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  userText: {
    color: "#f4f4f5",
    fontSize: 14,
    lineHeight: 20,
  },
  userFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  btnActionMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  btnActionMiniText: {
    color: "#71717a",
    fontSize: 11,
  },
  aiContainer: {
    marginVertical: 12,
    alignSelf: "stretch",
  },
  activityContainer: {
    backgroundColor: "#141416",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#27272a",
    marginBottom: 10,
    overflow: "hidden",
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activityHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activityTitle: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "500",
  },
  activityBody: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#202024",
    gap: 6,
    paddingTop: 6,
  },
  activityStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activityStepText: {
    color: "#a1a1aa",
    fontSize: 11,
    fontFamily: "monospace",
    flex: 1,
  },
  aiTextContainer: {
    gap: 8,
  },
  aiParagraph: {
    color: "#d4d4d8",
    fontSize: 14,
    lineHeight: 22,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  actionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  actionCardTitle: {
    color: "#f4f4f5",
    fontSize: 13,
    fontWeight: "600",
  },
  actionCardSubtitle: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 2,
  },
  btnActionOpen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 2,
  },
  btnActionOpenText: {
    color: "#f4f4f5",
    fontSize: 12,
    fontWeight: "500",
  },
  fileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diffPill: {
    color: "#22c55e",
    backgroundColor: "#14532d33",
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fileCardButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnReviewCode: {
    backgroundColor: "#27272a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnReviewCodeText: {
    color: "#f4f4f5",
    fontSize: 12,
    fontWeight: "500",
  },
  btnUndoMini: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  aiFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#18181b",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modelTag: {
    color: "#52525b",
    fontSize: 10,
    fontFamily: "monospace",
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerIconBtn: {
    padding: 2,
  },
});
