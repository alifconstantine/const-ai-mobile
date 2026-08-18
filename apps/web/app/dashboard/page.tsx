"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Smartphone,
  KeyRound,
  Mic,
  ShieldCheck,
  Zap,
  Cpu,
  ArrowRight,
  Server,
  Radio,
  Sliders,
  Settings,
  Sparkles,
} from "lucide-react";

import { useQuery } from "convex/react";
import { api } from "@const-ai/backend";
import { useUser } from "@clerk/nextjs";

export default function DashboardOverviewPage() {
  const { user: clerkUser } = useUser();
  const liveViewer = useQuery(api.users.viewer);

  const userName =
    liveViewer?.name ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    "Operator";

  const activeModel = liveViewer?.config?.activeModel || "Const";
  const customBaseUrl = liveViewer?.config?.customBaseUrl || "http://localhost:20128/v1";
  const voicePersona = liveViewer?.config?.voiceSettings?.selectedVoiceStyle || "M1";
  const speakingRate = liveViewer?.config?.voiceSettings?.speakingRate || 1.0;

  const operatingMode = liveViewer?.config?.operatingMode || "ask_before_change";
  const operatingModeLabels: Record<string, { title: string; badge: string }> = {
    plan_mode: { title: "Plan Mode Only", badge: "Read Only" },
    ask_before_change: { title: "Ask Before Change", badge: "HITL (Protected)" },
    edit_automatically: { title: "Autonomous Execution", badge: "Semi-Auto" },
    full_access_yolo: { title: "Full Access Mode", badge: "YOLO (Unrestricted)" },
  };

  const currentMode = operatingModeLabels[operatingMode] || operatingModeLabels.ask_before_change;

  return (
    <div className="space-y-6 select-none max-w-6xl">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-zinc-900 via-[#151518] to-zinc-900 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-mono mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Convex Realtime Sync Connected</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome, {userName}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Central dashboard for managing your AI models, voice profiles, and autonomous execution policies.
          </p>
        </div>

        <Link href="/dashboard/settings">
          <Button className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-full px-5 text-xs sm:text-sm cursor-pointer flex items-center gap-1.5 shadow-md">
            <span>Model Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Metrics & Quick Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Model */}
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-medium">Active Intelligence</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <CardTitle className="text-lg font-bold mt-1 text-white truncate">
              {activeModel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-zinc-500 font-mono truncate">
              Endpoint: {customBaseUrl.replace(/^https?:\/\//, "")}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Voice Persona */}
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-medium">Neural Voice Profile</span>
              <Mic className="w-4 h-4 text-emerald-400" />
            </div>
            <CardTitle className="text-lg font-bold mt-1 text-white">
              Voice {voicePersona}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-zinc-500 font-mono">
              Speed: {speakingRate}x • Supertonic-3 ONNX
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Safety & Operating Mode */}
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-medium">Safety Policy</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <CardTitle className="text-lg font-bold mt-1 text-white truncate">
              {currentMode.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-emerald-400 font-mono">
              ● {currentMode.badge}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Companion Cloud Sync */}
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-medium">Sync Engine</span>
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <CardTitle className="text-lg font-bold mt-1 text-white">
              Reactive Convex
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-zinc-500 font-mono">
              Instant Mobile & Web State
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Configuration Summary */}
        <Card className="lg:col-span-2 bg-[#121214] border-zinc-800 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  System Architecture & Integration
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-0.5">
                  Overview of active model routing and client configuration
                </CardDescription>
              </div>
              <Link
                href="/dashboard/settings"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>Edit Settings</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
                  <Server className="w-4 h-4 text-indigo-400" />
                  Custom Provider
                </div>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  {customBaseUrl}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Active Model
                </div>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  {activeModel}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
                  <Mic className="w-4 h-4 text-amber-400" />
                  Voice Engine
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Supertonic-3 ({voicePersona})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white">
                  Need to change your LLM endpoint or add more models?
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Configure custom model providers, test connection latency, or pick discovered models in settings.
                </p>
              </div>
              <Link href="/dashboard/settings" className="shrink-0">
                <Button
                  variant="outline"
                  className="border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-full cursor-pointer"
                >
                  Configure Providers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Right: Quick Settings Hub link */}
        <Card className="bg-[#121214] border-zinc-800 text-white flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Quick Navigation
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Jump directly to specific configuration sections
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5">
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-zinc-200">
                  Model & Providers Hub
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-zinc-200">
                  Voice Synthesis (Supertonic-3)
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-zinc-200">
                  Safety & Operating Policies
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
          </CardContent>

          <div className="p-4 border-t border-zinc-800/80 text-center">
            <Link
              href="/dashboard/settings"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Open Full Settings →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
