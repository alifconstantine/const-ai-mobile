import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Terminal,
  AlertTriangle,
  Radio,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@const-ai/backend";

export type HitlApprovalOption = "allow_once" | "allow_always" | "deny";

interface Props {
  pendingActionId?: string;
  assistantMessageId?: string;
  toolCallId: string;
  toolName: string;
  command: string;
  workingDir?: string;
  riskLevel?: "low" | "medium" | "critical" | string;
  status?: "pending" | "approved" | "rejected" | "waiting_hitl";
  onResolved?: (decision: "approved" | "rejected") => void;
}

export const PermissionRequiredCard: React.FC<Props> = ({
  pendingActionId,
  toolName,
  command,
  workingDir,
  riskLevel = "medium",
  status = "pending",
  onResolved,
}) => {
  const [selectedOption, setSelectedOption] = useState<HitlApprovalOption>("allow_once");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolveMutation = useMutation(api.pendingActions.resolvePendingAction);

  const isCritical = riskLevel === "critical";
  const isResolved = status === "approved" || status === "rejected";

  const handleConfirm = async () => {
    if (isSubmitting || !pendingActionId) return;
    setIsSubmitting(true);

    try {
      const decisionStatus = selectedOption === "deny" ? "rejected" : "approved";
      await resolveMutation({
        pendingActionId: pendingActionId as any,
        status: decisionStatus,
      });

      if (onResolved) {
        onResolved(decisionStatus);
      }
    } catch (err) {
      console.warn("Failed to resolve pending action:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isResolved) {
    const isApproved = status === "approved";
    return (
      <View style={[styles.cardContainer, isApproved ? styles.approvedBorder : styles.rejectedBorder]}>
        <View style={styles.resolvedHeader}>
          {isApproved ? (
            <CheckCircle2 size={16} color="#22c55e" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          )}
          <Text style={[styles.resolvedText, isApproved ? styles.textSuccess : styles.textDanger]}>
            {isApproved ? "Permission Granted" : "Permission Denied by User"}
          </Text>
        </View>
        <Text style={styles.resolvedSummary} numberOfLines={2}>
          {command}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.cardContainer, isCritical ? styles.criticalBorder : styles.mediumBorder]}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <ShieldAlert size={16} color={isCritical ? "#ef4444" : "#f59e0b"} />
          <Text style={[styles.headerTitle, isCritical ? styles.textCritical : styles.textWarning]}>
            Permission Required
          </Text>
        </View>
        <View style={[styles.riskBadge, isCritical ? styles.riskBadgeCritical : styles.riskBadgeMedium]}>
          <Text style={[styles.riskBadgeText, isCritical ? styles.textCritical : styles.textWarning]}>
            {isCritical ? "🔴 Critical Risk" : "🟡 Medium Risk"}
          </Text>
        </View>
      </View>

      {/* Description & Command Code Box */}
      <Text style={styles.toolNameLabel}>
        Tool: <Text style={styles.toolNameValue}>{toolName}</Text>
      </Text>

      <View style={styles.codeBlock}>
        <View style={styles.codeHeader}>
          <Terminal size={11} color="#71717a" />
          <Text style={styles.codePath}>{workingDir || "On-Device Execution"}</Text>
        </View>
        <Text style={styles.codeText}>{command}</Text>
      </View>

      {/* 3 Radio Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.radioRow, selectedOption === "allow_once" && styles.radioRowActive]}
          onPress={() => setSelectedOption("allow_once")}
          activeOpacity={0.7}
        >
          <View style={[styles.radioCircle, selectedOption === "allow_once" && styles.radioCircleActive]}>
            {selectedOption === "allow_once" && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.radioLabel}>1. Allow (1x)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioRow, selectedOption === "allow_always" && styles.radioRowActive]}
          onPress={() => setSelectedOption("allow_always")}
          activeOpacity={0.7}
        >
          <View style={[styles.radioCircle, selectedOption === "allow_always" && styles.radioCircleActive]}>
            {selectedOption === "allow_always" && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.radioLabel}>2. Always allow in this project</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioRow, selectedOption === "deny" && styles.radioRowActive]}
          onPress={() => setSelectedOption("deny")}
          activeOpacity={0.7}
        >
          <View style={[styles.radioCircle, selectedOption === "deny" && styles.radioCircleActive]}>
            {selectedOption === "deny" && <View style={styles.radioDot} />}
          </View>
          <Text style={[styles.radioLabel, styles.textDanger]}>3. Deny execution</Text>
        </TouchableOpacity>
      </View>

      {/* Action Footer */}
      <View style={styles.actionFooter}>
        <TouchableOpacity
          style={[
            styles.btnConfirm,
            selectedOption === "deny" ? styles.btnDeny : styles.btnAllow,
            isSubmitting && { opacity: 0.6 },
          ]}
          onPress={handleConfirm}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#09090b" />
          ) : (
            <Text style={styles.btnConfirmText}>
              {selectedOption === "deny" ? "Confirm Deny" : "Confirm & Execute"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#16161a",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  mediumBorder: {
    borderColor: "#f59e0b66",
  },
  criticalBorder: {
    borderColor: "#ef444466",
  },
  approvedBorder: {
    borderColor: "#22c55e44",
  },
  rejectedBorder: {
    borderColor: "#ef444444",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  riskBadgeMedium: {
    backgroundColor: "#f59e0b1a",
  },
  riskBadgeCritical: {
    backgroundColor: "#ef44441a",
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  toolNameLabel: {
    color: "#71717a",
    fontSize: 11,
    marginBottom: 6,
  },
  toolNameValue: {
    color: "#fafafa",
    fontWeight: "600",
    fontFamily: "monospace",
  },
  codeBlock: {
    backgroundColor: "#0d0d10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 10,
    marginBottom: 10,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    paddingBottom: 4,
  },
  codePath: {
    color: "#71717a",
    fontSize: 10,
    fontFamily: "monospace",
  },
  codeText: {
    color: "#38bdf8",
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  optionsContainer: {
    gap: 6,
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#1b1b20",
  },
  radioRowActive: {
    backgroundColor: "#24242c",
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#71717a",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#38bdf8",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38bdf8",
  },
  radioLabel: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "500",
  },
  actionFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  btnConfirm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnAllow: {
    backgroundColor: "#38bdf8",
  },
  btnDeny: {
    backgroundColor: "#ef4444",
  },
  btnConfirmText: {
    color: "#09090b",
    fontSize: 12,
    fontWeight: "700",
  },
  resolvedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resolvedText: {
    fontSize: 12,
    fontWeight: "600",
  },
  resolvedSummary: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 4,
    fontFamily: "monospace",
  },
  textWarning: {
    color: "#f59e0b",
  },
  textCritical: {
    color: "#ef4444",
  },
  textSuccess: {
    color: "#22c55e",
  },
  textDanger: {
    color: "#ef4444",
  },
});
