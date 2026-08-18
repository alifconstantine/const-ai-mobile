import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  X,
  Sliders,
  ShieldCheck,
  Key,
  Cpu,
  Smartphone,
  Check,
  User,
  Mail,
  Globe,
  LogOut,
  Save,
  Sparkles,
  Eye,
  EyeOff,
  CreditCard,
  Layers,
} from "lucide-react-native";
import { OperatingMode } from "@const-ai/types";
import { useNavigation } from "../../context/NavigationContext";

const PROVIDERS = [
  { id: "custom_openai", name: "OmniRoute / Custom", badge: "Local/Proxy" },
  { id: "gemini", name: "Google Gemini", badge: "Multimodal" },
  { id: "anthropic", name: "Anthropic Claude", badge: "Reasoning" },
  { id: "openrouter", name: "OpenRouter", badge: "200+ Models" },
  { id: "openai", name: "OpenAI", badge: "GPT-4o" },
];

const MODELS = [
  { id: "Const", name: "Const (OmniRoute)", badge: "Fast" },
  { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", badge: "Fast" },
  { id: "claude-3.7-sonnet", name: "Claude 3.7 Sonnet", badge: "Thinking" },
  { id: "deepseek-r1", name: "DeepSeek R1", badge: "Reasoning" },
  { id: "gpt-4o", name: "GPT-4o", badge: "Omni" },
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
    desc: "Every file edit and shell command requires explicit confirmation",
  },
  {
    id: "edit_automatically",
    name: "3. Edit Automatically",
    desc: "Directly edits files and runs low-risk commands automatically",
  },
  {
    id: "full_access_yolo",
    name: "4. Full Access (YOLO)",
    desc: "Zero-prompt autonomous execution for rapid development",
  },
];

export const SettingsModal: React.FC = () => {
  const router = useRouter();
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    currentUser,
    userConfig,
    activeModel,
    setActiveModel,
    activeOperatingMode,
    setActiveOperatingMode,
    customApiKey,
    setCustomApiKey,
    customBaseUrl,
    setCustomBaseUrl,
    updateUserProfile,
    updateUserSettings,
    logout,
  } = useNavigation();

  // Active Tab: profile | models | mode | system
  const [activeTab, setActiveTab] = useState<"profile" | "models" | "mode" | "system">("profile");

  // Edit Profile States
  const [editName, setEditName] = useState(currentUser?.name || "Alif Constantine");
  const [editUsername, setEditUsername] = useState(currentUser?.username || "alif");
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Provider & API Key States
  const [selectedProvider, setSelectedProvider] = useState(userConfig?.provider || "custom_openai");
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey || "");
  const [baseUrlInput, setBaseUrlInput] = useState(customBaseUrl || "http://localhost:20128/v1");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditUsername(currentUser.username);
      setEditAvatarUrl(currentUser.avatarUrl || "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (userConfig) {
      setSelectedProvider(userConfig.provider);
      if (userConfig.customBaseUrl) setBaseUrlInput(userConfig.customBaseUrl);
      if (userConfig.customApiKeys?.openAi) setApiKeyInput(userConfig.customApiKeys.openAi);
    }
  }, [userConfig]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    try {
      await updateUserProfile({
        name: editName.trim(),
        username: editUsername.trim(),
        avatarUrl: editAvatarUrl.trim() || undefined,
      });
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);
    try {
      await updateUserSettings({
        activeModel,
        provider: selectedProvider,
        customBaseUrl: baseUrlInput.trim(),
        customApiKeys: {
          openAi: apiKeyInput.trim(),
          openRouter: apiKeyInput.trim(),
        },
        operatingMode: activeOperatingMode,
      });
      setSettingsSaveSuccess(true);
      setTimeout(() => setSettingsSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogout = () => {
    setSettingsModalOpen(false);
    logout();
    router.replace("/login");
  };

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
                  <Sliders size={16} color="#38bdf8" />
                  <Text style={styles.headerTitle}>Settings & Profile</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSettingsModalOpen(false)}
                >
                  <X size={18} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              {/* Segmented Tab Navigation */}
              <View style={styles.tabNav}>
                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "profile" && styles.tabButtonActive]}
                  onPress={() => setActiveTab("profile")}
                >
                  <User size={13} color={activeTab === "profile" ? "#38bdf8" : "#71717a"} />
                  <Text style={[styles.tabButtonText, activeTab === "profile" && styles.tabButtonTextActive]}>
                    Profile
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "models" && styles.tabButtonActive]}
                  onPress={() => setActiveTab("models")}
                >
                  <Cpu size={13} color={activeTab === "models" ? "#38bdf8" : "#71717a"} />
                  <Text style={[styles.tabButtonText, activeTab === "models" && styles.tabButtonTextActive]}>
                    AI & BYOK
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "mode" && styles.tabButtonActive]}
                  onPress={() => setActiveTab("mode")}
                >
                  <ShieldCheck size={13} color={activeTab === "mode" ? "#38bdf8" : "#71717a"} />
                  <Text style={[styles.tabButtonText, activeTab === "mode" && styles.tabButtonTextActive]}>
                    Mode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "system" && styles.tabButtonActive]}
                  onPress={() => setActiveTab("system")}
                >
                  <Smartphone size={13} color={activeTab === "system" ? "#38bdf8" : "#71717a"} />
                  <Text style={[styles.tabButtonText, activeTab === "system" && styles.tabButtonTextActive]}>
                    System
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent} bounces={false}>
                {/* 1. USER PROFILE TAB */}
                {activeTab === "profile" && (
                  <View style={styles.tabContent}>
                    {/* User Card Overview */}
                    <View style={styles.profileCard}>
                      <View style={styles.avatarLarge}>
                        {currentUser?.avatarUrl ? (
                          <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarLargeImg} />
                        ) : (
                          <Text style={styles.avatarLargeText}>
                            {currentUser?.initials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "AC")}
                          </Text>
                        )}
                      </View>

                      <View style={styles.profileCardInfo}>
                        <Text style={styles.profileCardName}>{currentUser?.name || "Alif Constantine"}</Text>
                        <Text style={styles.profileCardUsername}>@{currentUser?.username || "alif"}</Text>
                        <Text style={styles.profileCardEmail}>{currentUser?.email || "alif@constai.platform"}</Text>
                      </View>
                    </View>

                    {/* Subscription Status & Credits */}
                    <View style={styles.planRow}>
                      <View style={styles.planBadge}>
                        <CreditCard size={12} color="#38bdf8" />
                        <Text style={styles.planBadgeText}>
                          Plan: {(currentUser?.subscriptionPlan || "Yearly Pro").toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.creditsBadge}>
                        <Sparkles size={12} color="#22c55e" />
                        <Text style={styles.creditsBadgeText}>
                          ${(currentUser?.creditsBalanceUsd || 100.0).toFixed(2)} USD
                        </Text>
                      </View>
                    </View>

                    {/* Edit Profile Form */}
                    <View style={styles.formCard}>
                      <Text style={styles.formCardTitle}>Edit User Profile</Text>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                          style={styles.input}
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Alif Constantine"
                          placeholderTextColor="#52525b"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Username Handle</Text>
                        <View style={styles.inputWrapper}>
                          <Text style={styles.atPrefix}>@</Text>
                          <TextInput
                            style={styles.inputInside}
                            value={editUsername}
                            onChangeText={setEditUsername}
                            placeholder="alif"
                            placeholderTextColor="#52525b"
                            autoCapitalize="none"
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Avatar Image URL</Text>
                        <TextInput
                          style={styles.input}
                          value={editAvatarUrl}
                          onChangeText={setEditAvatarUrl}
                          placeholder="https://..."
                          placeholderTextColor="#52525b"
                          autoCapitalize="none"
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.btnAction, profileSaveSuccess && styles.btnActionSuccess]}
                        onPress={handleSaveProfile}
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? (
                          <ActivityIndicator size="small" color="#09090b" />
                        ) : profileSaveSuccess ? (
                          <>
                            <Check size={15} color="#09090b" />
                            <Text style={styles.btnActionText}>Profile Saved!</Text>
                          </>
                        ) : (
                          <>
                            <Save size={15} color="#09090b" />
                            <Text style={styles.btnActionText}>Save Profile Changes</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity style={styles.btnSignOut} onPress={handleLogout}>
                      <LogOut size={15} color="#f87171" />
                      <Text style={styles.btnSignOutText}>Sign Out / Switch Account</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 2. AI MODEL & BYOK TAB */}
                {activeTab === "models" && (
                  <View style={styles.tabContent}>
                    {/* Active Provider Selector */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>AI Engine Provider</Text>
                      <View style={styles.optionsList}>
                        {PROVIDERS.map((prov) => {
                          const isSelected = selectedProvider === prov.id;
                          return (
                            <TouchableOpacity
                              key={prov.id}
                              style={[styles.optionCard, isSelected && styles.optionCardActive]}
                              onPress={() => setSelectedProvider(prov.id)}
                            >
                              <View style={styles.optionInfo}>
                                <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                                  {prov.name}
                                </Text>
                                <View style={styles.badge}>
                                  <Text style={styles.badgeText}>{prov.badge}</Text>
                                </View>
                              </View>
                              {isSelected && <Check size={16} color="#38bdf8" />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Custom Base URL & API Key Inputs */}
                    <View style={styles.formCard}>
                      <Text style={styles.formCardTitle}>Endpoint & BYOK API Key</Text>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Base URL / Custom Endpoint</Text>
                        <View style={styles.inputWrapper}>
                          <Globe size={14} color="#71717a" style={{ marginRight: 6 }} />
                          <TextInput
                            style={styles.inputInside}
                            value={baseUrlInput}
                            onChangeText={setBaseUrlInput}
                            placeholder="http://localhost:20128/v1"
                            placeholderTextColor="#52525b"
                            autoCapitalize="none"
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>API Key (Vault)</Text>
                        <View style={styles.inputWrapper}>
                          <Key size={14} color="#71717a" style={{ marginRight: 6 }} />
                          <TextInput
                            style={styles.inputInside}
                            value={apiKeyInput}
                            onChangeText={setApiKeyInput}
                            placeholder="sk-..."
                            placeholderTextColor="#52525b"
                            secureTextEntry={!showApiKey}
                            autoCapitalize="none"
                          />
                          <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? (
                              <EyeOff size={16} color="#a1a1aa" />
                            ) : (
                              <Eye size={16} color="#a1a1aa" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Active Model Picker */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Active Model</Text>
                      <View style={styles.optionsList}>
                        {MODELS.map((model) => {
                          const isSelected = activeModel === model.id;
                          return (
                            <TouchableOpacity
                              key={model.id}
                              style={[styles.optionCard, isSelected && styles.optionCardActive]}
                              onPress={() => setActiveModel(model.id)}
                            >
                              <View style={styles.optionInfo}>
                                <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
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

                    {/* Save AI Settings Button */}
                    <TouchableOpacity
                      style={[styles.btnAction, settingsSaveSuccess && styles.btnActionSuccess]}
                      onPress={handleSaveSettings}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? (
                        <ActivityIndicator size="small" color="#09090b" />
                      ) : settingsSaveSuccess ? (
                        <>
                          <Check size={15} color="#09090b" />
                          <Text style={styles.btnActionText}>AI Settings Saved!</Text>
                        </>
                      ) : (
                        <>
                          <Save size={15} color="#09090b" />
                          <Text style={styles.btnActionText}>Save AI & Endpoint Settings</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* 3. OPERATING MODE TAB */}
                {activeTab === "mode" && (
                  <View style={styles.tabContent}>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Agent Operating Mode</Text>
                      <View style={styles.optionsList}>
                        {OPERATING_MODES.map((mode) => {
                          const isSelected = activeOperatingMode === mode.id;
                          return (
                            <TouchableOpacity
                              key={mode.id}
                              style={[styles.optionCard, isSelected && styles.optionCardActive]}
                              onPress={() => {
                                setActiveOperatingMode(mode.id);
                                updateUserSettings({ operatingMode: mode.id });
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
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
                  </View>
                )}

                {/* 4. SYSTEM STATUS TAB */}
                {activeTab === "system" && (
                  <View style={styles.tabContent}>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Native Bridges & System Services</Text>
                      <View style={styles.statusGrid}>
                        <View style={styles.statusRow}>
                          <Text style={styles.statusLabel}>Shizuku Super Privileged</Text>
                          <View style={styles.statusPillActive}>
                            <Text style={styles.statusTextActive}>Ready</Text>
                          </View>
                        </View>

                        <View style={styles.statusRow}>
                          <Text style={styles.statusLabel}>Accessibility Spatial Tap</Text>
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
                          <Text style={styles.statusLabel}>Termux CLI Intent Runner</Text>
                          <View style={styles.statusPillActive}>
                            <Text style={styles.statusTextActive}>Connected</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.systemInfoCard}>
                      <Text style={styles.systemInfoTitle}>Convex Backend Status</Text>
                      <Text style={styles.systemInfoDesc}>
                        Connected to reactive database • Syncing 12 tables & Policy Engine
                      </Text>
                    </View>
                  </View>
                )}
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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 440,
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
    maxHeight: "88%",
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
  tabNav: {
    flexDirection: "row",
    backgroundColor: "#121215",
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#38bdf8",
  },
  tabButtonText: {
    color: "#71717a",
    fontSize: 11.5,
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: "#38bdf8",
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    gap: 14,
  },
  profileCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarLarge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarLargeImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarLargeText: {
    color: "#fafafa",
    fontSize: 17,
    fontWeight: "700",
  },
  profileCardInfo: {
    flex: 1,
  },
  profileCardName: {
    color: "#fafafa",
    fontSize: 14,
    fontWeight: "600",
  },
  profileCardUsername: {
    color: "#38bdf8",
    fontSize: 12,
  },
  profileCardEmail: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 2,
  },
  planRow: {
    flexDirection: "row",
    gap: 8,
  },
  planBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  planBadgeText: {
    color: "#38bdf8",
    fontSize: 10.5,
    fontWeight: "600",
  },
  creditsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  creditsBadgeText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  formCardTitle: {
    color: "#fafafa",
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: "#a1a1aa",
    fontSize: 10.5,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: "#fafafa",
    fontSize: 12.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
  },
  inputInside: {
    flex: 1,
    color: "#fafafa",
    fontSize: 12.5,
    padding: 0,
  },
  atPrefix: {
    color: "#71717a",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 4,
  },
  btnAction: {
    backgroundColor: "#38bdf8",
    borderRadius: 6,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  btnActionSuccess: {
    backgroundColor: "#4ade80",
  },
  btnActionText: {
    color: "#09090b",
    fontSize: 12.5,
    fontWeight: "600",
  },
  btnSignOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 6,
  },
  btnSignOutText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionsList: {
    gap: 6,
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
    fontSize: 12.5,
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
    fontSize: 9.5,
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
    fontSize: 12,
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
    fontSize: 10.5,
    fontWeight: "600",
  },
  systemInfoCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  systemInfoTitle: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
  },
  systemInfoDesc: {
    color: "#71717a",
    fontSize: 11,
    lineHeight: 15,
  },
});

