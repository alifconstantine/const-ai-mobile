"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useAuth } from "@clerk/nextjs";
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
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
} from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // If already signed in, go to dashboard
  useEffect(() => {
    if (isSignedIn) {
      router.push(redirectTarget);
    }
  }, [isSignedIn, redirectTarget, router]);

  // Handle Social OAuth (Google / GitHub)
  const handleOAuthSignIn = async (strategy: "oauth_google" | "oauth_github") => {
    if (!signIn) return;
    setErrorMessage("");
    setIsSocialLoading(strategy);

    try {
      const { error } = await signIn.sso({
        strategy,
        redirectUrl: redirectTarget,
        redirectCallbackUrl: "/sso-callback",
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("OAuth error:", err);
      setErrorMessage(
        err?.message || "Failed to initialize social sign-in. Please try again."
      );
      setIsSocialLoading(null);
    }
  };

  // Handle Email/Username + Password Sign In
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!signIn) return;
    if (!identifier.trim() || !password) {
      setErrorMessage("Please enter both your email/username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn.password({
        identifier: identifier.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl(redirectTarget);
            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      } else if (
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust"
      ) {
        setIsMfaStep(true);
        if (signIn.mfa) {
          await signIn.mfa.sendEmailCode();
        }
      } else {
        setErrorMessage("Authentication requires additional verification.");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      const msg =
        err?.message ||
        "Incorrect email/username or password. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle MFA / Verification Code Submission
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!signIn || !mfaCode.trim()) return;

    setIsLoading(true);
    try {
      if (signIn.mfa) {
        const { error } = await signIn.mfa.verifyTOTP({ code: mfaCode.trim() });
        if (error) throw error;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl(redirectTarget);
            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // One-Click Instant Demo Login
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

  const isBusy = isLoading || fetchStatus === "fetching";

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <Card className="w-full bg-zinc-950/85 border border-zinc-800/90 text-white shadow-2xl backdrop-blur-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center pb-2 pt-6 px-6 sm:px-8">
          <div className="w-12 h-12 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center p-2.5 shadow-xl ring-4 ring-white/10 transition-transform hover:scale-105">
            <ConstLogoIcon size="md" color="#000000" className="w-full h-full" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {isMfaStep ? "Two-Factor Authentication" : "Sign In to Const AI"}
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
            {isMfaStep
              ? "Enter the verification code to access your vault"
              : "Access your personal AI companion & developer control center"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6 sm:px-8 pt-2">
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/70 rounded-2xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {isMfaStep ? (
            /* ================= MFA SCREEN ================= */
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mfaCode" className="text-xs font-medium text-zinc-300">
                  Verification Code
                </Label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="mfaCode"
                    type="text"
                    placeholder="123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 pl-10 text-center font-mono tracking-widest text-lg focus-visible:ring-1 focus-visible:ring-zinc-400 h-11 rounded-xl"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy || mfaCode.length < 6}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 text-xs sm:text-sm"
              >
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMfaStep(false)}
                className="w-full text-center text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back to sign-in
              </button>
            </form>
          ) : (
            /* ================= STANDARD SIGN IN ================= */
            <>
              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("oauth_google")}
                  disabled={isSocialLoading !== null || isBusy}
                  className="w-full py-2.5 px-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSocialLoading === "oauth_google" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                      />
                    </svg>
                  )}
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("oauth_github")}
                  disabled={isSocialLoading !== null || isBusy}
                  className="w-full py-2.5 px-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSocialLoading === "oauth_github" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                    </svg>
                  )}
                  <span>GitHub</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-950 px-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider absolute">
                  or email / handle
                </span>
              </div>

              {/* Form inputs */}
              <form onSubmit={handlePasswordSignIn} className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="identifier"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Email or Username
                  </Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="operator@constai.platform"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="password"
                      className="text-xs font-medium text-zinc-300"
                    >
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl pr-10"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy || isSocialLoading !== null}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all mt-3 cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isBusy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-center border-t border-zinc-800/80 pt-3.5 pb-5 px-6 sm:px-8 space-y-2">
          <p className="text-xs text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-white font-medium hover:underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>

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
