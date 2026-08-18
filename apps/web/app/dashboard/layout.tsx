"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConstLogoIcon } from "@/components/ConstLogo";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@const-ai/backend";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Clerk Auth state
  const { user: clerkUser, isLoaded: clerkIsLoaded, isSignedIn: clerkIsSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  // Convex viewer query
  const liveViewer = useQuery(api.users.viewer);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    username: string;
    avatarUrl?: string;
    email?: string;
  } | null>(null);

  // Sync session & Authenticated Route Guard Check
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (clerkIsSignedIn && clerkUser) {
        setIsAuthenticated(true);
        setUserProfile({
          name: clerkUser.fullName || clerkUser.firstName || "Operator",
          username:
            clerkUser.username ||
            clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            "operator",
          avatarUrl: clerkUser.imageUrl || undefined,
          email: clerkUser.primaryEmailAddress?.emailAddress || "operator@constai.platform",
        });
        return;
      }

      if (liveViewer) {
        setIsAuthenticated(true);
        setUserProfile({
          name: liveViewer.name || "Operator",
          username: liveViewer.username || "operator",
          avatarUrl: liveViewer.avatarUrl || liveViewer.image || undefined,
          email: liveViewer.email || "operator@constai.platform",
        });
        return;
      }

      if (!clerkIsLoaded) {
        return;
      }

      setIsAuthenticated(false);
      const timer = setTimeout(() => {
        router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, router, liveViewer, clerkIsSignedIn, clerkUser, clerkIsLoaded]);

  const handleLogout = async () => {
    if (clerkSignOut) {
      try {
        await clerkSignOut();
      } catch (err) {
        console.warn("Clerk SignOut notice:", err);
      }
    }
    router.push("/sign-in");
  };

  // Loading State while verifying Auth
  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-3 animate-pulse shadow-2xl">
          <ConstLogoIcon size="md" color="#ffffff" className="w-full h-full" />
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
          <span>Verifying authentication & workspace access...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: "Dashboard",
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
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm transition-transform hover:scale-105">
                <ConstLogoIcon size="sm" color="#000000" className="w-full h-full" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-tight text-white block">
                  Const AI
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  Control Center
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-700 border border-zinc-600 flex items-center justify-center text-white text-xs font-bold font-mono shrink-0 select-none">
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
                {userProfile?.name || "Operator"}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">
                @{userProfile?.username || "operator"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
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
              {pathname === "/dashboard" ? "Dashboard" : pathname.split("/").pop() || "Dashboard"}
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
