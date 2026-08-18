import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between items-center p-4 sm:p-6 overflow-x-hidden selection:bg-white selection:text-black">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[380px] bg-zinc-800/20 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-900/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Header Bar */}
      <div className="w-full max-w-md flex justify-between items-center z-10 pt-2 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Convex Cloud Vault</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-md z-10 my-auto py-2">
        {children}
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md flex justify-between items-center text-[11px] text-zinc-600 z-10 pt-4 pb-2">
        <span>© 2026 Const AI Platform</span>
        <div className="flex gap-3">
          <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
}
