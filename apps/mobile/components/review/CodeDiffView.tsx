import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  FileCode,
  Check,
  Undo2,
  ExternalLink,
  ChevronDown,
  FileText,
  CheckCircle2,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@const-ai/backend";
import { useNavigation } from "../../context/NavigationContext";

interface DiffLine {
  lineNum: number;
  type: "add" | "delete" | "normal";
  content: string;
}

export const CodeDiffView: React.FC = () => {
  const [isReviewed, setIsReviewed] = useState(false);
  const { activeConversationId } = useNavigation();

  const pendingActions = useQuery(
    (api as any).pendingActions?.listPendingByConversation,
    activeConversationId ? { conversationId: activeConversationId as any } : "skip"
  );

  const activeAction = useMemo(() => {
    if (!pendingActions || pendingActions.length === 0) return null;
    return pendingActions.find((a: any) => a.diffContent || a.command) || pendingActions[0];
  }, [pendingActions]);

  const { diffLines, fileName, adds, dels } = useMemo(() => {
    if (!activeAction?.diffContent) {
      return { diffLines: [], fileName: "", adds: 0, dels: 0 };
    }
    const lines = activeAction.diffContent.split("\n");
    let addCount = 0;
    let delCount = 0;
    const parsed: DiffLine[] = lines.map((l: string, idx: number) => {
      let type: "add" | "delete" | "normal" = "normal";
      if (l.startsWith("+")) {
        type = "add";
        addCount++;
      } else if (l.startsWith("-")) {
        type = "delete";
        delCount++;
      }
      return {
        lineNum: idx + 1,
        type,
        content: l,
      };
    });
    return {
      diffLines: parsed,
      fileName: activeAction.command || "modified_file",
      adds: addCount,
      dels: delCount,
    };
  }, [activeAction]);

  if (!activeAction || diffLines.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <CheckCircle2 size={32} color="#22c55e" />
        <Text style={styles.emptyTitle}>Working Tree Clean</Text>
        <Text style={styles.emptySubtitle}>
          No pending code diffs or file modifications awaiting review.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* File Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.fileInfo}>
          <View style={styles.fileIconBadge}>
            <FileCode size={12} color="#000" />
          </View>
          <Text style={styles.fileName}>{fileName}</Text>
          <View style={styles.diffPill}>
            <Text style={styles.diffAdd}>+{adds}</Text>
            <Text style={styles.diffDel}>-{dels}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.btnReview, isReviewed && styles.btnReviewed]}
            onPress={() => setIsReviewed(!isReviewed)}
          >
            {isReviewed ? (
              <Check size={12} color="#22c55e" />
            ) : (
              <Text style={styles.btnReviewText}>Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Code Viewer */}
      <ScrollView
        style={styles.codeScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <ScrollView style={styles.verticalScroll} bounces={false}>
          <View style={styles.codeContainer}>
            {diffLines.map((line, index) => {
              const isAdd = line.type === "add";
              const isDel = line.type === "delete";

              return (
                <View
                  key={index}
                  style={[
                    styles.lineRow,
                    isAdd && styles.lineAdd,
                    isDel && styles.lineDel,
                  ]}
                >
                  <Text
                    style={[
                      styles.lineNumber,
                      isAdd && styles.lineNumberAdd,
                      isDel && styles.lineNumberDel,
                    ]}
                  >
                    {line.lineNum}
                  </Text>
                  <Text
                    style={[
                      styles.lineCode,
                      isAdd && styles.lineCodeAdd,
                      isDel && styles.lineCodeDel,
                    ]}
                  >
                    {line.content}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
    display: "flex",
    flexDirection: "column",
  },
  headerBar: {
    height: 40,
    backgroundColor: "#161b22",
    borderBottomWidth: 1,
    borderBottomColor: "#30363d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fileIconBadge: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: "#eab308",
    alignItems: "center",
    justifyContent: "center",
  },
  jsBadge: {
    color: "#000",
    fontSize: 9,
    fontWeight: "bold",
  },
  fileName: {
    color: "#e6edf3",
    fontSize: 12.5,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  diffPill: {
    flexDirection: "row",
    gap: 3,
    backgroundColor: "#21262d",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffAdd: {
    color: "#3fb950",
    fontSize: 11,
    fontWeight: "bold",
  },
  diffDel: {
    color: "#f85149",
    fontSize: 11,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  btnReview: {
    backgroundColor: "#21262d",
    borderWidth: 1,
    borderColor: "#30363d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  btnReviewed: {
    backgroundColor: "#132e22",
    borderColor: "#238636",
  },
  btnReviewText: {
    color: "#c9d1d9",
    fontSize: 11,
    fontWeight: "500",
  },
  btnOpen: {
    backgroundColor: "#21262d",
    borderWidth: 1,
    borderColor: "#30363d",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  btnOpenText: {
    color: "#c9d1d9",
    fontSize: 11,
    fontWeight: "500",
  },
  btnUndo: {
    padding: 4,
    borderRadius: 4,
  },
  codeScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  codeContainer: {
    paddingVertical: 4,
    minWidth: 460,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 1,
    paddingHorizontal: 4,
  },
  lineAdd: {
    backgroundColor: "rgba(46, 160, 67, 0.15)",
  },
  lineDel: {
    backgroundColor: "rgba(248, 81, 73, 0.15)",
  },
  lineNumber: {
    width: 32,
    color: "#484f58",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "right",
    paddingRight: 8,
    userSelect: "none",
  },
  lineNumberAdd: {
    color: "#3fb950",
  },
  lineNumberDel: {
    color: "#f85149",
  },
  lineCode: {
    color: "#c9d1d9",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    flex: 1,
  },
  lineCodeAdd: {
    color: "#7ee787",
  },
  lineCodeDel: {
    color: "#ffa198",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    color: "#fafafa",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  emptySubtitle: {
    color: "#71717a",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});
