import React, { useState, useEffect, useMemo } from "react";
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
  Linking,
  Platform,
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
  LogOut,
  Save,
  Sparkles,
  Eye,
  EyeOff,
  CreditCard,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  Copy,
  Zap,
  RefreshCw,
} from "lucide-react-native";
import { useAction } from "convex/react";
import { api } from "@const-ai/backend";
import { OperatingMode } from "@const-ai/types";
import { useNavigation } from "../../context/NavigationContext";
import { TermuxBridge } from "../../services/termux/TermuxBridge";

const OPERATING_MODES: {
  id: OperatingMode;
  name: string;
  badge: string;
  badgeColor: string;
  desc: string;
}[] = [
  {
    id: "normal_mode",
    name: "1. Normal Mode (Default)",
    badge: "Aman",
    badgeColor: "#22c55e",
    desc: "Obrolan asisten AI & analisis kode murni tanpa akses terminal/sistem perangkat.",
  },
  {
    id: "ask_before_change",
    name: "2. Ask Before Change",
    badge: "HITL",
    badgeColor: "#f59e0b",
    desc: "Akses terminal Termux & tools OS aktif dengan konfirmasi per tindakan (HITL).",
  },
  {
    id: "plan_mode",
    name: "3. Plan Mode",
    badge: "Plan First",
    badgeColor: "#38bdf8",
    desc: "Membuat dokumen rencana kerja terlebih dahulu, akses terminal dengan izin.",
  },
  {
    id: "full_access_yolo",
    name: "4. Full Access (YOLO)",
    badge: "Unrestricted",
    badgeColor: "#ef4444",
    desc: "Eksekusi terminal dan perintah sistem otomatis tanpa dialog konfirmasi.",
  },
];

const CLOUD_PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    desc: "Gemini 2.0 Flash, Gemini 2.0 Pro",
    placeholder: "AIzaSy...",
    badge: "Multimodal & Fast",
    testModel: "gemini-2.0-flash",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    desc: "Claude 3.7 Sonnet, Claude 3.5 Haiku",
    placeholder: "sk-ant-...",
    badge: "Deep Reasoning",
    testModel: "claude-3-7-sonnet",
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "GPT-4o, GPT-4o Mini, o3-mini",
    placeholder: "sk-proj-...",
    badge: "Industry Standard",
    testModel: "gpt-4o",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    desc: "200+ Model (DeepSeek R1, Llama 3, dll.)",
    placeholder: "sk-or-v1-...",
    badge: "Multi-LLM Hub",
    testModel: "deepseek/deepseek-r1",
  },
];

export const SettingsModal: React.FC = () => {
  const router = useRouter();
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    settingsInitialTab,
    currentUser,
    userConfig,
    activeModel,
    setActiveModel,
    activeOperatingMode,
    setActiveOperatingMode,
    updateUserProfile,
    updateUserSettings,
    logout,
  } = useNavigation();

  const testModelAction = useAction(api.agent.testModelEndpoint);

  // Active Tab: profile | models | mode | system
  const [activeTab, setActiveTab] = useState<"profile" | "models" | "mode" | "system">(
    settingsInitialTab || "profile"
  );

  useEffect(() => {
    if (isSettingsModalOpen && settingsInitialTab) {
      setActiveTab(settingsInitialTab);
    }
  }, [isSettingsModalOpen, settingsInitialTab]);

  // Edit Profile States
  const [editName, setEditName] = useState(currentUser?.name || "Alif Constantine");
  const [editUsername, setEditUsername] = useState(currentUser?.username || "alif");
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Cloud API Keys State
  const [geminiKey, setGeminiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Custom Providers State
  const [customProvidersList, setCustomProvidersList] = useState<any[]>([]);
  const [isAddingCustomProvider, setIsAddingCustomProvider] = useState(false);
  const [newProvName, setNewProvName] = useState("");
  const [newProvBaseUrl, setNewProvBaseUrl] = useState("http://10.0.2.2:11434/v1");
  const [newProvApiKey, setNewProvApiKey] = useState("");
  const [newProvFormat, setNewProvFormat] = useState("openai_completions");

  // Ping / Latency Test States (keyed by provider ID)
  const [testingStatus, setTestingStatus] = useState<
    Record<string, { loading: boolean; latencyMs?: number; success?: boolean; error?: string }>
  >({});

  // Save Settings State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Termux Status State
  const [termuxStatus, setTermuxStatus] = useState<{
    checked: boolean;
    isInstalled: boolean;
    isPermissionGranted: boolean;
    isNative: boolean;
    version?: string;
  }>({
    checked: false,
    isInstalled: false,
    isPermissionGranted: false,
    isNative: false,
  });
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Sync state from context / userConfig
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditUsername(currentUser.username);
      setEditAvatarUrl(currentUser.avatarUrl || "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (userConfig) {
      if (userConfig.customApiKeys) {
        setGeminiKey(userConfig.customApiKeys.gemini || "");
        setAnthropicKey(userConfig.customApiKeys.anthropic || "");
        setOpenAiKey(userConfig.customApiKeys.openAi || "");
        setOpenRouterKey(userConfig.customApiKeys.openRouter || "");
      }
      if (userConfig.customProviders) {
        setCustomProvidersList(userConfig.customProviders);
      }
    }
  }, [userConfig]);

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  const handleSaveAllSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSaveSuccess(false);
    try {
      const keysPayload = {
        gemini: geminiKey.trim(),
        anthropic: anthropicKey.trim(),
        openAi: openAiKey.trim(),
        openRouter: openRouterKey.trim(),
      };

      await updateUserSettings({
        activeModel: activeModel || "",
        customApiKeys: keysPayload,
        customProviders: customProvidersList,
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

  // Test Cloud or Custom Provider Latency
  const handleTestProvider = async (
    provId: string,
    modelName: string,
    key: string,
    baseUrl?: string
  ) => {
    setTestingStatus((prev) => ({
      ...prev,
      [provId]: { loading: true },
    }));

    try {
      const res = await testModelAction({
        provider: provId === "gemini" || provId === "anthropic" || provId === "openai" || provId === "openrouter" ? provId : "custom_openai",
        model: modelName,
        apiKey: key.trim(),
        customBaseUrl: baseUrl?.trim(),
      });

      setTestingStatus((prev) => ({
        ...prev,
        [provId]: {
          loading: false,
          success: res.success,
          latencyMs: res.latencyMs,
          error: res.error,
        },
      }));
    } catch (err: any) {
      setTestingStatus((prev) => ({
        ...prev,
        [provId]: {
          loading: false,
          success: false,
          error: err?.message || "Gagal menghubungi endpoint",
        },
      }));
    }
  };

  // Add Custom Provider Handler
  const handleAddCustomProvider = () => {
    if (!newProvName.trim() || !newProvBaseUrl.trim()) return;

    const newProv = {
      id: `custom_${Date.now()}`,
      name: newProvName.trim(),
      baseUrl: newProvBaseUrl.trim(),
      apiKey: newProvApiKey.trim() || undefined,
      apiFormat: newProvFormat,
      isActive: true,
      models: [
        {
          id: `${newProvName.toLowerCase().replace(/\s+/g, "-")}-default`,
          name: `${newProvName.trim()} Default`,
          contextWindow: 128000,
          supportsTools: true,
        },
      ],
    };

    setCustomProvidersList((prev) => [...prev, newProv]);
    setNewProvName("");
    setNewProvBaseUrl("http://10.0.2.2:11434/v1");
    setNewProvApiKey("");
    setIsAddingCustomProvider(false);
  };

  // Remove Custom Provider
  const handleRemoveCustomProvider = (id: string) => {
    setCustomProvidersList((prev) => prev.filter((p) => p.id !== id));
  };

  // Check Termux Status on Android
  const handleCheckTermux = async () => {
    const isNative = TermuxBridge.isNativeAvailable();
    const status = await TermuxBridge.checkStatus();
    setTermuxStatus({
      checked: true,
      isInstalled: status.isInstalled,
      isPermissionGranted: status.isPermissionGranted,
      isNative,
      version: status.version,
    });
  };

  const handleCopyTermuxCommand = () => {
    const cmd = `mkdir -p ~/.termux && echo "allow-external-apps = true" >> ~/.termux/termux.properties && termux-reload-settings`;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
    }
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Dynamic available models derived purely from user's configured keys & custom endpoints (Zero Default Fallback)
  const userConfiguredModels = useMemo(() => {
    const list: Array<{ id: string; name: string; badge: string; contextWindow?: number }> = [];
    const seen = new Set<string>();

    // 1. From Custom Providers
    for (const prov of customProvidersList) {
      if (prov.isActive !== false && prov.models) {
        for (const m of prov.models) {
          if (m.id && !seen.has(m.id)) {
            seen.add(m.id);
            list.push({
              id: m.id,
              name: m.name || m.id,
              badge: prov.name,
              contextWindow: m.contextLength || m.contextWindow || 128000,
            });
          }
        }
      }
    }

    // 2. From Configured Cloud API Keys
    if (geminiKey.trim().length > 0) {
      const gModels = [
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", badge: "Google", contextWindow: 1048576 },
        { id: "gemini-2.0-pro-exp-02-05", name: "Gemini 2.0 Pro", badge: "Google", contextWindow: 2097152 },
      ];
      for (const gm of gModels) {
        if (!seen.has(gm.id)) {
          seen.add(gm.id);
          list.push(gm);
        }
      }
    }

    if (anthropicKey.trim().length > 0) {
      const aModels = [
        { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", badge: "Anthropic", contextWindow: 200000 },
        { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", badge: "Anthropic", contextWindow: 200000 },
      ];
      for (const am of aModels) {
        if (!seen.has(am.id)) {
          seen.add(am.id);
          list.push(am);
        }
      }
    }

    if (openAiKey.trim().length > 0) {
      const oModels = [
        { id: "gpt-4o", name: "GPT-4o", badge: "OpenAI", contextWindow: 128000 },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", badge: "OpenAI", contextWindow: 128000 },
      ];
      for (const om of oModels) {
        if (!seen.has(om.id)) {
          seen.add(om.id);
          list.push(om);
        }
      }
    }

    if (openRouterKey.trim().length > 0) {
      const rModels = [
        { id: "deepseek/deepseek-r1", name: "DeepSeek R1", badge: "OpenRouter", contextWindow: 64000 },
        { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet", badge: "OpenRouter", contextWindow: 200000 },
        { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", badge: "OpenRouter", contextWindow: 1000000 },
      ];
      for (const rm of rModels) {
        if (!seen.has(rm.id)) {
          seen.add(rm.id);
          list.push(rm);
        }
      }
    }

    return list;
  }, [geminiKey, anthropicKey, openAiKey, openRouterKey, customProvidersList]);

  const handleLogout = async () => {
    setSettingsModalOpen(false);
    await logout();
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
              {/* Top Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Sliders size={16} color="#38bdf8" />
                  <Text style={styles.headerTitle}>Settings & BYOK Hub</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSettingsModalOpen(false)}
                  accessibilityLabel="Close settings"
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
                    Modes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, activeTab === "system" && styles.tabButtonActive]}
                  onPress={() => setActiveTab("system")}
                >
                  <Smartphone size={13} color={activeTab === "system" ? "#38bdf8" : "#71717a"} />
                  <Text style={[styles.tabButtonText, activeTab === "system" && styles.tabButtonTextActive]}>
                    Termux / OS
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Scroll Content */}
              <ScrollView style={styles.scrollContent} bounces={false}>
                {/* 1. USER PROFILE TAB */}
                {activeTab === "profile" && (
                  <View style={styles.tabContent}>
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

                    <TouchableOpacity style={styles.btnSignOut} onPress={handleLogout}>
                      <LogOut size={15} color="#f87171" />
                      <Text style={styles.btnSignOutText}>Sign Out / Switch Account</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 2. AI MODEL & BYOK TAB */}
                {activeTab === "models" && (
                  <View style={styles.tabContent}>
                    {/* Zero Default Banner */}
                    <View style={styles.byokBanner}>
                      <Key size={14} color="#38bdf8" />
                      <Text style={styles.byokBannerText}>
                        <Text style={{ fontWeight: "700", color: "#fafafa" }}>Murni Sistem BYOK: </Text>
                        Model hanya aktif jika API Key atau Custom Endpoint telah dimasukkan.
                      </Text>
                    </View>

                    {/* SECTION 1: Cloud API Keys */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Cloud Provider API Keys</Text>

                      {CLOUD_PROVIDERS.map((prov) => {
                        const isConfigured =
                          prov.id === "gemini"
                            ? Boolean(geminiKey.trim())
                            : prov.id === "anthropic"
                            ? Boolean(anthropicKey.trim())
                            : prov.id === "openai"
                            ? Boolean(openAiKey.trim())
                            : Boolean(openRouterKey.trim());

                        const keyValue =
                          prov.id === "gemini"
                            ? geminiKey
                            : prov.id === "anthropic"
                            ? anthropicKey
                            : prov.id === "openai"
                            ? openAiKey
                            : openRouterKey;

                        const setKeyValue =
                          prov.id === "gemini"
                            ? setGeminiKey
                            : prov.id === "anthropic"
                            ? setAnthropicKey
                            : prov.id === "openai"
                            ? setOpenAiKey
                            : setOpenRouterKey;

                        const isShow = showKeys[prov.id];
                        const testState = testingStatus[prov.id];

                        return (
                          <View key={prov.id} style={styles.providerCard}>
                            <View style={styles.providerCardHeader}>
                              <View>
                                <Text style={styles.providerCardTitle}>{prov.name}</Text>
                                <Text style={styles.providerCardDesc}>{prov.desc}</Text>
                              </View>
                              <View style={[styles.statusBadge, isConfigured && styles.statusBadgeConfigured]}>
                                <Text
                                  style={[
                                    styles.statusBadgeText,
                                    isConfigured && styles.statusBadgeTextConfigured,
                                  ]}
                                >
                                  {isConfigured ? "Configured" : "No Key"}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.inputWrapper}>
                              <Key size={13} color="#71717a" style={{ marginRight: 6 }} />
                              <TextInput
                                style={styles.inputInside}
                                value={keyValue}
                                onChangeText={setKeyValue}
                                placeholder={prov.placeholder}
                                placeholderTextColor="#52525b"
                                secureTextEntry={!isShow}
                                autoCapitalize="none"
                              />
                              <TouchableOpacity onPress={() => toggleShowKey(prov.id)} style={{ padding: 4 }}>
                                {isShow ? <EyeOff size={15} color="#a1a1aa" /> : <Eye size={15} color="#a1a1aa" />}
                              </TouchableOpacity>
                            </View>

                            {/* Test Key Row */}
                            <View style={styles.testRow}>
                              <TouchableOpacity
                                style={[styles.btnTest, !isConfigured && styles.btnTestDisabled]}
                                onPress={() => handleTestProvider(prov.id, prov.testModel, keyValue)}
                                disabled={!isConfigured || testState?.loading}
                              >
                                {testState?.loading ? (
                                  <ActivityIndicator size="small" color="#38bdf8" />
                                ) : (
                                  <>
                                    <Zap size={12} color={isConfigured ? "#38bdf8" : "#71717a"} />
                                    <Text
                                      style={[
                                        styles.btnTestText,
                                        isConfigured && styles.btnTestTextActive,
                                      ]}
                                    >
                                      Test Latency
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>

                              {testState && !testState.loading && (
                                <View
                                  style={[
                                    styles.testResultPill,
                                    testState.success ? styles.testResultSuccess : styles.testResultFailed,
                                  ]}
                                >
                                  {testState.success ? (
                                    <>
                                      <Check size={11} color="#22c55e" />
                                      <Text style={styles.testResultSuccessText}>
                                        {testState.latencyMs}ms OK
                                      </Text>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle size={11} color="#ef4444" />
                                      <Text style={styles.testResultFailedText} numberOfLines={1}>
                                        Error
                                      </Text>
                                    </>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* SECTION 2: Custom Providers (Ollama, LM Studio, vLLM) */}
                    <View style={styles.section}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={styles.sectionTitle}>Custom Endpoints (Ollama / Local)</Text>
                        <TouchableOpacity
                          style={styles.btnAddSmall}
                          onPress={() => setIsAddingCustomProvider(!isAddingCustomProvider)}
                        >
                          <Plus size={12} color="#38bdf8" />
                          <Text style={styles.btnAddSmallText}>
                            {isAddingCustomProvider ? "Cancel" : "Add Endpoint"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {isAddingCustomProvider && (
                        <View style={styles.addCustomCard}>
                          <Text style={styles.formCardTitle}>New Custom Endpoint</Text>

                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Provider Name</Text>
                            <TextInput
                              style={styles.input}
                              value={newProvName}
                              onChangeText={setNewProvName}
                              placeholder="Ollama Local / LM Studio"
                              placeholderTextColor="#52525b"
                            />
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Base URL</Text>
                            <TextInput
                              style={styles.input}
                              value={newProvBaseUrl}
                              onChangeText={setNewProvBaseUrl}
                              placeholder="http://10.0.2.2:11434/v1"
                              placeholderTextColor="#52525b"
                              autoCapitalize="none"
                            />
                          </View>

                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>API Key (Optional)</Text>
                            <TextInput
                              style={styles.input}
                              value={newProvApiKey}
                              onChangeText={setNewProvApiKey}
                              placeholder="Optional API Key"
                              placeholderTextColor="#52525b"
                              autoCapitalize="none"
                            />
                          </View>

                          <TouchableOpacity style={styles.btnAction} onPress={handleAddCustomProvider}>
                            <Plus size={14} color="#09090b" />
                            <Text style={styles.btnActionText}>Save Custom Provider</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {customProvidersList.map((prov) => (
                        <View key={prov.id} style={styles.customProvCard}>
                          <View style={styles.customProvHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.providerCardTitle}>{prov.name}</Text>
                              <Text style={styles.customProvUrl}>{prov.baseUrl}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleRemoveCustomProvider(prov.id)}
                              style={styles.btnDelete}
                            >
                              <Trash2 size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* SECTION 3: Active Model Selector */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        Active Model ({userConfiguredModels.length} Configured)
                      </Text>

                      {userConfiguredModels.length === 0 ? (
                        <View style={styles.emptyModelWarning}>
                          <AlertCircle size={15} color="#f59e0b" />
                          <Text style={styles.emptyModelWarningText}>
                            Belum ada model aktif. Silakan masukkan API Key di atas agar model muncul di sini.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.modelList}>
                          {userConfiguredModels.map((m) => {
                            const isSelected = activeModel === m.id;
                            return (
                              <TouchableOpacity
                                key={m.id}
                                style={[styles.modelOptionCard, isSelected && styles.modelOptionCardActive]}
                                onPress={() => setActiveModel(m.id)}
                              >
                                <View style={styles.modelOptionInfo}>
                                  <Text
                                    style={[
                                      styles.modelOptionName,
                                      isSelected && styles.modelOptionNameActive,
                                    ]}
                                  >
                                    {m.name}
                                  </Text>
                                  <View style={styles.modelBadge}>
                                    <Text style={styles.modelBadgeText}>{m.badge}</Text>
                                  </View>
                                </View>
                                {isSelected && <Check size={15} color="#38bdf8" strokeWidth={2.5} />}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Save All AI Settings */}
                    <TouchableOpacity
                      style={[styles.btnAction, settingsSaveSuccess && styles.btnActionSuccess]}
                      onPress={handleSaveAllSettings}
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
                          <Text style={styles.btnActionText}>Save AI & BYOK Keys</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* 3. OPERATING MODE TAB */}
                {activeTab === "mode" && (
                  <View style={styles.tabContent}>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Agent Operating Mode (Safety & Governance)</Text>

                      <View style={styles.modeList}>
                        {OPERATING_MODES.map((mode) => {
                          const isSelected = activeOperatingMode === mode.id;
                          return (
                            <TouchableOpacity
                              key={mode.id}
                              style={[styles.modeCard, isSelected && styles.modeCardActive]}
                              onPress={() => {
                                setActiveOperatingMode(mode.id);
                                updateUserSettings({ operatingMode: mode.id });
                              }}
                            >
                              <View style={{ flex: 1, gap: 4 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                  <Text style={[styles.modeName, isSelected && styles.modeNameActive]}>
                                    {mode.name}
                                  </Text>
                                  <View
                                    style={[
                                      styles.modeBadge,
                                      { backgroundColor: `${mode.badgeColor}20`, borderColor: `${mode.badgeColor}40` },
                                    ]}
                                  >
                                    <Text style={[styles.modeBadgeText, { color: mode.badgeColor }]}>
                                      {mode.badge}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.modeDesc}>{mode.desc}</Text>
                              </View>
                              {isSelected && <Check size={16} color="#38bdf8" strokeWidth={2.5} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}

                {/* 4. TERMUX & DEVICE SETUP TAB */}
                {activeTab === "system" && (
                  <View style={styles.tabContent}>
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Linux Termux Setup (On-Device Terminal)</Text>

                      <View style={styles.termuxGuideCard}>
                        <View style={styles.guideStep}>
                          <View style={styles.stepNumCircle}>
                            <Text style={styles.stepNumText}>1</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.guideStepTitle}>Pasang Termux dari F-Droid</Text>
                            <Text style={styles.guideStepDesc}>
                              Gunakan Termux versi F-Droid atau GitHub Releases (jangan gunakan versi Google Play Store karena sudah usang).
                            </Text>
                            <TouchableOpacity
                              style={styles.linkBtn}
                              onPress={() => Linking.openURL("https://f-droid.org/packages/com.termux/")}
                            >
                              <ExternalLink size={12} color="#38bdf8" />
                              <Text style={styles.linkBtnText}>Buka Link Download F-Droid</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.guideStep}>
                          <View style={styles.stepNumCircle}>
                            <Text style={styles.stepNumText}>2</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.guideStepTitle}>Konfigurasi allow-external-apps</Text>
                            <Text style={styles.guideStepDesc}>
                              Buka Termux di HP dan jalankan perintah berikut agar aplikasi Const AI dapat mengeksekusi script:
                            </Text>
                            <View style={styles.codeBox}>
                              <Text style={styles.codeText}>
                                mkdir -p ~/.termux && echo "allow-external-apps = true" &gt;&gt; ~/.termux/termux.properties && termux-reload-settings
                              </Text>
                              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyTermuxCommand}>
                                {copiedSnippet ? (
                                  <Check size={12} color="#22c55e" />
                                ) : (
                                  <Copy size={12} color="#71717a" />
                                )}
                                <Text style={styles.copyBtnText}>
                                  {copiedSnippet ? "Copied" : "Copy"}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        <View style={styles.guideStep}>
                          <View style={styles.stepNumCircle}>
                            <Text style={styles.stepNumText}>3</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.guideStepTitle}>Izinkan Permission RUN_COMMAND</Text>
                            <Text style={styles.guideStepDesc}>
                              Buka Pengaturan Android &gt; Aplikasi &gt; Termux &gt; Izin Lainnya &gt; Aktifkan "Run commands in Termux environment".
                            </Text>
                          </View>
                        </View>

                        {/* Check Status Action */}
                        <TouchableOpacity style={styles.btnCheckStatus} onPress={handleCheckTermux}>
                          <RefreshCw size={13} color="#fafafa" />
                          <Text style={styles.btnCheckStatusText}>Cek Status Integrasi Termux</Text>
                        </TouchableOpacity>

                        {termuxStatus.checked && (
                          <View style={styles.statusReportCard}>
                            <View style={styles.statusReportRow}>
                              <Text style={styles.statusReportLabel}>Termux Terpasang:</Text>
                              <Text style={termuxStatus.isInstalled ? styles.textSuccess : styles.textDanger}>
                                {termuxStatus.isInstalled ? `Ya (${termuxStatus.version || "OK"})` : "Tidak Terdeteksi"}
                              </Text>
                            </View>
                            <View style={styles.statusReportRow}>
                              <Text style={styles.statusReportLabel}>Izin Eksekusi Command:</Text>
                              <Text style={termuxStatus.isPermissionGranted ? styles.textSuccess : styles.textDanger}>
                                {termuxStatus.isPermissionGranted ? "Diberikan" : "Belum Diberikan"}
                              </Text>
                            </View>
                            <View style={styles.statusReportRow}>
                              <Text style={styles.statusReportLabel}>Native Module Android:</Text>
                              <Text style={termuxStatus.isNative ? styles.textSuccess : styles.textWarning}>
                                {termuxStatus.isNative ? "Aktif (Dev Build)" : "Mock (Expo Go)"}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* SECTION 2: System Services Status */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Status Layanan Sistem</Text>
                      <View style={styles.serviceStatusCard}>
                        <View style={styles.serviceRow}>
                          <Text style={styles.serviceLabel}>Shizuku Privileged ADB</Text>
                          <View style={styles.serviceBadgeOk}>
                            <Text style={styles.serviceBadgeOkText}>Ready</Text>
                          </View>
                        </View>
                        <View style={styles.serviceRow}>
                          <Text style={styles.serviceLabel}>Accessibility Spatial Tap</Text>
                          <View style={styles.serviceBadgeOk}>
                            <Text style={styles.serviceBadgeOkText}>Enabled</Text>
                          </View>
                        </View>
                        <View style={styles.serviceRow}>
                          <Text style={styles.serviceLabel}>Supertonic Neural Voice</Text>
                          <View style={styles.serviceBadgeOk}>
                            <Text style={styles.serviceBadgeOkText}>ONNX Ready</Text>
                          </View>
                        </View>
                        <View style={styles.serviceRow}>
                          <Text style={styles.serviceLabel}>Convex Cloud Database</Text>
                          <View style={styles.serviceBadgeOk}>
                            <Text style={styles.serviceBadgeOkText}>Cloud Live</Text>
                          </View>
                        </View>
                      </View>
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
    paddingBottom: 16,
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
  byokBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    padding: 10,
    borderRadius: 8,
  },
  byokBannerText: {
    color: "#d4d4d8",
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
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
  providerCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  providerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  providerCardTitle: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  providerCardDesc: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    backgroundColor: "#27272a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeConfigured: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "rgba(34, 197, 94, 0.3)",
    borderWidth: 1,
  },
  statusBadgeText: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadgeTextConfigured: {
    color: "#4ade80",
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnTest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1e1e24",
    borderWidth: 1,
    borderColor: "#2a2a32",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  btnTestDisabled: {
    opacity: 0.4,
  },
  btnTestText: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "500",
  },
  btnTestTextActive: {
    color: "#38bdf8",
  },
  testResultPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  testResultSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
  },
  testResultSuccessText: {
    color: "#4ade80",
    fontSize: 10.5,
    fontWeight: "600",
  },
  testResultFailed: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  testResultFailedText: {
    color: "#f87171",
    fontSize: 10.5,
    fontWeight: "600",
  },
  btnAddSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  btnAddSmallText: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "600",
  },
  addCustomCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#38bdf840",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  customProvCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 10,
  },
  customProvHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customProvUrl: {
    color: "#71717a",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  btnDelete: {
    padding: 6,
  },
  emptyModelWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    padding: 10,
    borderRadius: 8,
  },
  emptyModelWarningText: {
    color: "#f59e0b",
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  modelList: {
    gap: 6,
  },
  modelOptionCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modelOptionCardActive: {
    borderColor: "#38bdf8",
    backgroundColor: "#171d24",
  },
  modelOptionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modelOptionName: {
    color: "#d4d4d8",
    fontSize: 12.5,
    fontWeight: "500",
  },
  modelOptionNameActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  modelBadge: {
    backgroundColor: "#27272a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modelBadgeText: {
    color: "#a1a1aa",
    fontSize: 9.5,
    fontWeight: "500",
  },
  modeList: {
    gap: 8,
  },
  modeCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeCardActive: {
    borderColor: "#38bdf8",
    backgroundColor: "#141c24",
  },
  modeName: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  modeNameActive: {
    color: "#38bdf8",
  },
  modeBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modeBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  modeDesc: {
    color: "#71717a",
    fontSize: 11.5,
    lineHeight: 16,
  },
  termuxGuideCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  guideStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumText: {
    color: "#fafafa",
    fontSize: 11,
    fontWeight: "700",
  },
  guideStepTitle: {
    color: "#fafafa",
    fontSize: 12.5,
    fontWeight: "600",
  },
  guideStepDesc: {
    color: "#a1a1aa",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  linkBtnText: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "600",
  },
  codeBox: {
    backgroundColor: "#0d0d10",
    borderWidth: 1,
    borderColor: "#222228",
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    gap: 6,
  },
  codeText: {
    color: "#38bdf8",
    fontSize: 10.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 15,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    backgroundColor: "#1c1c22",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  copyBtnText: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "500",
  },
  btnCheckStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#27272a",
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  btnCheckStatusText: {
    color: "#fafafa",
    fontSize: 11.5,
    fontWeight: "600",
  },
  statusReportCard: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  statusReportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusReportLabel: {
    color: "#a1a1aa",
    fontSize: 11,
  },
  textSuccess: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
  },
  textDanger: {
    color: "#f87171",
    fontSize: 11,
    fontWeight: "600",
  },
  textWarning: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "600",
  },
  serviceStatusCard: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceLabel: {
    color: "#d4d4d8",
    fontSize: 12,
  },
  serviceBadgeOk: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceBadgeOkText: {
    color: "#4ade80",
    fontSize: 10,
    fontWeight: "600",
  },
});
