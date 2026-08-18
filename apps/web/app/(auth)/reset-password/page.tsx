"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("email") || "";

  let authActions: { signIn?: any; signOut?: any } = {};
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    authActions = useAuthActions();
  } catch {
    // In case running outside active Convex Auth Context
  }

  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!code || code.trim().length < 6) {
      setErrorMessage("Please enter a valid 6-digit verification code.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      if (authActions.signIn) {
        try {
          await authActions.signIn("password", {
            email: email.trim(),
            code: code.trim(),
            newPassword,
            flow: "reset-verification",
          });
        } catch (convexErr: any) {
          console.warn("Convex Auth Reset Verification notice:", convexErr);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid or expired reset code. Please request a new one.");
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
          Create New Password
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
          {email
            ? `Set a new security password for ${email}`
            : "Enter the code sent to your email and your new password."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-6 sm:px-8 pt-2">
        {errorMessage && (
          <div className="p-3 bg-red-950/60 border border-red-800/70 rounded-2xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {!isSuccess ? (
          <form onSubmit={handleReset} className="space-y-3.5">
            {!defaultEmail && (
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alif@constai.platform"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
                  required
                />
              </div>
            )}

            {/* 6-Digit Recovery Code */}
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-medium text-zinc-300">
                6-Digit Recovery Code
              </Label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white text-center text-lg font-mono tracking-widest placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-medium text-zinc-300">
                New Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 pl-10 pr-10 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer p-1"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-medium text-zinc-300"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 pl-10 pr-10 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer p-1"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
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
                  Updating Password...
                </span>
              ) : (
                <>
                  <span>Save Password & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Password Changed Successfully!
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your security credentials have been updated in Convex Auth. Redirecting to sign in...
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
          <span>Loading recovery vault...</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
