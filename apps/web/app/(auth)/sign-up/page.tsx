"use client";

import React, { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

function SignUpContent() {
  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Clerk Official Sign Up with Custom Dark Theme */}
      <div className="w-full flex justify-center">
        <SignUp
          routing="hash"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/onboarding"
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
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
          <span>Loading registration form...</span>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
