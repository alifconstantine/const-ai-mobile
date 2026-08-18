"use client";

import React, { useState, useEffect } from "react";
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
  Terminal,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  ArrowRight,
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
    "Alif Constantine";

  const activeModel = liveViewer?.config?.activeModel || "Const (Custom LLM)";
  const voicePersona = liveViewer?.config?.voiceSettings?.selectedVoiceStyle || "M1 (Supertonic-3)";

  return (
    <div className="space-y-6 select-none">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-zinc-900 via-[#151518] to-zinc-900 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-mono mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Convex Realtime Sync Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back, {userName}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Your Const AI mobile device companion and autonomous agent are connected and synced.
          </p>
        </div>

        <Link href="/dashboard/settings">
          <Button className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-full px-5 text-xs sm:text-sm cursor-pointer flex items-center gap-1.5">
            <span>Manage Settings</span>
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
            <CardTitle className="text-lg font-bold mt-1 text-white">
              {activeModel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-zinc-500 font-mono">
              Inference: BYOK Custom Key
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Voice Persona */}
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-medium">Neural Voice Engine</span>
              <Mic className="w-4 h-4 text-emerald-400" />
            </div>
            <CardTitle className="text-lg font-bold mt-1 text-white">
              {voicePersona.split(" ")[0]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-zinc-500 font-mono">
              Supertonic-3 (Local ONNX)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Mobile Device Status */}
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-medium">Phone OS Status</span>
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <CardTitle className="text-lg font-bold mt-1 text-white">
              Android 14 / Shizuku
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-emerald-400 font-mono">
              ● Bridge Connected (&lt; 50ms)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Operating Mode */}
        <Card className="bg-[#121214] border-zinc-800 text-white">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-xs font-medium">Agent Operating Mode</span>
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <CardTitle className="text-lg font-bold mt-1 text-white">
              Plan Mode (HITL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-zinc-500 font-mono">
              Ask Before System Change
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section: Live Sync Widget & Quick Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Mobile Sync & Live Features */}
        <Card className="lg:col-span-2 bg-[#121214] border-zinc-800 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Mobile Companion Synchronization
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-0.5">
                  Real-time status of your physical Android device & background services
                </CardDescription>
              </div>
              <span className="text-xs text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                Live Websocket
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Shizuku API
                </div>
                <p className="text-[11px] text-zinc-400">
                  Folder <code>/Android/data</code> read/write & silent uninstall enabled.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Accessibility Loop
                </div>
                <p className="text-[11px] text-zinc-400">
                  Spatial coordinate parser & UI action dispatch ready.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Termux Linux Shell
                </div>
                <p className="text-[11px] text-zinc-400">
                  Direct bash/zsh command execution environment active.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white">
                  Want to test voice feedback from Web?
                </p>
                <p className="text-[11px] text-zinc-400">
                  Triggers Supertonic-3 local ONNX speech synthesizer on your mobile app.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-full cursor-pointer"
              >
                Send Voice Ping
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Quick Settings Hub link */}
        <Card className="bg-[#121214] border-zinc-800 text-white flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Quick Configuration
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Manage your BYOK API keys & agent preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5">
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-zinc-200">
                  BYOK API Keys
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
                  Voice Style & Emotion Tags
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-zinc-200">
                  Operating Safety Mode
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
              Open Full Settings Hub →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
