"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  LayoutDashboard,
  ListFilter,
  Search,
  Flame,
  MessageSquare,
  FolderKanban,
  Calendar,
  Cpu,
  Zap,
  CheckCircle2,
  XCircle,
  Smartphone,
  BatteryCharging,
  Battery,
  HardDrive,
  Server,
  Eye,
  ShieldCheck,
  Activity,
  Clock,
  Layers,
  Sparkles,
  SmartphoneNfc,
  Plus,
} from "lucide-react";

import { useQuery } from "convex/react";
import { api } from "@const-ai/backend";
import { useUser } from "@clerk/nextjs";

// Helper: Format number with compact K/M suffixes
function formatCompact(num: number): string {
  if (!num || isNaN(num)) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

// Helper: Format timestamp
function formatTime(timestamp: number): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

interface LogItem {
  id: string;
  timestamp: number;
  status: 200 | 400 | 429 | 500;
  model: string;
  provider: "OMNIROUTE" | "GEMINI" | "OPENROUTER" | "ANTHROPIC" | "OPENAI" | "CUSTOM";
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  promptSnippet: string;
  responseSnippet: string;
  toolsCalled?: string[];
}

export default function DashboardPage() {
  const { user: clerkUser } = useUser();
  const liveViewer = useQuery(api.users.viewer);

  // Real Queries from Convex
  const dashboardStats = useQuery(api.users.getDashboardSummary);
  const recentLogsRaw = useQuery(api.users.listRecentLogs, { limit: 100 });
  const connectedDevices = useQuery(api.users.listDevices);

  // Active Tab: "dashboard" (Overview) vs "logs" (LLM Call Inspector)
  const [activeTab, setActiveTab] = useState<"dashboard" | "logs">("dashboard");

  // Selected Provider Filter for Token Usage
  const [selectedProvider, setSelectedProvider] = useState<string>("all");

  // Log Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [logProviderFilter, setLogProviderFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  // User details
  const userName =
    liveViewer?.name ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    "Operator";

  const activeModel = liveViewer?.config?.activeModel || "Const";

  // Operating Mode
  const operatingMode = liveViewer?.config?.operatingMode || "normal_mode";
  const operatingModeLabels: Record<string, { title: string; badge: string }> = {
    normal_mode: { title: "Normal Mode (Safe)", badge: "No Tools" },
    ask_before_change: { title: "Ask Before Change", badge: "HITL (Protected)" },
    plan_mode: { title: "Plan Mode Only", badge: "Read Only" },
    full_access_yolo: { title: "Full Access Mode", badge: "YOLO (Unrestricted)" },
  };
  const currentMode = operatingModeLabels[operatingMode] || operatingModeLabels.normal_mode;

  // Real Stats Extract
  const totalSessions = dashboardStats?.totalSessions ?? 0;
  const totalMessages = dashboardStats?.totalMessages ?? 0;
  const activeDays = dashboardStats?.activeDays ?? 0;
  const currentStreak = dashboardStats?.currentStreak ?? 0;
  const favoriteModel = dashboardStats?.favoriteModel ?? "None";

  // Real Token Breakdown per provider
  const currentTokenStats = useMemo(() => {
    if (!dashboardStats?.providerBreakdown) {
      return { tokensIn: 0, tokensOut: 0, label: "All Providers Combined" };
    }
    return (
      dashboardStats.providerBreakdown[selectedProvider as keyof typeof dashboardStats.providerBreakdown] ||
      dashboardStats.providerBreakdown.all
    );
  }, [dashboardStats, selectedProvider]);

  const totalTokens = (currentTokenStats?.tokensIn || 0) + (currentTokenStats?.tokensOut || 0);
  const ioRatio =
    currentTokenStats && currentTokenStats.tokensOut > 0
      ? (currentTokenStats.tokensIn / currentTokenStats.tokensOut).toFixed(1)
      : "0.0";
  const tokenInPercent =
    totalTokens > 0 ? Math.round(((currentTokenStats?.tokensIn || 0) / totalTokens) * 100) : 0;

  // Daily Trend Chart Data (from Real Convex Query)
  const dailyTrendData = useMemo(() => {
    return dashboardStats?.dailyTrend || [];
  }, [dashboardStats]);

  // Heatmap Data (from Real Convex Query)
  const heatmapData = useMemo(() => {
    return dashboardStats?.heatmap || [];
  }, [dashboardStats]);

  // Logs list (from Real Convex Query)
  const recentLogs: LogItem[] = useMemo(() => {
    return (recentLogsRaw || []) as LogItem[];
  }, [recentLogsRaw]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return recentLogs.filter((log) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          log.model?.toLowerCase().includes(q) ||
          log.provider?.toLowerCase().includes(q) ||
          log.promptSnippet?.toLowerCase().includes(q) ||
          log.id?.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Status filter
      if (statusFilter === "success" && log.status !== 200) return false;
      if (statusFilter === "error" && log.status === 200) return false;

      // Provider filter
      if (
        logProviderFilter !== "all" &&
        log.provider?.toLowerCase() !== logProviderFilter.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [recentLogs, searchQuery, statusFilter, logProviderFilter]);

  // Connected Devices (from Real Convex Query)
  const primaryDevice = connectedDevices && connectedDevices.length > 0 ? connectedDevices[0] : null;

  return (
    <div className="space-y-6 select-none max-w-6xl pb-12">
      {/* ================= TOP WELCOME & TELEMETRY HEADER ================= */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-zinc-900 via-[#151518] to-zinc-900 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Convex Realtime Live</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 text-[11px] font-mono">
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span>Model: {activeModel}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 text-[11px] font-mono">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>{currentMode.badge}</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome, {userName}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Real-time control center for your AI agent sessions, token telemetry, and execution logs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/settings">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl text-xs cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              <span>Configure Providers</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ================= TAB NAVIGATION SWITCHER ================= */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-white text-black shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-white text-black shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Logs</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 rounded-md ml-1 ${
                activeTab === "logs"
                  ? "border-black/20 text-black font-bold"
                  : "border-zinc-700 text-zinc-400"
              }`}
            >
              {recentLogs.length}
            </Badge>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>Auto-sync enabled</span>
        </div>
      </div>

      {/* ================= TAB 1: DASHBOARD (OVERVIEW & ANALYTICS) ================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* 1. Primary Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Sessions */}
            <Card className="bg-[#121214] border-zinc-800 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-xs font-medium">Total Sessions</span>
                  <FolderKanban className="w-4 h-4 text-indigo-400" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1 text-white">
                  {totalSessions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {totalSessions > 0 ? "Autonomous task threads" : "No task sessions created"}
                </p>
              </CardContent>
            </Card>

            {/* Total Messages */}
            <Card className="bg-[#121214] border-zinc-800 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-xs font-medium">Total Messages</span>
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl font-bold mt-1 text-white">
                  {totalMessages}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {totalMessages > 0 ? "User prompts & AI turns" : "No messages recorded"}
                </p>
              </CardContent>
            </Card>

            {/* Active Days & Streak */}
            <Card className="bg-[#121214] border-zinc-800 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-xs font-medium">Activity Streak</span>
                  <Flame
                    className={`w-4 h-4 ${
                      currentStreak > 0 ? "text-amber-400 fill-amber-400" : "text-zinc-600"
                    }`}
                  />
                </div>
                <CardTitle className="text-2xl font-bold mt-1 text-white flex items-center gap-1.5">
                  <span>{currentStreak} Days</span>
                  {currentStreak > 0 ? (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-800/50 text-amber-300 font-normal font-mono">
                      Active 🔥
                    </span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal font-mono">
                      Idle
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-zinc-500 font-mono">
                  {activeDays} total active days
                </p>
              </CardContent>
            </Card>

            {/* Favorite Model */}
            <Card className="bg-[#121214] border-zinc-800 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-xs font-medium">Favorite Model</span>
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </div>
                <CardTitle className="text-base font-bold mt-1 text-white truncate">
                  {favoriteModel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-zinc-500 font-mono truncate">
                  {favoriteModel !== "None" ? "Most active intelligence" : "Awaiting first prompt"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 2. Token In & Out Breakdown + Provider Selector */}
          <Card className="bg-[#121214] border-zinc-800 text-white">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Token Consumption & I/O Telemetry</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-0.5">
                    Filter token usage across specific LLM gateways or view combined telemetry
                  </CardDescription>
                </div>

                {/* Provider Filter Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">Provider:</span>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="w-48 bg-zinc-900 border-zinc-700 text-xs text-white rounded-xl">
                      <SelectValue placeholder="All Providers" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                      <SelectItem value="all">All Providers Combined</SelectItem>
                      <SelectItem value="omniroute">OmniRoute (Local Gateway)</SelectItem>
                      <SelectItem value="gemini">Google Gemini Direct</SelectItem>
                      <SelectItem value="openrouter">OpenRouter Multi-LLM</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="openai">OpenAI GPT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Token Stats 3-Col Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Input Tokens (Prompt TI)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-mono">
                      {tokenInPercent}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {formatCompact(currentTokenStats?.tokensIn || 0)}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    System prompts, tool schemas & context
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Output Tokens (Generated TO)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-mono">
                      {totalTokens > 0 ? 100 - tokenInPercent : 0}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {formatCompact(currentTokenStats?.tokensOut || 0)}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    Model completions & tool call arguments
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Total Tokens & Ratio</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950/80 text-violet-300 font-mono">
                      I/O {ioRatio}x
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {formatCompact(totalTokens)}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    {currentTokenStats?.label || "No provider tokens recorded"}
                  </p>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Input Tokens ({tokenInPercent}%)</span>
                  <span>Output Tokens ({totalTokens > 0 ? 100 - tokenInPercent : 0}%)</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  {totalTokens > 0 ? (
                    <>
                      <div
                        style={{ width: `${tokenInPercent}%` }}
                        className="bg-indigo-500 transition-all duration-500"
                        title={`Input: ${formatCompact(currentTokenStats?.tokensIn || 0)}`}
                      />
                      <div
                        style={{ width: `${100 - tokenInPercent}%` }}
                        className="bg-emerald-400 transition-all duration-500"
                        title={`Output: ${formatCompact(currentTokenStats?.tokensOut || 0)}`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-zinc-900" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Activity Heatmap (GitHub-Style Grid) */}
          <Card className="bg-[#121214] border-zinc-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Agent Activity Heatmap</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-0.5">
                    Interaction frequency and autonomous turn executions over the last 98 days
                  </CardDescription>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                  <span>Less</span>
                  <span className="w-2.5 h-2.5 rounded-xs bg-zinc-900 border border-zinc-800" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-950 border border-emerald-900" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-800" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
                  <span>More</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto pb-2">
                <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[680px]">
                  {heatmapData.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                      No interaction history recorded yet.
                    </div>
                  ) : (
                    heatmapData.map((item: { date: string; count: number; level: number }, idx: number) => {
                      const colorClass =
                        item.level === 0
                          ? "bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-600"
                          : item.level === 1
                            ? "bg-emerald-950 border border-emerald-900/80 hover:border-emerald-700"
                            : item.level === 2
                              ? "bg-emerald-800 border border-emerald-700/80 hover:border-emerald-500"
                              : item.level === 3
                                ? "bg-emerald-600 border border-emerald-500/80 hover:border-emerald-400"
                                : "bg-emerald-400 border border-emerald-300 hover:brightness-110";

                      return (
                        <div
                          key={idx}
                          title={`${item.date}: ${item.count} AI interactions`}
                          className={`w-3.5 h-3.5 rounded-xs transition-colors cursor-pointer ${colorClass}`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Daily Token & Message Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-[#121214] border-zinc-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <span>7-Day Daily Token Velocity</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Input prompt vs Output completion volume per day
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 pt-2">
                {dailyTrendData.every((d: { tokensIn: number; tokensOut: number; messages: number }) => d.tokensIn === 0 && d.tokensOut === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                    <Activity className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs">No token consumption recorded in the last 7 days.</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">Start a chat on mobile or send a prompt to populate telemetry.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tokenInGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="tokenOutGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => formatCompact(val)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          borderColor: "#3f3f46",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="tokensIn"
                        name="Input Tokens"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#tokenInGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="tokensOut"
                        name="Output Tokens"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#tokenOutGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Daily Message Volume */}
            <Card className="bg-[#121214] border-zinc-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Turns Per Day</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Total prompt & tool turns
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 pt-2">
                {dailyTrendData.every((d: { tokensIn: number; tokensOut: number; messages: number }) => d.messages === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                    <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs">No turn messages in the last 7 days.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          borderColor: "#3f3f46",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="messages" name="Messages" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 5. Connected Android Device Telemetry Card */}
          <Card className="bg-[#121214] border-zinc-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <div>
                    <CardTitle className="text-base font-bold">
                      Connected Companion Device Telemetry
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400 mt-0.5">
                      Event-driven passive telemetry synced during active tasks (zero background battery drain)
                    </CardDescription>
                  </div>
                </div>
                {primaryDevice ? (
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono ${
                      primaryDevice.isOnline
                        ? "border-emerald-800 bg-emerald-950/70 text-emerald-400"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    ● {primaryDevice.deviceName} • {primaryDevice.isOnline ? "Online" : "Offline"}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-zinc-800 bg-zinc-900/80 text-zinc-500 text-xs font-mono"
                  >
                    No devices paired
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {primaryDevice ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Battery */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1">
                      {primaryDevice.isCharging ? (
                        <BatteryCharging className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Battery className="w-4 h-4 text-zinc-400" />
                      )}
                      <span>Battery Status</span>
                    </div>
                    <div className="text-lg font-bold text-white font-mono">
                      {primaryDevice.batteryLevel !== undefined ? `${primaryDevice.batteryLevel}%` : "—"}{" "}
                      {primaryDevice.isCharging && (
                        <span className="text-xs text-emerald-400 font-normal">Charging ⚡</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Updated {formatTime(primaryDevice.lastPingAt)}
                    </p>
                  </div>

                  {/* RAM */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <span>RAM Memory</span>
                    </div>
                    <div className="text-lg font-bold text-white font-mono">
                      {primaryDevice.ramFreeMb !== undefined
                        ? `${(primaryDevice.ramFreeMb / 1024).toFixed(1)} GB Free`
                        : "—"}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {primaryDevice.ramTotalMb
                        ? `of ${(primaryDevice.ramTotalMb / 1024).toFixed(1)} GB total`
                        : "Passive snapshot"}
                    </p>
                  </div>

                  {/* Storage */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1">
                      <HardDrive className="w-4 h-4 text-amber-400" />
                      <span>Internal Storage</span>
                    </div>
                    <div className="text-lg font-bold text-white font-mono">
                      {primaryDevice.storageFreeGb !== undefined
                        ? `${primaryDevice.storageFreeGb} GB Free`
                        : "—"}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {primaryDevice.storageTotalGb
                        ? `of ${primaryDevice.storageTotalGb} GB total`
                        : "StatFs query"}
                    </p>
                  </div>

                  {/* Privileged Bridges */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Bridges & Daemons</span>
                    </div>
                    <div className="text-xs font-mono space-y-0.5">
                      <div className={primaryDevice.shizukuActive ? "text-emerald-400" : "text-zinc-500"}>
                        ● Shizuku: {primaryDevice.shizukuActive ? "Granted" : "Inactive"}
                      </div>
                      <div className={primaryDevice.accessibilityActive ? "text-emerald-400" : "text-zinc-500"}>
                        ● Spatial UI: {primaryDevice.accessibilityActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-center space-y-3">
                  <SmartphoneNfc className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">No Android device connected yet</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                      Open the Const AI Mobile app on your Android phone to automatically register and stream passive telemetry.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 2: LOGS (OMNIROUTE INSPIRED) ================= */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <Card className="bg-[#121214] border-zinc-800 text-white">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by model, provider, prompt keyword, or request ID..."
                    className="pl-9 bg-zinc-900 border-zinc-700 text-xs text-white rounded-xl placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Segment Filter */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-xl p-1 text-xs">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        statusFilter === "all"
                          ? "bg-zinc-800 text-white font-semibold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      All ({recentLogs.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter("success")}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        statusFilter === "success"
                          ? "bg-emerald-950 text-emerald-400 font-semibold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Success (200)</span>
                    </button>
                    <button
                      onClick={() => setStatusFilter("error")}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        statusFilter === "error"
                          ? "bg-rose-950 text-rose-400 font-semibold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <XCircle className="w-3 h-3 text-rose-400" />
                      <span>Errors</span>
                    </button>
                  </div>

                  {/* Provider Filter */}
                  <Select value={logProviderFilter} onValueChange={setLogProviderFilter}>
                    <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-xs text-white rounded-xl">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                      <SelectItem value="all">All Providers</SelectItem>
                      <SelectItem value="omniroute">OmniRoute</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card className="bg-[#121214] border-zinc-800 text-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Model</th>
                    <th className="py-3 px-4 font-semibold">Provider</th>
                    <th className="py-3 px-4 font-semibold">Tokens</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 font-semibold">Time</th>
                    <th className="py-3 px-4 font-semibold text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        <Activity className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-zinc-400">No LLM call logs found</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          {searchQuery
                            ? "Try clearing your search query or filter."
                            : "As you interact with the agent, requests will be logged here in realtime."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                      >
                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              log.status === 200
                                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                                : log.status === 429
                                  ? "bg-amber-950/80 text-amber-400 border border-amber-800/50"
                                  : "bg-rose-950/80 text-rose-400 border border-rose-800/50"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>

                        {/* Model */}
                        <td className="py-3 px-4 text-white font-medium">
                          <span className="text-zinc-200 group-hover:text-indigo-400 transition-colors">
                            {log.model}
                          </span>
                        </td>

                        {/* Provider */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-semibold border border-zinc-700/60">
                            {log.provider}
                          </span>
                        </td>

                        {/* Tokens */}
                        <td className="py-3 px-4 text-zinc-300">
                          <span className="text-indigo-400 font-semibold">
                            TI: {formatCompact(log.tokensIn)}
                          </span>
                          <span className="mx-1.5 text-zinc-600">•</span>
                          <span className="text-emerald-400 font-semibold">
                            TO: {formatCompact(log.tokensOut)}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 text-zinc-400">
                          {log.durationMs > 0
                            ? log.durationMs < 1000
                              ? `${log.durationMs}ms`
                              : `${(log.durationMs / 1000).toFixed(2)}s`
                            : "—"}
                        </td>

                        {/* Time */}
                        <td className="py-3 px-4 text-zinc-500">
                          {formatTime(log.timestamp)}
                        </td>

                        {/* Inspect Button */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-colors cursor-pointer"
                            title="Inspect LLM Payload"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ================= MODAL: LOG INSPECTOR DIALOG ================= */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-white">
                  LLM Request Trace Inspector
                </DialogTitle>
                {selectedLog && (
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs ${
                      selectedLog.status === 200
                        ? "border-emerald-800 text-emerald-400"
                        : "border-rose-800 text-rose-400"
                    }`}
                  >
                    HTTP {selectedLog.status}
                  </Badge>
                )}
              </div>
            </div>
            <DialogDescription className="text-xs text-zinc-400 font-mono mt-1">
              ID: {selectedLog?.id} • Timestamp: {selectedLog ? formatTime(selectedLog.timestamp) : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-xs mt-2">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 font-mono">
                <div>
                  <div className="text-zinc-500 text-[10px]">MODEL</div>
                  <div className="text-white font-semibold truncate">{selectedLog.model}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px]">GATEWAY</div>
                  <div className="text-indigo-400 font-semibold">{selectedLog.provider}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px]">TOKENS (TI / TO)</div>
                  <div className="text-emerald-400 font-semibold">
                    {selectedLog.tokensIn} / {selectedLog.tokensOut}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px]">LATENCY</div>
                  <div className="text-amber-400 font-semibold">
                    {selectedLog.durationMs > 0 ? `${selectedLog.durationMs} ms` : "—"}
                  </div>
                </div>
              </div>

              {/* Tools Called (if any) */}
              {selectedLog.toolsCalled && selectedLog.toolsCalled.length > 0 && (
                <div>
                  <div className="text-zinc-400 font-medium mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Native Agent Tools Executed</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLog.toolsCalled.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-800/50 text-indigo-300 font-mono text-[11px]"
                      >
                        ⚡ {tool}()
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt Snippet */}
              <div>
                <div className="text-zinc-400 font-medium mb-1">User Prompt / Instruction:</div>
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                  {selectedLog.promptSnippet}
                </div>
              </div>

              {/* Response Snippet */}
              <div>
                <div className="text-zinc-400 font-medium mb-1">AI Output / Result:</div>
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                  {selectedLog.responseSnippet}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
