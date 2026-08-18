"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { ConstLogoIcon } from "@/components/ConstLogo";
import { Sparkles, Loader2, ShieldCheck } from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const handleInstantDemoLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "const_user_session",
        JSON.stringify({
          email: "demo@constai.platform",
          name: "Alif Constantine (Operator)",
          username: "alif_constantine",
          avatarUrl:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
          isLoggedIn: true,
          authMethod: "instant_demo",
          loginAt: Date.now(),
        })
      );
    }
    router.push(redirectTarget);
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Clerk Official Sign In with Custom Dark Theme */}
      <div className="w-full flex justify-center">
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          fallbackRedirectUrl={redirectTarget}
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-zinc-950/85 border border-zinc-800/90 text-white shadow-2xl backdrop-blur-2xl rounded-3xl p-6 sm:p-8 w-full",
              headerTitle: "text-white text-2xl font-bold tracking-tight text-center",
              headerSubtitle: "text-zinc-400 text-xs sm:text-sm text-center",
              socialButtonsBlockButton:
                "bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-medium rounded-full py-2.5 px-4 text-xs sm:text-sm transition-all shadow-sm cursor-pointer",
              dividerLine: "bg-zinc-800",
              dividerText: "text-zinc-500 text-[11px] font-mono uppercase bg-zinc-950",
              formFieldLabel: "text-xs font-medium text-zinc-300",
              formFieldInput:
                "bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm rounded-xl h-10 focus:ring-1 focus:ring-zinc-400",
              formButtonPrimary:
                "bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all cursor-pointer shadow-md text-xs sm:text-sm",
              footerActionLink: "text-white font-medium hover:underline",
              footerActionText: "text-xs text-zinc-400",
              identityPreviewText: "text-zinc-200 text-xs",
              identityPreviewEditButtonIcon: "text-zinc-400 hover:text-white",
            },
          }}
        />
      </div>

      {/* One-Click Instant Demo Access Box */}
      <div className="w-full max-w-md pt-1">
        <button
          type="button"
          onClick={handleInstantDemoLogin}
          className="w-full py-2.5 px-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 transition-transform group-hover:scale-110" />
          <span>One-Click Instant Demo Access</span>
          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800 px-1.5 py-0.5 rounded-md">
            Fast Preview
          </span>
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
          <span>Loading authentication vault...</span>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
