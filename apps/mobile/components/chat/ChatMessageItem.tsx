import React, { useState, useMemo } from "react";
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
  HardDrive,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";
import { PermissionRequiredCard } from "../hitl/PermissionRequiredCard";

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
  pendingActionMap?: Record<string, any>;
}

// Markdown Block Segment Types
type SegmentType =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; language: string; code: string }
  | { type: "list_item"; ordered: boolean; index?: number; text: string }
  | { type: "paragraph"; text: string };

function parseMarkdownSegments(content: string): SegmentType[] {
  if (!content) return [];
  const segments: SegmentType[] = [];
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeLang = "";
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code fence boundary
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        segments.push({
          type: "code",
          language: codeLang || "shell",
          code: codeBuffer.join("\n"),
        });
        inCodeBlock = false;
        codeLang = "";
        codeBuffer = [];
      } else {
        inCodeBlock = true;
        codeLang = line.trim().replace(/^```/, "").trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      segments.push({ type: "heading", level: 3, text: line.replace(/^### /, "").trim() });
    } else if (line.startsWith("## ")) {
      segments.push({ type: "heading", level: 2, text: line.replace(/^## /, "").trim() });
    } else if (line.startsWith("# ")) {
      segments.push({ type: "heading", level: 1, text: line.replace(/^# /, "").trim() });
    }
    // Lists
    else if (line.trim().match(/^[-*•]\s+/)) {
      segments.push({
        type: "list_item",
        ordered: false,
        text: line.trim().replace(/^[-*•]\s+/, ""),
      });
    } else if (line.trim().match(/^\d+\.\s+/)) {
      const match = line.trim().match(/^(\d+)\.\s+(.*)/);
      segments.push({
        type: "list_item",
        ordered: true,
        index: match ? parseInt(match[1], 10) : 1,
        text: match ? match[2] : line,
      });
    }
    // Paragraph / Text
    else if (line.trim().length > 0) {
      segments.push({ type: "paragraph", text: line });
    }
  }

  // Flush any open code block safely
  if (inCodeBlock && codeBuffer.length > 0) {
    segments.push({
      type: "code",
      language: codeLang || "shell",
      code: codeBuffer.join("\n"),
    });
  }

  return segments;
}

export function ChatMessageItem({ message, onCopyPrompt, pendingActionMap = {} }: Props) {
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const { openSideTab } = useNavigation();

  const handleCopy = () => {
    setIsCopied(true);
    if (onCopyPrompt) {
      onCopyPrompt(message.content);
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyCode = (code: string, idx: number) => {
    setCopiedCodeIdx(idx);
    if (onCopyPrompt) {
      onCopyPrompt(code);
    }
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const parsedSegments = useMemo(() => {
    return parseMarkdownSegments(message.content);
  }, [message.content]);

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
            <View style={styles.activityHeaderRight}>
              {message.toolCalls?.some((t) => t.status === "running") && (
                <View style={styles.statusPillRunning}>
                  <Clock size={10} color="#38bdf8" />
                  <Text style={styles.statusPillTextRunning}>Running</Text>
                </View>
              )}
              {message.toolCalls?.some((t) => t.status === "waiting_hitl") && (
                <View style={styles.statusPillHitl}>
                  <Text style={styles.statusPillTextHitl}>Awaiting approval</Text>
                </View>
              )}
              {isActivityExpanded ? (
                <ChevronDown size={14} color="#71717a" />
              ) : (
                <ChevronRight size={14} color="#71717a" />
              )}
            </View>
          </TouchableOpacity>

          {isActivityExpanded && (
            <View style={styles.activityBody}>
              {message.toolCalls?.map((tc, idx) => {
                const isHitl = tc.status === "waiting_hitl";
                const isSuccess = tc.status === "success";
                const isFailed = tc.status === "failed";

                return (
                  <View key={tc.id || idx} style={styles.activityStepItem}>
                    <View style={styles.activityStepRow}>
                      <Terminal size={12} color={isHitl ? "#f59e0b" : "#38bdf8"} />
                      <Text style={styles.activityToolTitle}>{tc.toolName}</Text>
                      {isSuccess && <CheckCircle2 size={12} color="#22c55e" />}
                      {isFailed && <XCircle size={12} color="#ef4444" />}
                      {isHitl && (
                        <Text style={styles.activityBadgeHitl}>Awaiting Approval</Text>
                      )}
                    </View>

                    {/* Arguments preview */}
                    <Text style={styles.activityStepArgs} numberOfLines={2}>
                      {JSON.stringify(tc.args)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Embedded HITL Permission Cards for toolCalls with status 'waiting_hitl' */}
      {message.toolCalls?.map((tc) => {
        if (tc.status !== "waiting_hitl") return null;
        const matchingPendingAction = pendingActionMap[tc.id];

        return (
          <PermissionRequiredCard
            key={tc.id}
            toolCallId={tc.id}
            pendingActionId={matchingPendingAction?._id}
            toolName={tc.toolName}
            command={
              matchingPendingAction?.command ||
              JSON.stringify(tc.args, null, 2)
            }
            workingDir={matchingPendingAction?.workingDir}
            riskLevel={matchingPendingAction?.riskLevel || "medium"}
            status={matchingPendingAction?.status || "pending"}
          />
        );
      })}

      {/* Main AI Rich Formatted Output */}
      <View style={styles.aiTextContainer}>
        {parsedSegments.map((segment, sIdx) => {
          if (segment.type === "heading") {
            const headingStyle =
              segment.level === 1
                ? styles.heading1
                : segment.level === 2
                ? styles.heading2
                : styles.heading3;
            return (
              <Text key={sIdx} style={headingStyle}>
                {segment.text}
              </Text>
            );
          }

          if (segment.type === "code") {
            const isCodeCopied = copiedCodeIdx === sIdx;
            return (
              <View key={sIdx} style={styles.codeBlockContainer}>
                <View style={styles.codeBlockHeader}>
                  <View style={styles.codeHeaderLeft}>
                    <Terminal size={11} color="#71717a" />
                    <Text style={styles.codeLanguageTag}>
                      {segment.language || "code"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.codeCopyButton}
                    onPress={() => handleCopyCode(segment.code, sIdx)}
                    activeOpacity={0.7}
                  >
                    {isCodeCopied ? (
                      <Check size={11} color="#22c55e" />
                    ) : (
                      <Copy size={11} color="#71717a" />
                    )}
                    <Text style={styles.codeCopyText}>
                      {isCodeCopied ? "Copied" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeSnippetText}>{segment.code}</Text>
              </View>
            );
          }

          if (segment.type === "list_item") {
            return (
              <View key={sIdx} style={styles.listItemRow}>
                <Text style={styles.listBullet}>
                  {segment.ordered ? `${segment.index}.` : "•"}
                </Text>
                <Text style={styles.listItemText}>{segment.text}</Text>
              </View>
            );
          }

          return (
            <Text key={sIdx} style={styles.aiParagraph}>
              {segment.text}
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
  activityHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activityTitle: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "500",
  },
  statusPillRunning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#38bdf81a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillTextRunning: {
    color: "#38bdf8",
    fontSize: 10,
    fontWeight: "600",
  },
  statusPillHitl: {
    backgroundColor: "#f59e0b1a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillTextHitl: {
    color: "#f59e0b",
    fontSize: 10,
    fontWeight: "600",
  },
  activityBody: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#202024",
    gap: 8,
    paddingTop: 8,
  },
  activityStepItem: {
    gap: 3,
  },
  activityStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activityToolTitle: {
    color: "#e4e4e7",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  activityBadgeHitl: {
    color: "#f59e0b",
    fontSize: 10,
    backgroundColor: "#f59e0b15",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activityStepArgs: {
    color: "#71717a",
    fontSize: 10.5,
    fontFamily: "monospace",
    backgroundColor: "#0d0d10",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  aiTextContainer: {
    gap: 6,
  },
  heading1: {
    color: "#fafafa",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heading2: {
    color: "#fafafa",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 3,
  },
  heading3: {
    color: "#f4f4f5",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 2,
  },
  aiParagraph: {
    color: "#d4d4d8",
    fontSize: 14,
    lineHeight: 22,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingLeft: 4,
    marginVertical: 1,
  },
  listBullet: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  listItemText: {
    color: "#d4d4d8",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  codeBlockContainer: {
    backgroundColor: "#0d0d10",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#27272a",
    marginVertical: 6,
    overflow: "hidden",
  },
  codeBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#16161a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#222228",
  },
  codeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  codeLanguageTag: {
    color: "#a1a1aa",
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  codeCopyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#202026",
  },
  codeCopyText: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "500",
  },
  codeSnippetText: {
    color: "#e4e4e7",
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
    padding: 10,
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
