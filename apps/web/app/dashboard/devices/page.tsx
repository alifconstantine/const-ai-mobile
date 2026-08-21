"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@const-ai/backend";
import {
  Smartphone,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Battery,
  BatteryCharging,
  Shield,
  Terminal,
  Activity,
  Laptop,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

export default function DevicesPage() {
  const [pairingData, setPairingData] = useState<{
    pairingCode: string;
    qrPayload: string;
    expiresInSeconds: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [unpairingId, setUnpairingId] = useState<string | null>(null);

  const devices = useQuery((api as any).devices?.listUserDevices) || [];
  const generateCodeMutation = useMutation((api as any).devices?.generatePairingCode);
  const unpairDeviceMutation = useMutation((api as any).devices?.unpairDevice);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const res = await generateCodeMutation({
        deviceName: "Android Mobile Companion",
        platform: "android",
      });
      setPairingData(res);
    } catch (err) {
      console.error("Failed to generate pairing code:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    handleGenerateCode();
  }, []);

  const handleCopyCode = () => {
    if (!pairingData?.pairingCode) return;
    navigator.clipboard.writeText(pairingData.pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleUnpair = async (deviceId: string) => {
    setUnpairingId(deviceId);
    try {
      await unpairDeviceMutation({ deviceId: deviceId as any });
    } catch (err) {
      console.error("Failed to unpair device:", err);
    } finally {
      setUnpairingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-sky-400" />
            Device Companion & QR Sync
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Hubungkan perangkat Android Anda secara instan ke Web Dashboard melalui kode QR atau PIN 6-digit.
          </p>
        </div>

        <button
          onClick={handleGenerateCode}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-all cursor-pointer w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin text-sky-400" : ""}`} />
          <span>Refresh Pairing Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= CARD 1: QR & PIN PAIRING (LEFT 5 COLS) ================= */}
        <div className="lg:col-span-5 bg-[#111114] border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="w-full space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-medium">
              <Sparkles className="w-3 h-3" />
              <span>Pair New Companion</span>
            </div>

            <h3 className="text-sm font-semibold text-white">Scan QR atau Masukkan PIN</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Buka aplikasi <strong>Const AI Mobile</strong> di HP Anda, buka menu <strong>Settings &gt; Termux/OS Setup</strong>, dan hubungkan perangkat.
            </p>

            {/* QR Code Container */}
            <div className="my-4 p-4 bg-white rounded-2xl shadow-inner inline-block border border-zinc-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  pairingData?.qrPayload || "constai://pair"
                )}&color=09090b`}
                alt="Pairing QR Code"
                className="w-40 h-40 object-contain rounded-lg"
              />
            </div>

            {/* 6-Digit PIN Code Box */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                Atau Masukkan Kode 6-Digit:
              </span>
              <div className="flex items-center justify-center gap-2">
                <div className="bg-zinc-900 border border-zinc-700/80 px-4 py-2 rounded-xl text-lg font-mono font-bold tracking-widest text-sky-400 shadow-sm">
                  {pairingData?.pairingCode || "CNST-••••"}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 transition-colors cursor-pointer"
                  title="Copy Pairing Code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Kode aktif selama 10 menit</span>
          </div>
        </div>

        {/* ================= CARD 2: CONNECTED DEVICES (RIGHT 7 COLS) ================= */}
        <div className="lg:col-span-7 bg-[#111114] border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-white">Perangkat Terhubung</h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {devices.length} Perangkat Terdaftar
              </span>
            </div>

            {devices.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-300">Belum ada perangkat terhubung</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
                    Scan kode QR di samping dengan aplikasi Const AI Mobile untuk menghubungkan HP Anda.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {devices.map((d: any) => {
                  const isOnline = d.isOnline;
                  return (
                    <div
                      key={d._id}
                      className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                          {d.platform === "android" ? (
                            <Smartphone className="w-5 h-5 text-sky-400" />
                          ) : (
                            <Laptop className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-white">
                              {d.deviceName || "Android Mobile Companion"}
                            </h4>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                                isOnline
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                                }`}
                              />
                              {isOnline ? "Online" : "Offline"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono">
                            {d.batteryLevel !== undefined && (
                              <span className="flex items-center gap-1">
                                {d.isCharging ? (
                                  <BatteryCharging className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Battery className="w-3 h-3 text-zinc-400" />
                                )}
                                {d.batteryLevel}%
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Terminal className="w-3 h-3 text-sky-400" />
                              {d.termuxVersion ? `Termux ${d.termuxVersion}` : "Termux Ready"}
                            </span>
                            {d.shizukuActive && (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Shield className="w-3 h-3" />
                                Shizuku ADB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                        <button
                          onClick={() => handleUnpair(d._id)}
                          disabled={unpairingId === d._id}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Unpair</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-zinc-400 leading-relaxed">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Perangkat yang terhubung dapat menerima perintah eksekusi terminal, inspeksi storage, dan tool OS secara otomatis via WebSocket Convex tanpa konfigurasi port forwarding.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
