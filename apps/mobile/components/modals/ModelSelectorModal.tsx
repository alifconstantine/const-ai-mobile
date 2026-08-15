import React, { useState } from "react";
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
  Check,
  ChevronRight,
  Info,
  Activity,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

interface ModelItem {
  id: string;
  name: string;
  effort?: "Low" | "Medium" | "High";
  hasThinkingOptions?: boolean;
  isFast?: boolean;
}

const MODELS: ModelItem[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    effort: "High",
    isFast: true,
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    effort: "Medium",
    hasThinkingOptions: true,
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    effort: "Medium",
    isFast: true,
    hasThinkingOptions: true,
  },
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    effort: "Low",
    hasThinkingOptions: true,
  },
  {
    id: "claude-sonnet-4.6",
    name: "Claude Sonnet 4.6 (Thinking)",
  },
  {
    id: "claude-opus-4.6",
    name: "Claude Opus 4.6 (Thinking)",
  },
  {
    id: "gpt-oss-120b",
    name: "GPT-OSS 120B (Medium)",
  },
];

const THINKING_LEVELS: ("Low" | "Medium" | "High")[] = ["Low", "Medium", "High"];

export const ModelSelectorModal: React.FC = () => {
  const {
    isModelSelectorModalOpen,
    setModelSelectorModalOpen,
    activeModel,
    setActiveModel,
  } = useNavigation();

  const [activeSubmenuModel, setActiveSubmenuModel] = useState<string | null>(null);
  const [selectedEffortMap, setSelectedEffortMap] = useState<Record<string, "Low" | "Medium" | "High">>({
    "gemini-3.7-flash": "High",
    "gemini-3.6-flash": "Medium",
    "gemini-3.5-flash": "Medium",
    "gemini-3.1-pro": "Low",
  });

  const handleSelectModel = (model: ModelItem) => {
    const effort = selectedEffortMap[model.id] || model.effort;
    const displayName = effort ? `${model.name} ${effort}` : model.name;
    setActiveModel(displayName);
    setModelSelectorModalOpen(false);
    setActiveSubmenuModel(null);
  };

  const handleSelectThinkingEffort = (model: ModelItem, effort: "Low" | "Medium" | "High") => {
    setSelectedEffortMap((prev) => ({
      ...prev,
      [model.id]: effort,
    }));
    setActiveModel(`${model.name} ${effort}`);
    setModelSelectorModalOpen(false);
    setActiveSubmenuModel(null);
  };

  return (
    <Modal
      visible={isModelSelectorModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setModelSelectorModalOpen(false);
        setActiveSubmenuModel(null);
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          setModelSelectorModalOpen(false);
          setActiveSubmenuModel(null);
        }}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              {/* Main Model Selector Card */}
              <View style={styles.popoverCard}>
                {/* Header */}
                <Text style={styles.menuHeader}>Model</Text>

                <ScrollView bounces={false} style={styles.modelList}>
                  {MODELS.map((model) => {
                    const currentEffort = selectedEffortMap[model.id] || model.effort;
                    const isSelected = activeModel.startsWith(model.name);
                    const isSubmenuOpen = activeSubmenuModel === model.id;

                    return (
                      <TouchableOpacity
                        key={model.id}
                        style={[
                          styles.modelRow,
                          (isSelected || isSubmenuOpen) && styles.modelRowActive,
                        ]}
                        onPress={() => {
                          if (model.hasThinkingOptions) {
                            setActiveSubmenuModel(
                              activeSubmenuModel === model.id ? null : model.id
                            );
                          } else {
                            handleSelectModel(model);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modelName, isSelected && styles.modelNameActive]}>
                          {model.name}
                        </Text>

                        <View style={styles.badgeGroup}>
                          {currentEffort && (
                            <View style={styles.effortBadge}>
                              <Text style={styles.effortBadgeText}>{currentEffort}</Text>
                            </View>
                          )}

                          {model.isFast && (
                            <View style={styles.fastBadge}>
                              <Text style={styles.fastBadgeText}>Fast</Text>
                              <Info size={10} color="#a1a1aa" style={{ marginLeft: 2 }} />
                            </View>
                          )}

                          {model.hasThinkingOptions ? (
                            <ChevronRight size={13} color="#71717a" style={{ marginLeft: 4 }} />
                          ) : isSelected ? (
                            <Check size={14} color="#e4e4e7" style={{ marginLeft: 4 }} />
                          ) : (
                            <View style={{ width: 14 }} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.separator} />

                {/* Footer: View Usage */}
                <TouchableOpacity
                  style={styles.usageRow}
                  onPress={() => setModelSelectorModalOpen(false)}
                  activeOpacity={0.7}
                >
                  <View style={styles.usageLeft}>
                    <Activity size={14} color="#a1a1aa" style={{ marginRight: 8 }} />
                    <Text style={styles.usageText}>View Usage</Text>
                  </View>
                  <ChevronRight size={13} color="#71717a" />
                </TouchableOpacity>
              </View>

              {/* Submenu for Thinking Effort when expanding a model */}
              {activeSubmenuModel && (
                <View style={styles.submenuCard}>
                  {THINKING_LEVELS.map((level) => {
                    const currentModelEffort = selectedEffortMap[activeSubmenuModel];
                    const isEffortSelected = currentModelEffort === level;
                    const targetModel = MODELS.find((m) => m.id === activeSubmenuModel);

                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.submenuRow,
                          isEffortSelected && styles.submenuRowActive,
                        ]}
                        onPress={() => {
                          if (targetModel) {
                            handleSelectThinkingEffort(targetModel, level);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.submenuText,
                            isEffortSelected && styles.submenuTextActive,
                          ]}
                        >
                          {level}
                        </Text>
                        {isEffortSelected && <Check size={13} color="#e4e4e7" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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
  modalWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  popoverCard: {
    width: 290,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    paddingVertical: 8,
    maxHeight: 380,
  },
  menuHeader: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "500",
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  modelList: {
    maxHeight: 280,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  modelRowActive: {
    backgroundColor: "#222228",
  },
  modelName: {
    color: "#d4d4d8",
    fontSize: 12.5,
    fontWeight: "400",
    flex: 1,
    marginRight: 6,
  },
  modelNameActive: {
    color: "#fafafa",
    fontWeight: "500",
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  effortBadge: {
    backgroundColor: "#27272a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  effortBadgeText: {
    color: "#a1a1aa",
    fontSize: 10.5,
    fontWeight: "500",
  },
  fastBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27272a",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fastBadgeText: {
    color: "#a1a1aa",
    fontSize: 10.5,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#27272a",
    marginVertical: 6,
    marginHorizontal: 8,
  },
  usageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  usageLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  usageText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "400",
  },
  submenuCard: {
    width: 110,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 22,
    paddingVertical: 4,
  },
  submenuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  submenuRowActive: {
    backgroundColor: "#222228",
  },
  submenuText: {
    color: "#a1a1aa",
    fontSize: 12,
  },
  submenuTextActive: {
    color: "#fafafa",
    fontWeight: "500",
  },
});
