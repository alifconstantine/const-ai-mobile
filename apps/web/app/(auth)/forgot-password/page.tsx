"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConstLogoIcon } from "@/components/ConstLogo";
import { KeyRound, Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 750));
      setIsSent(true);
      setCooldown(60);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-[#121214] border-zinc-800 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader className="text-center pb-3">
        <div className="w-12 h-12 bg-white rounded-full mx-auto mb-3 flex items-center justify-center p-2.5 shadow-md">
          <ConstLogoIcon size="md" color="#000000" className="w-full h-full" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Reset Your Password
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm">
          Enter your registered email address to receive password recovery
          instructions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isSent ? (
          <form onSubmit={handleSendReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-zinc-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="alif@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white pl-9 placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-zinc-400"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 transition-all mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Recovery Link...
                </span>
              ) : (
                "Send Reset Instructions"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center py-2">
            <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-100">
                Check your inbox
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                We sent a secure password reset link and 6-digit recovery code to{" "}
                <span className="text-white font-medium">{email}</span>.
              </p>
            </div>

            <Button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Enter Reset Code</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-[11px] text-zinc-500">
              Didn&apos;t receive it?{" "}
              {cooldown > 0 ? (
                <span className="text-zinc-400">Resend in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendReset}
                  className="text-zinc-300 underline hover:text-white"
                >
                  Resend now
                </button>
              )}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-center border-t border-zinc-800/80 pt-3 pb-2 justify-center">
        <Link
          href="/sign-in"
          className="text-xs text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
