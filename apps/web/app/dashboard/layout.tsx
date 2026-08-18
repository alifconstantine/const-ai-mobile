"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConstLogoIcon } from "@/components/ConstLogo";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  LayoutDashboard,
  Settings,
  Smartphone,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Cpu,
  Loader2,
  Bell,
  Sparkles,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  let authActions: { signIn?: any; signOut?: any } = {};
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    authActions = useAuthActions();
  } catch {
    // ignore
  }

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    username: string;
    avatarUrl?: string;
    email?: string;
  } | null>(null);

  // Unauthenticated Route Guard Check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionStr = localStorage.getItem("const_user_session");
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session && session.isLoggedIn) {
            setIsAuthenticated(true);
            setUserProfile({
              name: session.name || "Alif Constantine",
              username: session.username || "alif",
              avatarUrl:
                session.avatarUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
              email: session.email || "alif@example.com",
            });
            return;
          }
        } catch {
          // parse failed
        }
      }

      // Not authenticated -> Redirect to /sign-in
      setIsAuthenticated(false);
      const timer = setTimeout(() => {
        router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, router]);

  const handleLogout = async () => {
    if (authActions.signOut) {
      try {
        await authActions.signOut();
      } catch (err) {
        console.warn("SignOut notice:", err);
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("const_user_session");
    }
    router.push("/sign-in");
  };

  // 1. Loading State while checking Auth
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center p-2.5 animate-pulse">
          <ConstLogoIcon size="md" color="#ffffff" className="w-full h-full" />
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
          <span>Verifying authentication & vault access...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Settings & BYOK",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname === "/dashboard/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col md:flex-row antialiased select-none">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-[#111113] border-b md:border-b-0 md:border-r border-zinc-800/80 p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <div className="flex items-center justify-between pb-6 mb-4 border-b border-zinc-800/80 px-2 pt-1">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm">
                <ConstLogoIcon size="sm" color="#000000" className="w-full h-full" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-tight text-white block">
                  Const AI
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  Control Center v3.2
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  item.active
                    ? "bg-zinc-800 text-white shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Hardware Status Snippet */}
          <div className="mt-8 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                Mobile Phone
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Synced
              </span>
            </div>
            <div className="space-y-1 text-[10px] text-zinc-400">
              <div className="flex justify-between">
                <span>Shizuku Bridge:</span>
                <span className="text-emerald-400 font-mono">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>Voice Engine:</span>
                <span className="text-zinc-200 font-mono">Supertonic-3</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="pt-4 border-t border-zinc-800/80 mt-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-zinc-900 via-zinc-800 to-zinc-700 border border-zinc-600 flex items-center justify-center text-white text-xs font-bold font-mono shrink-0 select-none">
                {userProfile?.name
                  ? userProfile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "CA"}
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {userProfile?.name}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                @{userProfile?.username}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-zinc-800/80 bg-[#111113]/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            <span>Control Center</span>
            <span>/</span>
            <span className="text-white capitalize">
              {pathname.split("/").pop() || "Overview"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Public Landing Page ↗
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
