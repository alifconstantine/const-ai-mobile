"use client";

import React from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] p-6 space-y-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white tracking-tight">
          Authorizing Access
        </h3>
        <p className="text-xs text-zinc-400 font-mono">
          Finalizing authentication handshake with Const AI...
        </p>
      </div>
      <AuthenticateWithRedirectCallback
        continueSignUpUrl="/sign-up/continue"
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </div>
  );
}
