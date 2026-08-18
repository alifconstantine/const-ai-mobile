"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useAuth } from "@clerk/nextjs";
import { ConstLogoIcon } from "@/components/ConstLogo";
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
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";

function ContinueContent() {
  const router = useRouter();
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // If user is already signed in, redirect to dashboard
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  // Pre-fill suggested username from Google/OAuth email or name
  useEffect(() => {
    if (signUp) {
      const email = signUp.emailAddress || "";
      const first = signUp.firstName || "";
      const last = signUp.lastName || "";
      if (first || last) {
        setFullName(`${first} ${last}`.trim());
      }
      if (!username) {
        const suggested = email
          ? email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "")
          : first
          ? `${first}${last ? "_" + last : ""}`.toLowerCase().replace(/[^a-z0-9_]/g, "")
          : "";
        if (suggested) {
          setUsername(suggested);
        }
      }
    }
  }, [signUp, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!signUp) return;

    const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage("Username must be at least 3 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const updateData: { username: string; firstName?: string; lastName?: string } = {
        username: cleanUsername,
      };

      if (fullName.trim()) {
        const parts = fullName.trim().split(" ");
        updateData.firstName = parts[0];
        if (parts.length > 1) {
          updateData.lastName = parts.slice(1).join(" ");
        }
      }

      // Update sign-up object with missing username
      const { error: updateError } = await signUp.update(updateData);
      if (updateError) {
        throw updateError;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/dashboard");
            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Clerk continue error:", err);
      const msg =
        err?.message ||
        "Failed to set username. Please choose another handle.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isBusy = isLoading || fetchStatus === "fetching";

  return (
    <Card className="bg-zinc-950/85 border border-zinc-800/90 text-white shadow-2xl backdrop-blur-2xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pb-2 pt-6 px-6 sm:px-8">
        <div className="w-12 h-12 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center p-2.5 shadow-xl ring-4 ring-white/10 transition-transform hover:scale-105">
          <ConstLogoIcon size="md" color="#000000" className="w-full h-full" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Choose Your Handle
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
          Pick your unique username to complete your Const AI operator profile
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-6 sm:px-8 pt-2">
        {errorMessage && (
          <div className="p-3 bg-red-950/60 border border-red-800/70 rounded-2xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Identity preview pill */}
        {signUp?.emailAddress && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
            <span className="text-zinc-400">Authenticated as:</span>
            <span className="text-zinc-200 font-mono font-medium truncate max-w-[200px]">
              {signUp.emailAddress}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (if not already set) */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-medium text-zinc-300">
              Display Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
            />
          </div>

          {/* Username handle */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="username" className="text-xs font-medium text-zinc-300">
                Username Handle
              </Label>
              <span className="text-[11px] text-zinc-400 font-mono">
                @{username || "username"}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">
                @
              </span>
              <Input
                id="username"
                type="text"
                placeholder="operator_handle"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                  )
                }
                className="bg-zinc-900/90 border-zinc-800 text-white pl-8 placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl font-mono"
                required
                autoFocus
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Letters, numbers, and underscores only.
            </p>
          </div>

          <button
            type="submit"
            disabled={isBusy || !username.trim()}
            className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all mt-3 cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            {isBusy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Finalizing Profile...
              </span>
            ) : (
              <>
                <span>Enter Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </CardContent>

      <CardFooter className="text-center border-t border-zinc-800/80 pt-3 pb-4 px-6 sm:px-8 justify-center">
        <p className="text-[11px] text-zinc-500 font-mono">
          You can update your display name and handle anytime in settings.
        </p>
      </CardFooter>
    </Card>
  );
}

export default function ContinueSignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
          <span>Loading continuation form...</span>
        </div>
      }
    >
      <ContinueContent />
    </Suspense>
  );
}
