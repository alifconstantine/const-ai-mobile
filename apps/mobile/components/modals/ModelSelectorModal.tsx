import React, { useMemo, useState, useEffect } from "react";
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
  Settings,
} from "lucide-react-native";
import { useNavigation } from "../../context/NavigationContext";

export interface ModelItem {
  id: string;
  name: string;
  contextLength?: number;
  isFast?: boolean;
}

export interface ProviderGroup {
  id: string;
  name: string;
  models: ModelItem[];
}

export const ModelSelectorModal: React.FC = () => {
  const {
    isModelSelectorModalOpen,
    setModelSelectorModalOpen,
    openSettingsTab,
    activeModel,
    setActiveModel,
    updateUserSettings,
    userConfig,
  } = useNavigation();

  // Dynamically extract providers & models from userConfig configured in the Web Settings Hub + Curated Cloud Defaults
  const availableProviders: ProviderGroup[] = useMemo(() => {
    const list: ProviderGroup[] = [];

    // 1. Extract from active Custom Providers in userConfig
    if (userConfig?.customProviders && userConfig.customProviders.length > 0) {
      for (const prov of userConfig.customProviders) {
        if (prov.isActive !== false && prov.models && prov.models.length > 0) {
          list.push({
            id: prov.id,
            name: prov.name,
            models: prov.models.map((m) => ({
              id: m.id,
              name: m.name || m.id,
              contextLength: m.contextLength || 200000,
            })),
          });
        }
      }
    }

    // 2. Connected Cloud Providers (only include if API key is configured by user)
    const keys = userConfig?.customApiKeys;

    if (keys?.gemini && keys.gemini.trim().length > 0) {
      list.push({
        id: "gemini",
        name: "Google Gemini",
        models: [
          { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextLength: 1048576 },
          { id: "gemini-2.0-pro-exp-02-05", name: "Gemini 2.0 Pro", contextLength: 2097152 },
          { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextLength: 1048576 },
        ],
      });
    }

    if (keys?.anthropic && keys.anthropic.trim().length > 0) {
      list.push({
        id: "anthropic",
        name: "Anthropic Claude",
        models: [
          { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", contextLength: 200000 },
          { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", contextLength: 200000 },
          { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", contextLength: 200000 },
        ],
      });
    }

    if (keys?.openAi && keys.openAi.trim().length > 0) {
      list.push({
        id: "openai",
        name: "OpenAI",
        models: [
          { id: "gpt-4o", name: "GPT-4o", contextLength: 128000 },
          { id: "gpt-4o-mini", name: "GPT-4o Mini", contextLength: 128000 },
          { id: "o3-mini", name: "o3-mini", contextLength: 200000 },
        ],
      });
    }

    if (keys?.openRouter && keys.openRouter.trim().length > 0) {
      list.push({
        id: "openrouter",
        name: "OpenRouter",
        models: [
          { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", contextLength: 200000 },
          { id: "deepseek/deepseek-r1", name: "DeepSeek R1", contextLength: 64000 },
          { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", contextLength: 1000000 },
        ],
      });
    }

    return list;
  }, [userConfig]);

  // Find provider containing the currently active model
  const initialProviderId = useMemo(() => {
    if (availableProviders.length === 0) return "";
    const matched = availableProviders.find((p) =>
      p.models.some((m) => m.id === activeModel || m.name === activeModel)
    );
    return matched ? matched.id : availableProviders[0].id;
  }, [availableProviders, activeModel]);

  const [selectedProviderId, setSelectedProviderId] = useState<string>(initialProviderId);

  useEffect(() => {
    if (initialProviderId) {
      setSelectedProviderId(initialProviderId);
    }
  }, [initialProviderId, isModelSelectorModalOpen]);

  const activeProvider = useMemo(() => {
    return (
      availableProviders.find((p) => p.id === selectedProviderId) ||
      availableProviders[0] ||
      null
    );
  }, [availableProviders, selectedProviderId]);

  const handleSelectModel = (modelId: string) => {
    setActiveModel(modelId);
    updateUserSettings({ activeModel: modelId });
    setModelSelectorModalOpen(false);
  };

  const handleOpenManageModels = () => {
    setModelSelectorModalOpen(false);
    openSettingsTab("models");
  };

  return (
    <Modal
      visible={isModelSelectorModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setModelSelectorModalOpen(false)}
    >
      <TouchableWithoutFeedback onPress={() => setModelSelectorModalOpen(false)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalWrapper}>
              {availableProviders.length === 0 ? (
                /* Empty State: No Providers Configured */
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Cpu size={20} color="#71717a" />
                  </View>
                  <Text style={styles.emptyTitle}>No Models Configured</Text>
                  <Text style={styles.emptySubtitle}>
                    Configure your AI providers and API keys in Settings to enable models.
                  </Text>
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={handleOpenManageModels}
                    activeOpacity={0.8}
                  >
                    <Settings size={13} color="#38bdf8" />
                    <Text style={styles.manageButtonText}>Configure API Keys</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Two-Tier Hierarchical Popover Matching Image 2 */
                <View style={styles.twoTierContainer}>

                  {/* Left Flyout: Models Submenu */}
                  {activeProvider && activeProvider.models.length > 0 && (
                    <View style={styles.modelsFlyoutCard}>
                      <ScrollView bounces={false} style={styles.flyoutList}>
                        {activeProvider.models.map((model) => {
                          const isSelected = activeModel === model.id;
                          return (
                            <TouchableOpacity
                              key={model.id}
                              style={[
                                styles.modelRow,
                                isSelected && styles.modelRowActive,
                              ]}
                              onPress={() => handleSelectModel(model.id)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.modelName,
                                  isSelected && styles.modelNameActive,
                                ]}
                                numberOfLines={1}
                              >
                                {model.name || model.id}
                              </Text>
                              {isSelected ? (
                                <Check size={13} color="#e4e4e7" strokeWidth={2.5} />
                              ) : (
                                <View style={{ width: 13 }} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Right Main Card: Providers List + Manage Models */}
                  <View style={styles.providersCard}>
                    <ScrollView bounces={false} style={styles.providersList}>
                      {availableProviders.map((prov) => {
                        const hasActive = prov.models.some((m) => m.id === activeModel);
                        const isHovered = activeProvider?.id === prov.id;

                        return (
                          <TouchableOpacity
                            key={prov.id}
                            style={[
                              styles.providerRow,
                              isHovered && styles.providerRowHovered,
                            ]}
                            onPress={() => setSelectedProviderId(prov.id)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.providerName,
                                isHovered && styles.providerNameHovered,
                              ]}
                              numberOfLines={1}
                            >
                              {prov.name}
                            </Text>

                            <View style={styles.providerRowRight}>
                              {hasActive && (
                                <Check size={13} color="#e4e4e7" strokeWidth={2.5} />
                              )}
                              <ChevronRight size={13} color="#71717a" />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <View style={styles.separator} />

                    {/* Bottom Action: Manage Models */}
                    <TouchableOpacity
                      style={styles.manageRow}
                      onPress={handleOpenManageModels}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.manageText}>Manage models</Text>
                    </TouchableOpacity>
                  </View>
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
    alignItems: "flex-end",
  },
  twoTierContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  /* Left Models Submenu Card */
  modelsFlyoutCard: {
    width: 170,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 20,
    paddingVertical: 4,
    maxHeight: 280,
  },
  flyoutList: {
    maxHeight: 270,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 7,
    marginHorizontal: 3,
    marginVertical: 1,
  },
  modelRowActive: {
    backgroundColor: "#27272a",
  },
  modelName: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "400",
    flex: 1,
    marginRight: 6,
  },
  modelNameActive: {
    color: "#fafafa",
    fontWeight: "500",
  },
  /* Right Providers Card */
  providersCard: {
    width: 180,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 20,
    paddingVertical: 4,
    maxHeight: 280,
  },
  providersList: {
    maxHeight: 220,
  },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 7,
    marginHorizontal: 3,
    marginVertical: 1,
  },
  providerRowHovered: {
    backgroundColor: "#27272a",
  },
  providerName: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "400",
    flex: 1,
    marginRight: 4,
  },
  providerNameHovered: {
    color: "#fafafa",
    fontWeight: "500",
  },
  providerRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#27272a",
    marginVertical: 4,
    marginHorizontal: 4,
  },
  manageRow: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginHorizontal: 3,
    borderRadius: 7,
  },
  manageText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "400",
  },
  /* Empty State Card */
  emptyCard: {
    width: 250,
    backgroundColor: "#18181b",
    borderColor: "#27272a",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  emptySubtitle: {
    color: "#71717a",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  manageButtonText: {
    color: "#38bdf8",
    fontSize: 11.5,
    fontWeight: "500",
  },
});

