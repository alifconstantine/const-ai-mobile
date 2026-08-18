"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
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
  KeyRound,
  Mic,
  Cpu,
  ShieldAlert,
  Smartphone,
  Check,
  Save,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Server,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Globe,
} from "lucide-react";

interface DiscoveredModelItem {
  id: string;
  name: string;
  provider: string;
  contextLength?: number;
  supportsTools: boolean;
}

export default function SettingsHubPage() {
  const [activeTab, setActiveTab] = useState<
    "byok" | "models" | "voice" | "operating_mode" | "devices"
  >("byok");

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Convex Queries & Mutations
  const liveViewer = useQuery(api.users.viewer);
  const updateUserConfigMutation = useMutation(api.users.updateUserConfig);
  const detectModelsAction = useAction(api.agent.detectAvailableModels);

  // Provider & Base URL State
  const [provider, setProvider] = useState<
    "custom_openai" | "openrouter" | "gemini" | "anthropic" | "openai"
  >("custom_openai");
  const [customBaseUrl, setCustomBaseUrl] = useState("");

  // API Keys State
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);

  // Dynamic Model Fetching State
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
    count?: number;
  }>({ type: "idle", message: "" });
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModelItem[]>([]);
  const [modelSearchQuery, setModelSearchQuery] = useState("");

  // Active Model & Persona State
  const [activeModel, setActiveModel] = useState("Const");
  const [temperature, setTemperature] = useState([0.7]);
  const [systemPersona, setSystemPersona] = useState(
    "You are Const AI, an autonomous personal assistant and mobile phone OS operator with neural voice capabilities."
  );

  // Voice Settings State
  const [ttsEngine, setTtsEngine] = useState<"local_supertonic" | "cloud_fallback">(
    "local_supertonic"
  );
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
      if (cfg.provider) setProvider(cfg.provider as any);
      if (cfg.customBaseUrl) setCustomBaseUrl(cfg.customBaseUrl);
      if (cfg.activeModel) setActiveModel(cfg.activeModel);
      if (cfg.operatingMode) setOperatingMode(cfg.operatingMode);
      if (cfg.temperature !== undefined) setTemperature([cfg.temperature]);
      if (cfg.systemPersona) setSystemPersona(cfg.systemPersona);

      if (cfg.customApiKeys) {
        if (cfg.customApiKeys.gemini) setGeminiKey(cfg.customApiKeys.gemini);
        if (cfg.customApiKeys.anthropic) setClaudeKey(cfg.customApiKeys.anthropic);
        if (cfg.customApiKeys.openAi) {
          setOpenAiKey(cfg.customApiKeys.openAi);
          setCustomApiKey(cfg.customApiKeys.openAi);
        }
        if (cfg.customApiKeys.openRouter) setOpenRouterKey(cfg.customApiKeys.openRouter);
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

  // Test Connection & Fetch Models from Provider
  const handleTestAndFetchModels = async () => {
    setIsFetchingModels(true);
    setFetchStatus({ type: "idle", message: "" });

    try {
      const currentApiKey =
        provider === "custom_openai"
          ? customApiKey || openAiKey || openRouterKey
          : provider === "gemini"
          ? geminiKey
          : provider === "anthropic"
          ? claudeKey
          : provider === "openrouter"
          ? openRouterKey
          : openAiKey;

      const models = await detectModelsAction({
        provider,
        apiKey: currentApiKey,
        customBaseUrl: provider === "custom_openai" ? customBaseUrl : undefined,
      });

      if (models && models.length > 0) {
        setDiscoveredModels(models);
        setFetchStatus({
          type: "success",
          message: `Connected successfully! Found ${models.length} available models.`,
          count: models.length,
        });

        // If current activeModel is not in list, pick the first one or keep Const
        if (!models.some((m) => m.id === activeModel) && models.length > 0 && activeModel === "Const") {
          setActiveModel(models[0].id);
        }
      } else {
        setFetchStatus({
          type: "error",
          message: "No models returned from endpoint. Please check Base URL and API Key.",
        });
      }
    } catch (err: any) {
      setFetchStatus({
        type: "error",
        message: err?.message || "Failed to reach endpoint. Verify your URL and network connectivity.",
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Save Settings to Convex DB
  const handleSaveSettings = async () => {
    if (!liveViewer?._id) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateUserConfigMutation({
        userId: liveViewer._id,
        activeModel,
        operatingMode,
        provider,
        customBaseUrl,
        customApiKeys: {
          gemini: geminiKey,
          anthropic: claudeKey,
          openAi: provider === "custom_openai" ? customApiKey || openAiKey : openAiKey,
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

  const filteredDiscoveredModels = discoveredModels.filter((m) =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    m.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Settings & Intelligence Configuration
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Configure Base URL, API Keys, Model Discovery, and Mobile Device Synchronization.
          </p>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving || !liveViewer?._id}
          className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-full px-5 text-xs sm:text-sm cursor-pointer flex items-center gap-2 shadow-lg"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{savedSuccess ? "Synced to Convex & Mobile!" : "Save & Sync Settings"}</span>
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800/80">
        {[
          { key: "byok", label: "Base URL & Model Config", icon: Server },
          { key: "models", label: "Intelligence & Persona", icon: Cpu },
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

      {/* ================= TAB 1: BASE URL & MODEL CONFIGURATION ================= */}
      {activeTab === "byok" && (
        <div className="space-y-5">
          {/* Card 1: Provider & Endpoint Setup */}
          <Card className="bg-[#121214] border-zinc-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <span>LLM Provider & Endpoint Setup</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-1">
                    Connect your self-hosted LLM (vLLM, LiteLLM, Ollama), OpenRouter, or Official APIs.
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showKeys ? "Hide Keys" : "Reveal Keys"}</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Provider Selector Cards */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">Inference Provider</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "custom_openai", label: "Custom / Self-Hosted", desc: "vLLM / LiteLLM / Ollama" },
                    { id: "openrouter", label: "OpenRouter", desc: "200+ aggregated models" },
                    { id: "gemini", label: "Google Gemini", desc: "Fast OS control" },
                    { id: "anthropic", label: "Anthropic Claude", desc: "Claude 3.7 Sonnet" },
                    { id: "openai", label: "OpenAI", desc: "GPT-4o & o3-mini" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        provider === p.id
                          ? "bg-zinc-800 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400/40"
                          : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <p className="text-xs font-semibold text-white">{p.label}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Base URL (Crucial for Custom / Self-Hosted) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-zinc-300 font-medium">
                    Base URL {provider === "custom_openai" && <span className="text-indigo-400">*</span>}
                  </Label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Auto-normalizes to /v1/chat/completions & /models
                  </span>
                </div>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder={
                      provider === "custom_openai"
                        ? "https://your-llm-server.com/v1 or http://localhost:11434/v1"
                        : "https://openrouter.ai/api/v1 (Optional override)"
                    }
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs pl-9 focus-visible:ring-indigo-400"
                  />
                </div>
              </div>

              {/* API Key Input based on provider */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">
                  {provider === "custom_openai"
                    ? "API Key (Optional for local servers like Ollama / LM Studio)"
                    : `${provider.toUpperCase()} API Key`}
                </Label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showKeys ? "text" : "password"}
                    placeholder={
                      provider === "custom_openai"
                        ? "Bearer key (or leave empty if local)"
                        : provider === "gemini"
                        ? "AIzaSy..."
                        : provider === "anthropic"
                        ? "sk-ant-api03-..."
                        : provider === "openrouter"
                        ? "sk-or-v1-..."
                        : "sk-proj-..."
                    }
                    value={
                      provider === "custom_openai"
                        ? customApiKey
                        : provider === "gemini"
                        ? geminiKey
                        : provider === "anthropic"
                        ? claudeKey
                        : provider === "openrouter"
                        ? openRouterKey
                        : openAiKey
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (provider === "custom_openai") setCustomApiKey(val);
                      else if (provider === "gemini") setGeminiKey(val);
                      else if (provider === "anthropic") setClaudeKey(val);
                      else if (provider === "openrouter") setOpenRouterKey(val);
                      else setOpenAiKey(val);
                    }}
                    className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs pl-9 focus-visible:ring-indigo-400"
                  />
                </div>
              </div>

              {/* Action Button: Test & Fetch Models */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button
                  type="button"
                  onClick={handleTestAndFetchModels}
                  disabled={isFetchingModels}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl px-4 py-2 cursor-pointer flex items-center gap-2 transition-all shadow-md hover:shadow-indigo-500/20"
                >
                  {isFetchingModels ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  )}
                  <span>{isFetchingModels ? "Querying /models..." : "⚡ Test Connection & Fetch Models"}</span>
                </Button>

                {fetchStatus.type === "success" && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{fetchStatus.message}</span>
                  </div>
                )}

                {fetchStatus.type === "error" && (
                  <div className="flex items-center gap-2 text-red-400 text-xs font-medium bg-red-950/50 border border-red-800/40 px-3 py-1.5 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fetchStatus.message}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Model Picker & Selection */}
          <Card className="bg-[#121214] border-zinc-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Active Model Selection</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-1">
                    Select the model that will power your Mobile Agent reasoning and Device Tools.
                  </CardDescription>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-zinc-300">
                  Current: <span className="text-emerald-400 font-semibold">{activeModel}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* If models discovered, show searchable list */}
              {discoveredModels.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      type="text"
                      placeholder="Search fetched models (e.g. qwen, deepseek, sonnet)..."
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 text-xs focus-visible:ring-emerald-400"
                    />
                    <span className="text-[11px] text-zinc-500 whitespace-nowrap font-mono">
                      {filteredDiscoveredModels.length} models
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {filteredDiscoveredModels.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveModel(m.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          activeModel === m.id
                            ? "bg-zinc-800 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400/40"
                            : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-white truncate">{m.name || m.id}</p>
                          <p className="text-[10px] text-zinc-500 font-mono truncate">{m.id}</p>
                        </div>
                        {activeModel === m.id && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Fallback Manual Model Input & Presets */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Model Identifier / Tag</Label>
                    <Input
                      type="text"
                      placeholder="e.g. google/gemini-2.0-flash-001 or deepseek/deepseek-chat or custom-model"
                      value={activeModel}
                      onChange={(e) => setActiveModel(e.target.value)}
                      className="bg-zinc-900/90 border-zinc-800 text-white font-mono text-xs focus-visible:ring-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", desc: "Ultra fast" },
                      { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet", desc: "Coding master" },
                      { id: "deepseek/deepseek-chat", label: "DeepSeek V3", desc: "High efficiency" },
                      { id: "Const", label: "Const (Self-Hosted)", desc: "Custom LLM" },
                    ].map((pre) => (
                      <button
                        key={pre.id}
                        type="button"
                        onClick={() => setActiveModel(pre.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          activeModel === pre.id
                            ? "bg-zinc-800 border-white text-white font-medium"
                            : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <p className="text-xs text-white truncate">{pre.label}</p>
                        <p className="text-[10px] text-zinc-500">{pre.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 2: INTELLIGENCE & PERSONA ================= */}
      {activeTab === "models" && (
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
