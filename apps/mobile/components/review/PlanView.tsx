import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  CheckCircle2,
  Circle,
  Clock,
  FileCheck,
  ShieldAlert,
  ClipboardList,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@const-ai/backend";
import { useNavigation } from "../../context/NavigationContext";

export const PlanView: React.FC = () => {
  const { activeConversationId, activeTaskTitle } = useNavigation();

  const plan = useQuery(
    (api as any).implementationPlans?.getPlanByConversation,
    activeConversationId ? { conversationId: activeConversationId as any } : "skip"
  );

  const goal = plan?.goal || `Active Task: ${activeTaskTitle || "General Assistant Session"}`;
  const status = plan?.status || "in_progress";
  const changes = plan?.proposedChanges || [];
  const verifications = plan?.verificationSteps || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileCheck size={15} color="#38bdf8" />
          <Text style={styles.headerTitle}>Implementation Plan</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>
            {status === "completed" ? "Completed" : status === "approved" ? "Approved" : "In Progress"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} bounces={false}>
        <Text style={styles.sectionTitle}>CURRENT GOAL</Text>
        <Text style={styles.objectiveText}>{goal}</Text>

        {changes.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>PROPOSED CHANGES</Text>
            <View style={styles.checklist}>
              {changes.map((item: any, idx: number) => (
                <View key={idx} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <FileCheck size={14} color="#38bdf8" />
                    <Text style={styles.stepTitle}>{item.filePath}</Text>
                    <View style={[styles.actionTag, item.action === "create" ? styles.tagCreate : styles.tagModify]}>
                      <Text style={styles.actionTagText}>{item.action.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.stepDesc}>{item.explanation}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {verifications.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>VERIFICATION STEPS</Text>
            <View style={styles.checklist}>
              {verifications.map((step: string, idx: number) => (
                <View key={idx} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <CheckCircle2 size={14} color="#22c55e" />
                    <Text style={styles.stepTitle}>{step}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {changes.length === 0 && verifications.length === 0 && (
          <View style={styles.emptyCard}>
            <ClipboardList size={28} color="#52525b" />
            <Text style={styles.emptyTitle}>No Plan Active</Text>
            <Text style={styles.emptySubtitle}>
              When working in Plan Mode or asking for complex refactors, the agent will draft structured steps here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d10",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
    backgroundColor: "#121215",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "600",
  },
  scrollArea: {
    flex: 1,
    padding: 14,
  },
  sectionTitle: {
    color: "#71717a",
    fontSize: 10.5,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  objectiveText: {
    color: "#d4d4d8",
    fontSize: 12.5,
    lineHeight: 18,
  },
  checklist: {
    gap: 8,
  },
  stepCard: {
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "#222228",
    borderRadius: 8,
    padding: 10,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  stepTitle: {
    color: "#fafafa",
    fontSize: 12.5,
    fontWeight: "500",
  },
  stepTitleCompleted: {
    color: "#a1a1aa",
    textDecorationLine: "line-through",
  },
  stepTitleInProgress: {
    color: "#38bdf8",
    fontWeight: "600",
  },
  stepDesc: {
    color: "#71717a",
    fontSize: 11.5,
    paddingLeft: 24,
    lineHeight: 16,
  },
  actionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: "auto",
  },
  tagCreate: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  tagModify: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  actionTagText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#fafafa",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyTitle: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  emptySubtitle: {
    color: "#71717a",
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 16,
  },
});
