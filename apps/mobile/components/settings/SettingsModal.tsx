import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import {
  X,
  Sliders,
  ShieldCheck,
  Key,
  Cpu,
  Smartphone,
  Volume2,
  Check,
} from "lucide-react-native";
import { OperatingMode } from "@const-ai/types";
import { useNavigation } from "../../context/NavigationContext";

const MODELS = [
  { id: "Omniroute/Const", name: "Omniroute / Const AI", badge: "Fast" },
  { id: "Gemini 2.0 Flash", name: "Google Gemini 2.0 Flash", badge: "Multimodal" },
  { id: "Claude 3.7 Sonnet", name: "Anthropic Claude 3.7 Sonnet", badge: "Coding" },
  { id: "DeepSeek R1", name: "DeepSeek R1 Reasoning", badge: "Reasoning" },
];

const OPERATING_MODES: {
  id: OperatingMode;
  name: string;
  desc: string;
}[] = [
  {
    id: "plan_mode",
    name: "1. Plan Mode",
    desc: "Draft implementation plan & await approval before any edits",
  },
  {
    id: "ask_before_change",
    name: "2. Ask Before Change",
    desc: "Every file edit and shell command requires explicit modal confirmation",
  },
  {
    id: "edit_automatically",
    name: "3. Edit Automatically",
    desc: "Directly edits files and runs low-risk commands automatically",
  },
  {
    id: "full_access_yolo",
    name: "4. Full Access (YOLO)",
    desc: "Zero-prompt autonomous execution for rapid development & background crons",
  },
];

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    activeModel,
    setActiveModel,
    activeOperatingMode,
    setActiveOperatingMode,
  } = useNavigation();

  return (
    <Modal
      visible={isSettingsModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setSettingsModalOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setSettingsModalOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Sliders size={17} color="#38bdf8" />
                  <Text style={styles.headerTitle}>Quick Settings</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSettingsModalOpen(false)}
                >
                  <X size={18} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent} bounces={false}>
                {/* Section 1: Active Model */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Cpu size={14} color="#a1a1aa" />
                    <Text style={styles.sectionTitle}>Active AI Model</Text>
                  </View>
                  <View style={styles.optionsList}>
                    {MODELS.map((model) => {
                      const isSelected = activeModel === model.id;
                      return (
                        <TouchableOpacity
                          key={model.id}
                          style={[
                            styles.optionCard,
                            isSelected && styles.optionCardActive,
                          ]}
                          onPress={() => setActiveModel(model.id)}
                        >
                          <View style={styles.optionInfo}>
                            <Text
                              style={[
                                styles.optionName,
                                isSelected && styles.optionNameActive,
                              ]}
                            >
                              {model.name}
                            </Text>
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{model.badge}</Text>
                            </View>
                          </View>
                          {isSelected && <Check size={16} color="#38bdf8" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Section 2: Operating Mode */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ShieldCheck size={14} color="#a1a1aa" />
                    <Text style={styles.sectionTitle}>Agent Operating Mode</Text>
                  </View>
                  <View style={styles.optionsList}>
                    {OPERATING_MODES.map((mode) => {
                      const isSelected = activeOperatingMode === mode.id;
                      return (
                        <TouchableOpacity
                          key={mode.id}
                          style={[
                            styles.optionCard,
                            isSelected && styles.optionCardActive,
                          ]}
                          onPress={() => setActiveOperatingMode(mode.id)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.optionName,
                                isSelected && styles.optionNameActive,
                              ]}
                            >
                              {mode.name}
                            </Text>
                            <Text style={styles.optionDesc}>{mode.desc}</Text>
                          </View>
                          {isSelected && <Check size={16} color="#38bdf8" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Section 3: Android Native Services */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Smartphone size={14} color="#a1a1aa" />
                    <Text style={styles.sectionTitle}>Native Modules Status</Text>
                  </View>
                  <View style={styles.statusGrid}>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Shizuku ADB</Text>
                      <View style={styles.statusPillActive}>
                        <Text style={styles.statusTextActive}>Ready</Text>
                      </View>
                    </View>

                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Accessibility Spatial</Text>
                      <View style={styles.statusPillActive}>
                        <Text style={styles.statusTextActive}>Enabled</Text>
                      </View>
                    </View>

                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Supertonic-3 Neural Voice</Text>
                      <View style={styles.statusPillActive}>
                        <Text style={styles.statusTextActive}>ONNX Loaded</Text>
                      </View>
                    </View>

                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Termux CLI Intent</Text>
                      <View style={styles.statusPillActive}>
                        <Text style={styles.statusTextActive}>Connected</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
    overflow: "hidden",
    maxHeight: "85%",
  },
  header: {
    height: 48,
    backgroundColor: "#121215",
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#fafafa",
    fontSize: 14,
    fontWeight: "600",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionsList: {
    gap: 8,
  },
  optionCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionCardActive: {
    borderColor: "#38bdf8",
    backgroundColor: "#171d24",
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionName: {
    color: "#d4d4d8",
    fontSize: 13,
    fontWeight: "500",
  },
  optionNameActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  optionDesc: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#27272a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "500",
  },
  statusGrid: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    color: "#d4d4d8",
    fontSize: 12.5,
  },
  statusPillActive: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTextActive: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
  },
});
