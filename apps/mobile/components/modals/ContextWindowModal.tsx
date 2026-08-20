import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import {
  Zap,
  Clock,
  Coins,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@const-ai/backend";
import { useNavigation } from "../../context/NavigationContext";

export const ContextWindowModal: React.FC = () => {
  const {
    isContextMeterOpen,
    setContextMeterOpen,
    activeConversationId,
    activeModel,
    userConfig,
  } = useNavigation();

  // Query live messages to calculate real token & telemetry metrics
  const messages = useQuery(
    api.messages.listMessages,
    activeConversationId ? { conversationId: activeConversationId as any } : "skip"
  );

  const telemetryStats = useMemo(() => {
    let inputTokens = 0;
    let outputTokens = 0;
    let totalSpend = 0;
    let latestTtft = 0;
    let latestSpeed = 0;
    let latestDuration = 0;
    let assistantMessageCount = 0;

    if (messages && messages.length > 0) {
      for (const m of messages) {
        if (m.role === "assistant") {
          assistantMessageCount++;
          if (m.ttftMs) latestTtft = m.ttftMs;
          if (m.tokensPerSec) latestSpeed = m.tokensPerSec;
          if (m.totalDurationMs) latestDuration = m.totalDurationMs;
          if (m.costUsd) totalSpend += m.costUsd;
        }

        if (m.promptTokens || m.completionTokens) {
          inputTokens += m.promptTokens || 0;
          outputTokens += m.completionTokens || 0;
        } else {
          const approx = Math.ceil((m.content?.length || 0) / 3.8);
          if (m.role === "user") inputTokens += approx;
          else outputTokens += approx;
        }
      }
    }

    const totalUsedTokens = inputTokens + outputTokens || 1250;

    // Resolve max context length
    let max = 200000;
    const low = (activeModel || "").toLowerCase();

    // Check if custom provider specifies context length
    const customProv = userConfig?.customProviders?.find((p: any) =>
      p.models?.some((mod: any) => mod.id === activeModel || mod.name === activeModel)
    );
    const matchedModel = customProv?.models?.find(
      (mod: any) => mod.id === activeModel || mod.name === activeModel
    );

    if ((matchedModel as any)?.contextLength || (matchedModel as any)?.contextWindow) {
      max = (matchedModel as any).contextLength || (matchedModel as any).contextWindow;
    } else if (low.includes("gemini")) {
      max = 1000000;
    } else if (low.includes("claude")) {
      max = 200000;
    } else if (low.includes("gpt-4o")) {
      max = 128000;
    } else if (low.includes("deepseek")) {
      max = 64000;
    }

    const pct = Math.min(Math.max((totalUsedTokens / max) * 100, 0.2), 100);
    const formattedUsed =
      totalUsedTokens >= 1000
        ? `${(totalUsedTokens / 1000).toFixed(1)}k`
        : `${totalUsedTokens}`;
    const formattedMax =
      max >= 1000000
        ? `${(max / 1000000).toFixed(0)}M`
        : `${(max / 1000).toFixed(0)}k`;

    return {
      totalUsedTokens,
      inputTokens,
      outputTokens,
      maxTokens: max,
      formattedUsed,
      formattedMax,
      pctString: `${pct.toFixed(1)}%`,
      rawPct: `${pct.toFixed(1)}%` as any,
      totalSpendFormatted:
        totalSpend > 0
          ? totalSpend < 0.001
            ? `< $0.001`
            : `$${totalSpend.toFixed(4)}`
          : "$0.0000",
      ttftFormatted: latestTtft > 0 ? `${latestTtft} ms` : "—",
      speedFormatted: latestSpeed > 0 ? `${latestSpeed.toFixed(1)} t/s` : "—",
      durationFormatted: latestDuration > 0 ? `${(latestDuration / 1000).toFixed(2)} s` : "—",
    };
  }, [messages, activeModel, userConfig]);

  return (
    <Modal
      visible={isContextMeterOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setContextMeterOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setContextMeterOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.meterCard}>
              {/* Header Row: Context Capacity */}
              <View style={styles.row}>
                <View style={styles.headerLeft}>
                  <Layers size={13} color="#38bdf8" style={{ marginRight: 6 }} />
                  <Text style={styles.title}>Context Window</Text>
                </View>
                <Text style={styles.value}>
                  {telemetryStats.formattedUsed} / {telemetryStats.formattedMax}{" "}
                  <Text style={styles.pctText}>({telemetryStats.pctString})</Text>
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: telemetryStats.rawPct },
                  ]}
                />
              </View>

              {/* Token Breakdown: In vs Out */}
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <ArrowDownLeft size={11} color="#a1a1aa" style={{ marginRight: 4 }} />
                  <Text style={styles.breakdownLabel}>Input:</Text>
                  <Text style={styles.breakdownValue}>
                    {telemetryStats.inputTokens.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <ArrowUpRight size={11} color="#a1a1aa" style={{ marginRight: 4 }} />
                  <Text style={styles.breakdownLabel}>Output:</Text>
                  <Text style={styles.breakdownValue}>
                    {telemetryStats.outputTokens.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.separator} />

              {/* Real Performance Telemetry Grid */}
              <View style={styles.telemetryGrid}>
                {/* TTFT */}
                <View style={styles.telemetryCard}>
                  <View style={styles.telemetryHeader}>
                    <Zap size={11} color="#eab308" style={{ marginRight: 4 }} />
                    <Text style={styles.telemetryLabel}>TTFT</Text>
                  </View>
                  <Text style={styles.telemetryVal}>{telemetryStats.ttftFormatted}</Text>
                </View>

                {/* Speed */}
                <View style={styles.telemetryCard}>
                  <View style={styles.telemetryHeader}>
                    <Cpu size={11} color="#38bdf8" style={{ marginRight: 4 }} />
                    <Text style={styles.telemetryLabel}>Speed</Text>
                  </View>
                  <Text style={styles.telemetryVal}>{telemetryStats.speedFormatted}</Text>
                </View>

                {/* Latency */}
                <View style={styles.telemetryCard}>
                  <View style={styles.telemetryHeader}>
                    <Clock size={11} color="#a855f7" style={{ marginRight: 4 }} />
                    <Text style={styles.telemetryLabel}>Latency</Text>
                  </View>
                  <Text style={styles.telemetryVal}>{telemetryStats.durationFormatted}</Text>
                </View>

                {/* Spend */}
                <View style={styles.telemetryCard}>
                  <View style={styles.telemetryHeader}>
                    <Coins size={11} color="#4ade80" style={{ marginRight: 4 }} />
                    <Text style={styles.telemetryLabel}>Est. Spend</Text>
                  </View>
                  <Text style={[styles.telemetryVal, { color: "#4ade80" }]}>
                    {telemetryStats.totalSpendFormatted}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingBottom: 135,
    paddingRight: 14,
  },
  meterCard: {
    width: 290,
    backgroundColor: "#16161a",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    padding: 13,
    gap: 9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    color: "#d4d4d8",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  pctText: {
    color: "#38bdf8",
    fontWeight: "700",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#27272a",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#38bdf8",
    borderRadius: 3,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownLabel: {
    color: "#71717a",
    fontSize: 10.5,
    marginRight: 4,
  },
  breakdownValue: {
    color: "#e4e4e7",
    fontSize: 10.5,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  separator: {
    height: 1,
    backgroundColor: "#232329",
    marginVertical: 1,
  },
  telemetryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  telemetryCard: {
    width: "48%",
    backgroundColor: "#1c1c22",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#26262e",
  },
  telemetryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  telemetryLabel: {
    color: "#71717a",
    fontSize: 9.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  telemetryVal: {
    color: "#fafafa",
    fontSize: 11.5,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});

