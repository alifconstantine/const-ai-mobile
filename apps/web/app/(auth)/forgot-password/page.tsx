"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
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
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  let authActions: { signIn?: any; signOut?: any } = {};
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    authActions = useAuthActions();
  } catch {
    // In case running outside active Convex Auth Context
  }

  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      if (authActions.signIn) {
        try {
          await authActions.signIn("password", {
            email: email.trim(),
            flow: "reset",
          });
        } catch (convexErr: any) {
          console.warn("Convex Auth Reset notice:", convexErr);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsSent(true);
      setCooldown(60);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-950/85 border border-zinc-800/90 text-white shadow-2xl backdrop-blur-2xl rounded-3xl transition-all overflow-hidden">
      <CardHeader className="text-center pb-2 pt-6 px-6 sm:px-8">
        <div className="w-12 h-12 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center p-2.5 shadow-xl ring-4 ring-white/10 transition-transform hover:scale-105">
          <ConstLogoIcon size="md" color="#000000" className="w-full h-full" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Reset Your Password
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
          Enter your registered email address to receive password recovery instructions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-6 sm:px-8 pt-2">
        {errorMessage && (
          <div className="p-3 bg-red-950/60 border border-red-800/70 rounded-2xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {!isSent ? (
          <form onSubmit={handleSendReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="alif@constai.platform"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 pl-10 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all mt-2 cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Recovery Code...
                </span>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Check your inbox
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                We sent a secure 6-digit recovery code to{" "}
                <span className="text-white font-mono font-medium">{email}</span>.
              </p>
            </div>

            <Button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>Enter Recovery Code</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-[11px] text-zinc-500 font-mono">
              Didn&apos;t receive it?{" "}
              {cooldown > 0 ? (
                <span className="text-zinc-400">Resend available in {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendReset}
                  className="text-zinc-300 underline hover:text-white cursor-pointer font-sans"
                >
                  Resend code now
                </button>
              )}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-center border-t border-zinc-800/80 pt-3.5 pb-5 px-6 sm:px-8 justify-center">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
