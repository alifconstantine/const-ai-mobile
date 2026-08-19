import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
} from "react-native";
import {
  Check,
  ChevronRight,
  ExternalLink,
  Cpu,
  Sparkles,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

export interface ModelItem {
  id: string;
  name: string;
  providerName?: string;
  isFast?: boolean;
  contextLength?: number;
}

export const ModelSelectorModal: React.FC = () => {
  const {
    isModelSelectorModalOpen,
    setModelSelectorModalOpen,
    activeModel,
    setActiveModel,
    updateUserSettings,
    userConfig,
  } = useNavigation();

  // Dynamically extract models from userConfig configured in the Web Settings Hub
  const availableModels: ModelItem[] = useMemo(() => {
    const modelsList: ModelItem[] = [];
    const seenIds = new Set<string>();

    if (userConfig?.customProviders && userConfig.customProviders.length > 0) {
      for (const prov of userConfig.customProviders) {
        if (prov.models && prov.models.length > 0) {
          for (const m of prov.models) {
            if (m.id && !seenIds.has(m.id)) {
              seenIds.add(m.id);
              modelsList.push({
                id: m.id,
                name: m.name || m.id,
                providerName: prov.name,
                isFast: true,
                contextLength: m.contextLength,
              });
            }
          }
        }
      }
    }

    // Ensure activeModel is present in the list if not already
    if (activeModel && !seenIds.has(activeModel)) {
      modelsList.unshift({
        id: activeModel,
        name: activeModel,
        providerName: "Configured Model",
        isFast: true,
      });
      seenIds.add(activeModel);
    }

    // Default fallback if no custom provider models configured yet
    if (modelsList.length === 0) {
      modelsList.push({
        id: "Const",
        name: "Const",
        providerName: "OmniRoute",
        isFast: true,
        contextLength: 200000,
      });
    }

    return modelsList;
  }, [userConfig, activeModel]);

  const handleSelectModel = (model: ModelItem) => {
    setActiveModel(model.id);
    updateUserSettings({ activeModel: model.id });
    setModelSelectorModalOpen(false);
  };

  const handleOpenManageModels = async () => {
    setModelSelectorModalOpen(false);
    const webUrl =
      process.env.EXPO_PUBLIC_WEB_URL ||
      "http://localhost:3000/dashboard/settings";
    try {
      const canOpen = await Linking.canOpenURL(webUrl);
      if (canOpen) {
        await Linking.openURL(webUrl);
      } else {
        await Linking.openURL("http://localhost:3000/dashboard/settings");
      }
    } catch (err) {
      console.warn("Failed to open web URL:", err);
    }
  };

  return (
    <Modal
      visible={isModelSelectorModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setModelSelectorModalOpen(false)}
    >
      <TouchableWithoutFeedback
        onPress={() => setModelSelectorModalOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              {/* Main Model Selector Card */}
              <View style={styles.popoverCard}>
                {/* Header */}
                <View style={styles.menuHeaderRow}>
                  <Text style={styles.menuHeader}>Active Models</Text>
                  <Text style={styles.countBadge}>
                    {availableModels.length} available
                  </Text>
                </View>

                <ScrollView bounces={false} style={styles.modelList}>
                  {availableModels.map((model) => {
                    const isSelected =
                      activeModel === model.id ||
                      activeModel.startsWith(model.name);

                    return (
                      <TouchableOpacity
                        key={model.id}
                        style={[
                          styles.modelRow,
                          isSelected && styles.modelRowActive,
                        ]}
                        onPress={() => handleSelectModel(model)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modelInfo}>
                          <View style={styles.modelTitleRow}>
                            <Text
                              style={[
                                styles.modelName,
                                isSelected && styles.modelNameActive,
                              ]}
                            >
                              {model.name}
                            </Text>
                          </View>

                          {model.providerName ? (
                            <Text style={styles.providerSubText}>
                              {model.providerName}
                              {model.contextLength
                                ? ` • ${(model.contextLength / 1000).toFixed(0)}k ctx`
                                : ""}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.badgeGroup}>
                          {model.isFast && (
                            <View style={styles.fastBadge}>
                              <Sparkles size={10} color="#38bdf8" />
                              <Text style={styles.fastBadgeText}>Fast</Text>
                            </View>
                          )}

                          {isSelected ? (
                            <Check
                              size={14}
                              color="#38bdf8"
                              style={{ marginLeft: 4 }}
                            />
                          ) : (
                            <View style={{ width: 14 }} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.separator} />

                {/* Footer: Manage model (Redirects to Web Dashboard Settings) */}
                <TouchableOpacity
                  style={styles.manageRow}
                  onPress={handleOpenManageModels}
                  activeOpacity={0.7}
                >
                  <View style={styles.manageLeft}>
                    <ExternalLink
                      size={14}
                      color="#38bdf8"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.manageText}>Manage model</Text>
                  </View>
                  <ChevronRight size={13} color="#71717a" />
                </TouchableOpacity>
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
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    paddingVertical: 8,
    maxHeight: 380,
  },
  menuHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  menuHeader: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countBadge: {
    color: "#52525b",
    fontSize: 10,
    fontFamily: "monospace",
  },
  modelList: {
    maxHeight: 280,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 1,
  },
  modelRowActive: {
    backgroundColor: "#222228",
  },
  modelInfo: {
    flex: 1,
    marginRight: 6,
  },
  modelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modelName: {
    color: "#d4d4d8",
    fontSize: 13,
    fontWeight: "400",
  },
  modelNameActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  providerSubText: {
    color: "#71717a",
    fontSize: 10.5,
    marginTop: 1,
  },
  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  fastBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  fastBadgeText: {
    color: "#38bdf8",
    fontSize: 10,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#27272a",
    marginVertical: 6,
    marginHorizontal: 8,
  },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "rgba(56, 189, 248, 0.06)",
  },
  manageLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  manageText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "500",
  },
});
