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
} from "lucide-react-native";

interface PlanTask {
  id: string;
  title: string;
  desc: string;
  status: "completed" | "in_progress" | "pending";
}

const PLAN_STEPS: PlanTask[] = [
  {
    id: "step-1",
    title: "1. Prompt Dock Action Menu (+)",
    desc: "Attachment picker, @ context mentions, and / slash commands",
    status: "completed",
  },
  {
    id: "step-2",
    title: "2. Auto-Recommender Popovers",
    desc: "Real-time suggestion card for Plugins, Files, and Commands",
    status: "completed",
  },
  {
    id: "step-3",
    title: "3. Multi-Tab Right Sidebar",
    desc: "Tabs for Files, Browser, Explore, Plan, and Review",
    status: "in_progress",
  },
  {
    id: "step-4",
    title: "4. User Approval & Verification",
    desc: "Verify interactive flows and monorepo TypeScript build",
    status: "pending",
  },
];

export const PlanView: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileCheck size={15} color="#38bdf8" />
          <Text style={styles.headerTitle}>Implementation Plan</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>In Progress</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} bounces={false}>
        <Text style={styles.sectionTitle}>CURRENT OBJECTIVE</Text>
        <Text style={styles.objectiveText}>
          Implement interactive prompt dock menus and multi-tab sidebar navigation for mobile and desktop preview.
        </Text>

        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>EXECUTION CHECKLIST</Text>
        <View style={styles.checklist}>
          {PLAN_STEPS.map((step) => {
            const isCompleted = step.status === "completed";
            const isInProgress = step.status === "in_progress";

            return (
              <View key={step.id} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} color="#22c55e" />
                  ) : isInProgress ? (
                    <Clock size={16} color="#38bdf8" />
                  ) : (
                    <Circle size={16} color="#52525b" />
                  )}
                  <Text
                    style={[
                      styles.stepTitle,
                      isCompleted && styles.stepTitleCompleted,
                      isInProgress && styles.stepTitleInProgress,
                    ]}
                  >
                    {step.title}
                  </Text>
                </View>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            );
          })}
        </View>
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
});
