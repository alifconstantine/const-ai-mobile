"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@const-ai/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mic,
  Cpu,
  ShieldAlert,
  Smartphone,
  Check,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Zap,
  Server,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Download,
  Play,
  Search,
  Filter,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
} from "lucide-react";

export interface CustomModelItem {
  id: string;
  name?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsTools?: boolean;
}

export interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  apiFormat: "openai_completions" | "responses" | "anthropic_messages" | "gemini_native" | "ollama";
  isActive: boolean;
  models: CustomModelItem[];
}

const DEFAULT_BUILTIN_PROVIDERS = [
  { id: "openrouter", name: "OpenRouter", desc: "200+ aggregated models" },
  { id: "gemini", name: "Google Gemini", desc: "Fast OS & multimodal control" },
  { id: "anthropic", name: "Anthropic Claude", desc: "Claude 3.7 Sonnet & Hybrid reasoning" },
  { id: "openai", name: "OpenAI", desc: "GPT-4o & o3-mini" },
];

const INITIAL_CUSTOM_PROVIDERS: CustomProviderConfig[] = [
  {
    id: "omniroute",
    name: "OmniRoute",
    baseUrl: "http://localhost:20128/v1",
    apiKey: "sk-7852144cf1690e4d-297ffa-3396d47a",
    apiFormat: "openai_completions",
    isActive: true,
    models: [
      { id: "Const", name: "Const", contextWindow: 200000, supportsTools: true },
    ],
  },
];

export default function SettingsHubPage() {
  const [activeTab, setActiveTab] = useState<
    "models_hub" | "persona" | "voice" | "operating_mode" | "devices"
  >("models_hub");

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Convex Queries & Mutations
  const liveViewer = useQuery(api.users.viewer);
  const updateUserConfigMutation = useMutation(api.users.updateUserConfig);

  // Providers & Active State
  const [customProviders, setCustomProviders] = useState<CustomProviderConfig[]>(INITIAL_CUSTOM_PROVIDERS);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("omniroute");
  const [isCreatingNewProvider, setIsCreatingNewProvider] = useState(false);

  // Editor Form State for the selected provider
  const [editName, setEditName] = useState("OmniRoute");
  const [editBaseUrl, setEditBaseUrl] = useState("http://localhost:20128/v1");
  const [editApiKey, setEditApiKey] = useState("sk-7852144cf1690e4d-297ffa-3396d47a");
  const [editApiFormat, setEditApiFormat] = useState<CustomProviderConfig["apiFormat"]>("openai_completions");
  const [editModels, setEditModels] = useState<CustomModelItem[]>([
    { id: "Const", name: "Const", contextWindow: 200000, supportsTools: true },
  ]);
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");

  // Built-in API keys
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");

  // 1. Single "Add Model" Modal (Image 1 match)
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [modalModelId, setModalModelId] = useState("");
  const [modalContextWindow, setModalContextWindow] = useState("200000");
  const [modalMaxOutputTokens, setModalMaxOutputTokens] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // 2. Discovered Models Import Picker Modal (For clean bulk management)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [discoveredCandidates, setDiscoveredCandidates] = useState<Array<{ id: string; name: string; contextLength?: number }>>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [importSearchQuery, setImportSearchQuery] = useState("");
  const [importCategoryFilter, setImportCategoryFilter] = useState<string>("all");

  // Model Testing / Ping State (Per Model)
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [modelTestResults, setModelTestResults] = useState<
    Record<string, { success: boolean; latencyMs?: number; reply?: string; error?: string }>
  >({});

  // Fetch /models endpoint state
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchNotification, setFetchNotification] = useState<{
    type: "idle" | "success" | "error" | "info";
    message: string;
  }>({ type: "idle", message: "" });

  // Active Model & Persona State
  const [activeModel, setActiveModel] = useState("Const");
  const [temperature, setTemperature] = useState([0.7]);
  const [systemPersona, setSystemPersona] = useState(
    "You are Const AI, an autonomous personal assistant and mobile phone OS operator with neural voice capabilities."
  );

  // Voice Settings State
  const [ttsEngine, setTtsEngine] = useState<"local_supertonic" | "cloud_fallback">("local_supertonic");
  const [selectedVoice, setSelectedVoice] = useState("M1");
  const [speakingRate, setSpeakingRate] = useState([1.0]);
  const [enableEmotionTags, setEnableEmotionTags] = useState(true);
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);

  // Operating Mode State
  const [operatingMode, setOperatingMode] = useState<
    "plan_mode" | "ask_before_change" | "edit_automatically" | "full_access_yolo"
  >("ask_before_change");

  // Load from live Convex User Config
  useEffect(() => {
    if (liveViewer?.config) {
      const cfg = liveViewer.config;
      if (cfg.activeModel) setActiveModel(cfg.activeModel);
      if (cfg.operatingMode) setOperatingMode(cfg.operatingMode);
      if (cfg.temperature !== undefined) setTemperature([cfg.temperature]);
      if (cfg.systemPersona) setSystemPersona(cfg.systemPersona);

      if (cfg.customApiKeys) {
        if (cfg.customApiKeys.gemini) setGeminiKey(cfg.customApiKeys.gemini);
        if (cfg.customApiKeys.anthropic) setClaudeKey(cfg.customApiKeys.anthropic);
        if (cfg.customApiKeys.openAi) setOpenAiKey(cfg.customApiKeys.openAi);
        if (cfg.customApiKeys.openRouter) setOpenRouterKey(cfg.customApiKeys.openRouter);
      }

      if (cfg.customProviders && cfg.customProviders.length > 0) {
        const filtered = cfg.customProviders.filter((p: any) => p.id !== "zai" && p.name !== "Z.ai");
        if (filtered.length > 0) {
          setCustomProviders(filtered as any);
          const activeProv = filtered.find((p: any) => p.isActive) || filtered[0];
          if (activeProv) {
            setSelectedProviderId(activeProv.id);
            setEditName(activeProv.name);
            setEditBaseUrl(activeProv.baseUrl);
            setEditApiKey(activeProv.apiKey || "");
            setEditApiFormat((activeProv.apiFormat as any) || "openai_completions");
            setEditModels(activeProv.models || [{ id: "Const", name: "Const", contextWindow: 200000 }]);
          }
        }
      } else if (cfg.customBaseUrl) {
        setEditBaseUrl(cfg.customBaseUrl);
        if (cfg.customApiKeys?.openAi) {
          setEditApiKey(cfg.customApiKeys.openAi);
        }
      }

      if (cfg.voiceSettings) {
        if (cfg.voiceSettings.ttsEngine) setTtsEngine(cfg.voiceSettings.ttsEngine);
        if (cfg.voiceSettings.selectedVoiceStyle) setSelectedVoice(cfg.voiceSettings.selectedVoiceStyle);
        if (cfg.voiceSettings.speakingRate) setSpeakingRate([cfg.voiceSettings.speakingRate]);
        if (cfg.voiceSettings.enableEmotionTags !== undefined) setEnableEmotionTags(cfg.voiceSettings.enableEmotionTags);
        if (cfg.voiceSettings.autoPlayVoiceResponse !== undefined) setAutoPlayVoice(cfg.voiceSettings.autoPlayVoiceResponse);
      }
    }
  }, [liveViewer]);

  // Handle Selecting a Provider
  const handleSelectProvider = (provId: string) => {
    setIsCreatingNewProvider(false);
    setSelectedProviderId(provId);
    setFetchNotification({ type: "idle", message: "" });
    setModelTestResults({});
    setModelSearchQuery("");

    const found = customProviders.find((p) => p.id === provId);
    if (found) {
      setEditName(found.name);
      setEditBaseUrl(found.baseUrl);
      setEditApiKey(found.apiKey || "");
      setEditApiFormat(found.apiFormat || "openai_completions");
      setEditModels(found.models || []);
    } else {
      // Built-in provider
      const builtin = DEFAULT_BUILTIN_PROVIDERS.find((p) => p.id === provId);
      if (builtin) {
        setEditName(builtin.name);
        setEditBaseUrl(
          provId === "openrouter"
            ? "https://openrouter.ai/api/v1"
            : provId === "gemini"
            ? "https://generativelanguage.googleapis.com/v1beta/openai"
            : provId === "anthropic"
            ? "https://api.anthropic.com/v1"
            : "https://api.openai.com/v1"
        );
        setEditApiKey(
          provId === "gemini"
            ? geminiKey
            : provId === "anthropic"
            ? claudeKey
            : provId === "openrouter"
            ? openRouterKey
            : openAiKey
        );
        setEditApiFormat("openai_completions");
        setEditModels([
          {
            id:
              provId === "gemini"
                ? "google/gemini-2.0-flash-001"
                : provId === "anthropic"
                ? "claude-3-7-sonnet"
                : provId === "openrouter"
                ? "anthropic/claude-3.7-sonnet"
                : "gpt-4o",
            name: builtin.name,
            contextWindow: 200000,
          },
        ]);
      }
    }
  };

  // Start Adding a New Custom Provider
  const handleStartAddProvider = () => {
    setIsCreatingNewProvider(true);
    setSelectedProviderId("new_custom");
    setEditName("Custom Provider");
    setEditBaseUrl("http://localhost:20128/v1");
    setEditApiKey("");
    setEditApiFormat("openai_completions");
    setEditModels([{ id: "Const", name: "Const", contextWindow: 200000, supportsTools: true }]);
    setFetchNotification({ type: "idle", message: "" });
    setModelTestResults({});
  };

  // Open "Add Model" Modal (Image 1)
  const handleOpenAddModelModal = () => {
    setModalModelId("");
    setModalContextWindow("200000");
    setModalMaxOutputTokens("");
    setIsAdvancedOpen(false);
    setIsAddModelModalOpen(true);
  };

  // Save Model from Image 1 Modal
  const handleSaveModalModel = () => {
    const rawId = modalModelId.trim();
    if (!rawId) return;

    if (!editModels.some((m) => m.id === rawId)) {
      const parsedCtx = parseInt(modalContextWindow, 10) || 200000;
      const parsedMax = modalMaxOutputTokens ? parseInt(modalMaxOutputTokens, 10) : undefined;
      setEditModels([
        ...editModels,
        {
          id: rawId,
          name: rawId,
          contextWindow: parsedCtx,
          maxOutputTokens: parsedMax,
          supportsTools: true,
        },
      ]);
    }
    setIsAddModelModalOpen(false);
  };

  // Remove Model from List
  const handleRemoveModel = (modelId: string) => {
    setEditModels(editModels.filter((m) => m.id !== modelId));
  };

  // Clear all models except active
  const handleClearNonActiveModels = () => {
    setEditModels(editModels.filter((m) => m.id === activeModel || m.id === "Const"));
  };

  // Test / Ping a specific Model
  const handleTestSpecificModel = async (modelId: string) => {
    setTestingModelId(modelId);
    try {
      const res = await fetch("/api/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test_model",
          baseUrl: editBaseUrl,
          apiKey: editApiKey,
          apiFormat: editApiFormat,
          model: modelId,
        }),
      });

      const data = await res.json();
      setModelTestResults((prev) => ({
        ...prev,
        [modelId]: data,
      }));
    } catch (err: any) {
      setModelTestResults((prev) => ({
        ...prev,
        [modelId]: {
          success: false,
          error: err?.message || "Failed to connect to local probe route.",
        },
      }));
    } finally {
      setTestingModelId(null);
    }
  };

  // Fetch Models from Endpoint and open the selection modal
  const handleFetchModelsFromEndpoint = async () => {
    setIsFetchingModels(true);
    setFetchNotification({ type: "idle", message: "" });

    try {
      const res = await fetch("/api/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch_models",
          baseUrl: editBaseUrl,
          apiKey: editApiKey,
          apiFormat: editApiFormat,
        }),
      });

      const data = await res.json();

      if (data.success && data.models && data.models.length > 0) {
        setDiscoveredCandidates(data.models);
        // Pre-select models that are already in editModels
        const existing = new Set(editModels.map((m) => m.id));
        setSelectedCandidates(existing);
        setIsImportModalOpen(true);
      } else {
        setFetchNotification({
          type: data.success ? "info" : "error",
          message:
            data.error ||
            "Endpoint is online, but did not expose a /models catalog. You can add your model directly via '+ Add model'.",
        });
      }
    } catch (err: any) {
      setFetchNotification({
        type: "error",
        message: err?.message || "Failed to reach endpoint probe route.",
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Confirm import from the Discovered Models Modal
  const handleConfirmImport = () => {
    const byId = new Map(editModels.map((m) => [m.id, m]));
    for (const c of discoveredCandidates) {
      if (selectedCandidates.has(c.id)) {
        if (!byId.has(c.id)) {
          byId.set(c.id, {
            id: c.id,
            name: c.name || c.id,
            contextWindow: c.contextLength || 200000,
            supportsTools: true,
          });
        }
      }
    }
    setEditModels(Array.from(byId.values()));
    setIsImportModalOpen(false);
    setFetchNotification({
      type: "success",
      message: `Successfully imported ${selectedCandidates.size} selected model(s)!`,
    });
  };

  // Filtered models for the current view
  const filteredModels = useMemo(() => {
    const q = modelSearchQuery.toLowerCase().trim();
    if (!q) return editModels;
    return editModels.filter(
      (m) => m.id.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q))
    );
  }, [editModels, modelSearchQuery]);

  // Filtered candidates in the import modal
  const filteredCandidates = useMemo(() => {
    let list = discoveredCandidates;
    if (importCategoryFilter !== "all") {
      list = list.filter((c) => c.id.toLowerCase().includes(importCategoryFilter));
    }
    const q = importSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((c) => c.id.toLowerCase().includes(q) || (c.name && c.name.toLowerCase().includes(q)));
    }
    return list;
  }, [discoveredCandidates, importSearchQuery, importCategoryFilter]);

  // Save / Update Current Provider
  const handleSaveCurrentProvider = async () => {
    let updatedList: CustomProviderConfig[];

    if (isCreatingNewProvider) {
      const newId = editName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
      const newProv: CustomProviderConfig = {
        id: newId,
        name: editName,
        baseUrl: editBaseUrl,
        apiKey: editApiKey,
        apiFormat: editApiFormat,
        isActive: true,
        models: editModels.length > 0 ? editModels : [{ id: "Const", name: "Const", contextWindow: 200000 }],
      };
      updatedList = [...customProviders, newProv];
      setSelectedProviderId(newId);
      setIsCreatingNewProvider(false);
    } else {
      updatedList = customProviders.map((p) => {
        if (p.id === selectedProviderId) {
          return {
            ...p,
            name: editName,
            baseUrl: editBaseUrl,
            apiKey: editApiKey,
            apiFormat: editApiFormat,
            models: editModels,
          };
        }
        return p;
      });
    }

    setCustomProviders(updatedList);

    if (liveViewer?._id) {
      setIsSaving(true);
      try {
        await updateUserConfigMutation({
          userId: liveViewer._id,
          activeModel: editModels[0]?.id || activeModel,
          customBaseUrl: editBaseUrl,
          provider: "custom_openai",
          customProviders: updatedList as any,
          customApiKeys: {
            gemini: geminiKey,
            anthropic: claudeKey,
            openAi: editApiKey,
            openRouter: openRouterKey,
          },
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } catch (err) {
        console.error("Failed to save provider:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Delete Custom Provider
  const handleDeleteProvider = async (id: string) => {
    const updated = customProviders.filter((p) => p.id !== id);
    setCustomProviders(updated);
    if (updated.length > 0) {
      handleSelectProvider(updated[0].id);
    } else {
      handleSelectProvider("openrouter");
    }

    if (liveViewer?._id) {
      await updateUserConfigMutation({
        userId: liveViewer._id,
        customProviders: updated as any,
      });
    }
  };

  // Master Save All Settings
  const handleSaveAllSettings = async () => {
    if (!liveViewer?._id) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateUserConfigMutation({
        userId: liveViewer._id,
        activeModel,
        operatingMode,
        provider: "custom_openai",
        customBaseUrl: editBaseUrl,
        customProviders: customProviders as any,
        customApiKeys: {
          gemini: geminiKey,
          anthropic: claudeKey,
          openAi: editApiKey || openAiKey,
          openRouter: openRouterKey,
        },
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating settings in Convex:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Model settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Manage custom model providers. Once configured, they can be selected during chat.
          </p>
        </div>

        <Button
          onClick={handleSaveAllSettings}
          disabled={isSaving || !liveViewer?._id}
          className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-full px-5 text-xs sm:text-sm cursor-pointer flex items-center gap-2 shadow-lg transition-all"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{savedSuccess ? "Saved & Synced!" : "Save & Sync Settings"}</span>
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800/80">
        {[
          { key: "models_hub", label: "Model settings", icon: Server },
          { key: "persona", label: "Intelligence & Persona", icon: Cpu },
          { key: "voice", label: "Neural Voice (Supertonic-3)", icon: Mic },
          { key: "operating_mode", label: "Safety & Operating Modes", icon: ShieldAlert },
          { key: "devices", label: "Linked Devices", icon: Smartphone },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-zinc-800 text-white shadow-sm font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ================= TAB 1: MODEL SETTINGS ================= */}
      {activeTab === "models_hub" && (
        <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Left Sidebar: Providers & Custom Providers List */}
          <div className="w-full md:w-64 shrink-0 bg-[#121214] border border-zinc-800/80 rounded-2xl p-3.5 space-y-4">
            {/* Built-in Providers */}
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider px-2 pb-1">
                Providers
              </p>
              {DEFAULT_BUILTIN_PROVIDERS.map((p) => {
                const isSelected = !isCreatingNewProvider && selectedProviderId === p.id;
                const isConfigured =
                  (p.id === "gemini" && Boolean(geminiKey)) ||
                  (p.id === "anthropic" && Boolean(claudeKey)) ||
                  (p.id === "openrouter" && Boolean(openRouterKey)) ||
                  (p.id === "openai" && Boolean(openAiKey));

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800 text-white font-medium"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isConfigured ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-zinc-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Custom Providers */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/60">
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider px-2 pb-1">
                Custom providers
              </p>
              {customProviders.map((p) => {
                const isSelected = !isCreatingNewProvider && selectedProviderId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800 text-white font-medium"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Server className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] shrink-0" />
                  </button>
                );
              })}

              {/* Add Provider Button */}
              <button
                type="button"
                onClick={handleStartAddProvider}
                className={`w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-xl text-xs text-left transition-all cursor-pointer border border-dashed ${
                  isCreatingNewProvider
                    ? "bg-zinc-800 border-zinc-600 text-white font-medium"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400" />
                <span>Add provider</span>
              </button>
            </div>
          </div>

          {/* Right Editor Panel */}
          <div className="flex-1 w-full bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-base font-bold text-white">
                  {isCreatingNewProvider
                    ? "Add model provider"
                    : `Edit model provider: ${editName}`}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure custom API endpoints, keys, and active models.
                </p>
              </div>

              {/* Active Model Indicator */}
              <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 shadow-xs">
                <span>Active Model:</span>
                <span className="text-emerald-400 font-semibold">{activeModel}</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Field 1: Name */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">Name</Label>
                <Input
                  type="text"
                  placeholder="e.g. DeepSeek, OmniRoute, or Const"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 text-xs focus-visible:ring-1 focus-visible:ring-zinc-400"
                />
              </div>

              {/* Field 2: Base URL */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">Base URL</Label>
                <Input
                  type="text"
                  placeholder="https://api.example.com/v1"
                  value={editBaseUrl}
                  onChange={(e) => setEditBaseUrl(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs focus-visible:ring-1 focus-visible:ring-zinc-400"
                />
              </div>

              {/* Field 3: API Key */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">API key</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter API key"
                    value={editApiKey}
                    onChange={(e) => setEditApiKey(e.target.value)}
                    className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs pr-10 focus-visible:ring-1 focus-visible:ring-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Field 4: API Format */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">API format</Label>
                <select
                  value={editApiFormat}
                  onChange={(e) => setEditApiFormat(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer font-sans"
                >
                  <option value="openai_completions">OpenAI compatible (/v1/chat/completions)</option>
                  <option value="responses">Responses (/responses)</option>
                  <option value="anthropic_messages">Anthropic (/v1/messages)</option>
                  <option value="gemini_native">Google Gemini native (/models)</option>
                  <option value="ollama">Ollama (/api/chat)</option>
                </select>
              </div>

              {/* ================= REFINED COMPACT MODEL LIST SECTION ================= */}
              <div className="space-y-2.5 pt-2">
                {/* Header with Title, Count, Search & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-zinc-300 font-medium">Configured models</Label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                      {editModels.length} {editModels.length === 1 ? "model" : "models"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Fetch Models / Open Catalog Picker */}
                    <Button
                      type="button"
                      onClick={handleFetchModelsFromEndpoint}
                      disabled={isFetchingModels || !editBaseUrl}
                      variant="outline"
                      className="text-[11px] h-7 px-2.5 rounded-lg border-zinc-700 bg-zinc-800/80 text-indigo-300 hover:text-white hover:bg-zinc-700 cursor-pointer flex items-center gap-1.5"
                    >
                      {isFetchingModels ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3 text-indigo-400" />
                      )}
                      <span>{isFetchingModels ? "Scanning..." : "Fetch & Pick Models"}</span>
                    </Button>

                    {/* + Add Single Model (Image 1 Modal) */}
                    <Button
                      type="button"
                      onClick={handleOpenAddModelModal}
                      className="bg-white hover:bg-zinc-200 text-black text-[11px] font-medium h-7 px-3 rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add model</span>
                    </Button>
                  </div>
                </div>

                {/* Search / Filter Bar & Quick Actions when models > 3 */}
                {editModels.length > 3 && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="Search configured models..."
                        value={modelSearchQuery}
                        onChange={(e) => setModelSearchQuery(e.target.value)}
                        className="bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-600 text-[11px] pl-8 h-7.5 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-500"
                      />
                      {modelSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setModelSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {editModels.length > 5 && (
                      <Button
                        type="button"
                        onClick={handleClearNonActiveModels}
                        variant="ghost"
                        className="text-[10px] text-zinc-500 hover:text-red-400 h-7.5 px-2 cursor-pointer"
                        title="Remove all models except active and Const"
                      >
                        Keep Active Only
                      </Button>
                    )}
                  </div>
                )}

                {/* Fetch Status Notification */}
                {fetchNotification.type !== "idle" && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
                      fetchNotification.type === "success"
                        ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
                        : fetchNotification.type === "error"
                        ? "bg-red-950/40 border border-red-800/40 text-red-300"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {fetchNotification.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : fetchNotification.type === "error" ? (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                      )}
                      <span className="truncate">{fetchNotification.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFetchNotification({ type: "idle", message: "" })}
                      className="text-zinc-500 hover:text-white shrink-0 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Bounded Scrollable Container for Configured Models (Clean & Compact) */}
                <div className="max-h-[320px] overflow-y-auto pr-1 space-y-1.5 rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                  {filteredModels.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      {modelSearchQuery ? `No models matching "${modelSearchQuery}"` : "No models configured yet. Click 'Add model' or 'Fetch & Pick Models'."}
                    </div>
                  ) : (
                    filteredModels.map((m) => {
                      const isSystemActive = activeModel === m.id;
                      const testResult = modelTestResults[m.id];
                      const isTesting = testingModelId === m.id;

                      return (
                        <div key={m.id} className="space-y-1">
                          <div
                            className={`flex items-center justify-between p-2 rounded-lg transition-all border ${
                              isSystemActive
                                ? "bg-zinc-900/90 border-emerald-500/30 shadow-xs"
                                : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Active Selector */}
                              <button
                                type="button"
                                onClick={() => setActiveModel(m.id)}
                                title="Set as active system model"
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                  isSystemActive
                                    ? "border-emerald-400 bg-emerald-400 text-black shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                                    : "border-zinc-600 hover:border-zinc-400"
                                }`}
                              >
                                {isSystemActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </button>

                              {/* Model Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-white truncate">
                                    {m.name || m.id}
                                  </span>
                                  {isSystemActive && (
                                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-1.5 py-0.2 rounded-full shrink-0">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-500 font-mono truncate">
                                  {m.id} • {m.contextWindow ? `${Math.round(m.contextWindow / 1000)}k ctx` : "200k ctx"}
                                </p>
                              </div>
                            </div>

                            {/* Actions: Test Model & Remove */}
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <Button
                                type="button"
                                onClick={() => handleTestSpecificModel(m.id)}
                                disabled={isTesting}
                                variant="outline"
                                className="text-[10px] h-6 px-2 py-0.5 rounded-md border-zinc-700/80 bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer flex items-center gap-1"
                              >
                                {isTesting ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-zinc-400" />
                                ) : (
                                  <Play className="w-2 h-2 text-emerald-400 fill-emerald-400" />
                                )}
                                <span>{isTesting ? "Testing..." : "Test"}</span>
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleRemoveModel(m.id)}
                                className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 cursor-pointer"
                                title="Remove model from list"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Test Result Box */}
                          {testResult && (
                            <div
                              className={`p-1.5 px-2.5 rounded-lg text-[10px] flex items-center justify-between font-mono animate-in fade-in duration-100 ${
                                testResult.success
                                  ? "bg-emerald-950/40 border border-emerald-800/40 text-emerald-300"
                                  : "bg-red-950/40 border border-red-800/40 text-red-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {testResult.success ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                                )}
                                <span className="truncate">
                                  {testResult.success
                                    ? `Online (${testResult.latencyMs}ms) → "${testResult.reply}"`
                                    : `Failed (${testResult.latencyMs}ms) → ${testResult.error}`}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setModelTestResults((prev) => {
                                    const copy = { ...prev };
                                    delete copy[m.id];
                                    return copy;
                                  })
                                }
                                className="text-zinc-500 hover:text-white ml-2"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <Button
                type="button"
                onClick={handleSaveCurrentProvider}
                disabled={isSaving}
                className="bg-zinc-200 hover:bg-white text-black font-semibold text-xs rounded-xl px-5 py-2 cursor-pointer flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isCreatingNewProvider ? "Add provider" : "Save provider"}</span>
              </Button>

              {!isCreatingNewProvider && selectedProviderId !== "openrouter" && selectedProviderId !== "gemini" && selectedProviderId !== "anthropic" && selectedProviderId !== "openai" && (
                <Button
                  type="button"
                  onClick={() => handleDeleteProvider(selectedProviderId)}
                  className="bg-red-950/60 hover:bg-red-900 text-red-400 text-xs rounded-xl px-3 py-2 cursor-pointer flex items-center gap-1.5 border border-red-800/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete provider</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: ADD MODEL MODAL (EXACT IMAGE 1 MATCH) ================= */}
      {isAddModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#161619] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Add model</h3>
              <button
                type="button"
                onClick={() => setIsAddModelModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-3.5">
              {/* Field 1: Model ID */}
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400 font-normal">Model ID</Label>
                <Input
                  type="text"
                  placeholder="Model ID"
                  value={modalModelId}
                  onChange={(e) => setModalModelId(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs focus-visible:ring-1 focus-visible:ring-zinc-400"
                  autoFocus
                />
              </div>

              {/* Field 2: Context window */}
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400 font-normal">Context window</Label>
                <Input
                  type="number"
                  placeholder="200000"
                  value={modalContextWindow}
                  onChange={(e) => setModalContextWindow(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white font-mono text-xs focus-visible:ring-1 focus-visible:ring-zinc-400"
                />
              </div>

              {/* Advanced Collapsible */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer font-medium"
                >
                  {isAdvancedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Advanced</span>
                </button>

                {isAdvancedOpen && (
                  <div className="space-y-1 pl-1 pt-1 animate-in fade-in duration-100">
                    <Label className="text-xs text-zinc-400 font-normal">Max output tokens</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 4096 or 8192"
                      value={modalMaxOutputTokens}
                      onChange={(e) => setModalMaxOutputTokens(e.target.value)}
                      className="bg-zinc-900/90 border-zinc-800 text-white font-mono text-xs focus-visible:ring-1 focus-visible:ring-zinc-400"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddModelModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-1.5 h-auto rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveModalModel}
                disabled={!modalModelId.trim()}
                className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-4 py-1.5 h-auto rounded-xl shadow-sm"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: SEARCHABLE DISCOVERED MODELS IMPORT PICKER ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#161619] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Import models from endpoint</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Discovered {discoveredCandidates.length} models from {editName}. Select the ones you want to add.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Quick Category Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder={`Search ${discoveredCandidates.length} models...`}
                  value={importSearchQuery}
                  onChange={(e) => setImportSearchQuery(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 text-xs pl-9 focus-visible:ring-1 focus-visible:ring-zinc-400"
                  autoFocus
                />
                {importSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setImportSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills & Select All / None */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "All" },
                    { id: "const", label: "Const" },
                    { id: "coding", label: "Coding" },
                    { id: "reasoning", label: "Reasoning" },
                    { id: "deepseek", label: "DeepSeek" },
                    { id: "claude", label: "Claude" },
                    { id: "gpt", label: "GPT" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setImportCategoryFilter(cat.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                        importCategoryFilter === cat.id
                          ? "bg-white text-black font-semibold"
                          : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = new Set(filteredCandidates.map((c) => c.id));
                      setSelectedCandidates(new Set([...selectedCandidates, ...allIds]));
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Select visible ({filteredCandidates.length})
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCandidates(new Set())}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium cursor-pointer"
                  >
                    Deselect all
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Model Grid / Checklist */}
            <div className="flex-1 overflow-y-auto border border-zinc-800 rounded-xl p-2 bg-zinc-950/60 space-y-1 min-h-[220px] max-h-[360px] scrollbar-thin scrollbar-thumb-zinc-800">
              {filteredCandidates.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  No models matched your search filter.
                </div>
              ) : (
                filteredCandidates.map((c) => {
                  const isChecked = selectedCandidates.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedCandidates);
                        if (next.has(c.id)) next.delete(c.id);
                        else next.add(c.id);
                        setSelectedCandidates(next);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer border ${
                        isChecked
                          ? "bg-zinc-900 border-indigo-500/40 text-white"
                          : "bg-zinc-900/30 border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? "border-indigo-400 bg-indigo-500 text-white"
                              : "border-zinc-700 bg-zinc-900"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{c.name || c.id}</p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">{c.id}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-zinc-800/80 shrink-0 ml-2">
                        {c.contextLength ? `${Math.round(c.contextLength / 1000)}k ctx` : "200k ctx"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400 font-mono">
                {selectedCandidates.size} model(s) selected
              </span>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-1.5 h-auto rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={selectedCandidates.size === 0}
                  className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-4 py-1.5 h-auto rounded-xl shadow-sm cursor-pointer"
                >
                  Import Selected ({selectedCandidates.size})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: INTELLIGENCE & PERSONA ================= */}
      {activeTab === "persona" && (
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Reasoning Parameters & System Persona
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Customize how your agent reasons and speaks on Android and Desktop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">
                Creativity & Temperature ({temperature[0]})
              </Label>
              <Slider
                value={temperature}
                min={0}
                max={1}
                step={0.05}
                onValueChange={setTemperature}
                className="py-2"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">System Persona Instructions</Label>
              <textarea
                rows={5}
                value={systemPersona}
                onChange={(e) => setSystemPersona(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 3: NEURAL VOICE ================= */}
      {activeTab === "voice" && (
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              On-Device Neural Voice (Supertonic-3 Engine)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Runs locally on your phone hardware (~99M ONNX weights) with zero API cost and zero network lag.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: "M1", name: "M1 (Default Male)", desc: "Clear & authoritative" },
                { id: "M2", name: "M2 (Apex)", desc: "Fast & technical" },
                { id: "F1", name: "F1 (Default Female)", desc: "Natural & warm" },
                { id: "F2", name: "F2 (Aria)", desc: "Conversational" },
                { id: "F3", name: "F3 (Nova)", desc: "Calm & balanced" },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoice(v.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoice === v.id
                      ? "bg-zinc-800 border-white text-white shadow-sm"
                      : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">{v.name}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">{v.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Speaking Rate Speed</span>
                <span className="font-mono text-emerald-400">{speakingRate[0]}x</span>
              </div>
              <Slider
                value={speakingRate}
                min={0.75}
                max={1.5}
                step={0.05}
                onValueChange={setSpeakingRate}
                className="py-2"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div>
                <p className="text-xs font-medium text-white">Emotion Tags Synthesis</p>
                <p className="text-[11px] text-zinc-400">
                  Allows the voice engine to dynamically express joy, urgency, or calm.
                </p>
              </div>
              <Switch checked={enableEmotionTags} onCheckedChange={setEnableEmotionTags} />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div>
                <p className="text-xs font-medium text-white">Auto-Play Voice on Mobile Response</p>
                <p className="text-[11px] text-zinc-400">
                  Immediately stream speech on your phone as soon as first tokens arrive.
                </p>
              </div>
              <Switch checked={autoPlayVoice} onCheckedChange={setAutoPlayVoice} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 4: OPERATING MODE ================= */}
      {activeTab === "operating_mode" && (
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Autonomous Safety Policies & Execution Mode
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Control the permission boundary for modifying contacts, storage, and automated UI actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: "plan_mode",
                name: "1. Plan Mode Only",
                desc: "Agent only creates an implementation plan without modifying any phone setting or code.",
                badge: "Read Only",
              },
              {
                id: "ask_before_change",
                name: "2. Ask Before Change (HITL - Recommended)",
                desc: "Prompts you with a Human-In-The-Loop dialog before deleting contacts, clearing junk, or running commands.",
                badge: "Balanced",
              },
              {
                id: "edit_automatically",
                name: "3. Autonomous Execution",
                desc: "Performs safe routine operations automatically, but asks for destructive changes.",
                badge: "Semi-Auto",
              },
              {
                id: "full_access_yolo",
                name: "4. Full Access (YOLO Mode)",
                desc: "Executes all commands, Shizuku scripts, and UI spatial automation continuously without confirmation.",
                badge: "Unrestricted",
              },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setOperatingMode(mode.id as any)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  operatingMode === mode.id
                    ? "bg-zinc-800 border-white text-white shadow-sm"
                    : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{mode.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">{mode.desc}</p>
                </div>
                {operatingMode === mode.id && (
                  <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0 ml-3">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 5: LINKED DEVICES ================= */}
      {activeTab === "devices" && (
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Connected Physical Devices
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Hardware companion instances registered under this account via Convex sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-700/50 text-indigo-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Android Device Companion
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.2 rounded-full font-mono">
                      ● Online
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Shizuku API: <span className="text-emerald-400">Ready</span> | Accessibility: <span className="text-emerald-400">Active</span>
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-full cursor-pointer"
              >
                Ping Phone
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
