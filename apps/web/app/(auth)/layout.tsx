import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between items-center py-6 sm:py-10 px-4 sm:px-6 selection:bg-white selection:text-black">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-zinc-700/15 via-zinc-800/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-indigo-950/15 blur-[120px] rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-[450px] h-[450px] bg-purple-950/10 blur-[130px] rounded-full" />
        {/* Subtle dot pattern background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Header Navigation Bar */}
      <header className="w-full max-w-md flex justify-between items-center z-10 pb-6 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-xs sm:text-sm font-medium transition-all group px-2.5 py-1.5 rounded-full hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono bg-zinc-900/70 border border-zinc-800/80 px-2.5 py-1 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-300">Convex Auth Vault</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md z-10 my-auto py-2 shrink-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-zinc-500 z-10 pt-6 pb-2 shrink-0">
        <span className="font-mono">© 2026 Const AI • All Rights Reserved</span>
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:text-zinc-300 transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="/" className="hover:text-zinc-300 transition-colors">Terms</Link>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-zinc-400">
            <Lock className="w-3 h-3 text-zinc-500" />
            256-Bit SSL
          </span>
        </div>
      </footer>
    </div>
  );
}
