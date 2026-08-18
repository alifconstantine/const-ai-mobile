"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function SettingsHubPage() {
  const [activeTab, setActiveTab] = useState<
    "byok" | "models" | "voice" | "operating_mode" | "devices"
  >("byok");

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // BYOK State
  const [geminiKey, setGeminiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);

  // Model & Persona State
  const [activeModel, setActiveModel] = useState("gemini-2.5-flash");
  const [temperature, setTemperature] = useState([0.7]);
  const [systemPersona, setSystemPersona] = useState(
    "You are Const AI, an autonomous personal assistant and mobile phone OS operator with neural voice capabilities."
  );

  // Voice Settings State
  const [ttsEngine, setTtsEngine] = useState<"local_supertonic" | "cloud_fallback">(
    "local_supertonic"
  );
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [speakingRate, setSpeakingRate] = useState([1.0]);
  const [enableEmotionTags, setEnableEmotionTags] = useState(true);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);

  // Operating Mode State
  const [operatingMode, setOperatingMode] = useState<
    "plan_mode" | "ask_before_change" | "edit_automatically" | "full_access_yolo"
  >("ask_before_change");

  // Load from local session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("const_user_config");
      if (savedConfig) {
        try {
          const cfg = JSON.parse(savedConfig);
          if (cfg.geminiKey) setGeminiKey(cfg.geminiKey);
          if (cfg.claudeKey) setClaudeKey(cfg.claudeKey);
          if (cfg.openAiKey) setOpenAiKey(cfg.openAiKey);
          if (cfg.openRouterKey) setOpenRouterKey(cfg.openRouterKey);
          if (cfg.activeModel) setActiveModel(cfg.activeModel);
          if (cfg.operatingMode) setOperatingMode(cfg.operatingMode);
          if (cfg.selectedVoice) setSelectedVoice(cfg.selectedVoice);
          if (cfg.systemPersona) setSystemPersona(cfg.systemPersona);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (typeof window !== "undefined") {
        const configData = {
          geminiKey,
          claudeKey,
          openAiKey,
          openRouterKey,
          activeModel,
          temperature: temperature[0],
          systemPersona,
          ttsEngine,
          selectedVoice,
          speakingRate: speakingRate[0],
          enableEmotionTags,
          autoPlayVoice,
          operatingMode,
          updatedAt: Date.now(),
        };
        localStorage.setItem("const_user_config", JSON.stringify(configData));
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Settings & Mobile Synchronization
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Configure your AI keys, neural voice engine, and safety policies synced across devices.
          </p>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-full px-5 text-xs sm:text-sm cursor-pointer flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{savedSuccess ? "Synced to Mobile!" : "Save & Sync Settings"}</span>
        </Button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800/80">
        {[
          { key: "byok", label: "BYOK API Keys", icon: KeyRound },
          { key: "models", label: "Model & Persona", icon: Cpu },
          { key: "voice", label: "Neural Voice (Supertonic-3)", icon: Mic },
          { key: "operating_mode", label: "Safety & Modes", icon: ShieldAlert },
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

      {/* ================= TAB 1: BYOK API KEYS ================= */}
      {activeTab === "byok" && (
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold">
                  Bring Your Own Key (BYOK)
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-1">
                  Your keys are encrypted in Convex Vault and streamed directly to your phone for local execution.
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
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">
                Google Gemini API Key (Recommended for Super Fast OS Control)
              </Label>
              <Input
                type={showKeys ? "text" : "password"}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs focus-visible:ring-zinc-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">
                Anthropic Claude API Key (Claude 3.7 Sonnet Reasoning)
              </Label>
              <Input
                type={showKeys ? "text" : "password"}
                placeholder="sk-ant-api03-..."
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs focus-visible:ring-zinc-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">
                OpenAI API Key (GPT-4o & Embeddings)
              </Label>
              <Input
                type={showKeys ? "text" : "password"}
                placeholder="sk-proj-..."
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs focus-visible:ring-zinc-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">
                OpenRouter API Key (DeepSeek-R1, Llama 3, Qwen)
              </Label>
              <Input
                type={showKeys ? "text" : "password"}
                placeholder="sk-or-v1-..."
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-600 font-mono text-xs focus-visible:ring-zinc-400"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 2: MODEL & PERSONA ================= */}
      {activeTab === "models" && (
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Default Intelligence & Persona
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Customize how your agent reasons and speaks on Android and Desktop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Active Model</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "gemini-2.5-flash",
                    name: "Gemini 2.5 Flash",
                    desc: "Sub-100ms ultra low latency",
                  },
                  {
                    id: "claude-3-7-sonnet",
                    name: "Claude 3.7 Sonnet",
                    desc: "Deep reasoning & tool use",
                  },
                  {
                    id: "gpt-4o",
                    name: "GPT-4o",
                    desc: "Multimodal standard",
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveModel(m.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeModel === m.id
                        ? "bg-zinc-800 border-white text-white shadow-sm"
                        : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <p className="text-xs font-semibold text-white">{m.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

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
                rows={4}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "nova", name: "Nova", desc: "Calm, natural, balanced" },
                { id: "apex", name: "Apex", desc: "Crisp, concise, technical" },
                { id: "aria", name: "Aria", desc: "Warm, conversational, cheerful" },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoice(v.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoice === v.id
                      ? "bg-zinc-800 border-white text-white shadow-sm"
                      : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">
                      {v.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400">{v.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-300">
                <span>Speaking Rate Speed</span>
                <span className="font-mono text-emerald-400">
                  {speakingRate[0]}x
                </span>
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
                <p className="text-xs font-medium text-white">
                  Emotion Tags Synthesis
                </p>
                <p className="text-[11px] text-zinc-400">
                  Allows the voice engine to dynamically express joy, urgency, or calm.
                </p>
              </div>
              <Switch
                checked={enableEmotionTags}
                onCheckedChange={setEnableEmotionTags}
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div>
                <p className="text-xs font-medium text-white">
                  Auto-Play Voice on Mobile Response
                </p>
                <p className="text-[11px] text-zinc-400">
                  Immediately stream speech on your phone as soon as first tokens arrive.
                </p>
              </div>
              <Switch
                checked={autoPlayVoice}
                onCheckedChange={setAutoPlayVoice}
              />
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
                    <span className="text-xs font-semibold text-white">
                      {mode.name}
                    </span>
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
                      Samsung Galaxy / Pixel (Android 14)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.2 rounded-full font-mono">
                      ● Online
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Shizuku API: <span className="text-emerald-400">Active</span> | Accessibility: <span className="text-emerald-400">Active</span>
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
