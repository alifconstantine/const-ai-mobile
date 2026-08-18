"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("email") || "";

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

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (!code || code.length < 6) {
      setErrorMessage("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 1500);
    } catch {
      setErrorMessage("Invalid or expired reset code. Please request a new one.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-[#121214]/95 border-zinc-800 text-white shadow-2xl backdrop-blur-2xl transition-all">
      <CardHeader className="text-center pb-3 pt-6">
        <div className="w-12 h-12 bg-white rounded-full mx-auto mb-3 flex items-center justify-center p-2.5 shadow-lg ring-4 ring-white/5">
          <ConstLogoIcon size="md" color="#000000" className="w-full h-full" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Create New Password
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm">
          {defaultEmail
            ? `Setting a new password for ${defaultEmail}`
            : "Enter the code sent to your email and your new password."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-6">
        {errorMessage && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {!isSuccess ? (
          <form onSubmit={handleReset} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs text-zinc-300">
                6-Digit Recovery Code
              </Label>
              <Input
                id="code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-zinc-900/90 border-zinc-800 text-white text-center text-lg font-mono tracking-widest placeholder:text-zinc-600 focus-visible:ring-zinc-400 h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs text-zinc-300">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-zinc-400 pr-10 h-10 rounded-xl"
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

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs text-zinc-300"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-zinc-400 pr-10 h-10 rounded-xl"
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
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all mt-2 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Password...
                </span>
              ) : (
                "Update Password & Sign In"
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Password Changed Successfully!
            </h3>
            <p className="text-xs text-zinc-400">
              Redirecting you to the sign-in page...
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-center border-t border-zinc-800/80 pt-3 pb-5 px-6 justify-center">
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-xs text-zinc-500 font-mono">
          Loading recovery form...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
