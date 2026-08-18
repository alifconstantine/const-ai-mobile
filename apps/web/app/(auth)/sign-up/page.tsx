"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
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
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

function SignUpContent() {
  const router = useRouter();
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();

  // Form State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification State
  const [verifying, setVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // If already signed in, go to dashboard
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Social Sign Up (Google / GitHub)
  const handleOAuthSignUp = async (strategy: "oauth_google" | "oauth_github") => {
    if (!signUp) return;
    setErrorMessage("");
    setIsSocialLoading(strategy);

    try {
      const { error } = await signUp.sso({
        strategy,
        redirectUrl: "/dashboard",
        redirectCallbackUrl: "/sso-callback",
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("OAuth sign-up error:", err);
      setErrorMessage(
        err?.message || "Failed to initialize social sign-up."
      );
      setIsSocialLoading(null);
    }
  };

  // Step 1: Submit Form to Create Account & Request OTP
  const handleSubmitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!signUp) return;

    const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
    if (!fullName.trim()) {
      setErrorMessage("Please enter your display name.");
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage("Username must be at least 3 characters long.");
      return;
    }
    if (!emailAddress.trim() || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      const parts = fullName.trim().split(" ");
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

      // 1. Create Clerk sign-up object with real username and name
      const { error: signUpError } = await signUp.password({
        emailAddress: emailAddress.trim(),
        password,
        username: cleanUsername,
        firstName,
        lastName,
      });

      if (signUpError) {
        throw signUpError;
      }

      // 2. Trigger Email Verification Code
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        throw sendError;
      }

      setVerifying(true);
      setResendCooldown(30);
      setSuccessNotice(`Verification code sent to ${emailAddress}`);
    } catch (err: any) {
      console.error("Sign-up error:", err);
      const msg =
        err?.message ||
        "Registration failed. Please check your credentials.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Finalize Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!signUp || !otpCode.trim()) return;

    setIsLoading(true);

    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code: otpCode.trim(),
      });

      if (verifyError) {
        throw verifyError;
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
      } else if (signUp.status === "missing_requirements") {
        // If additional requirements remain, forward to continue page
        router.push("/sign-up/continue");
      } else {
        setErrorMessage("Verification incomplete. Please retry or request a new code.");
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      const msg =
        err?.message ||
        "Invalid verification code. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP Code Handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !signUp) return;
    setErrorMessage("");
    setSuccessNotice("");

    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) throw error;
      setResendCooldown(30);
      setSuccessNotice("New verification code dispatched!");
    } catch (err: any) {
      setErrorMessage("Could not resend code. Please try again.");
    }
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
            {verifying ? "Verify Your Email" : "Create Your Account"}
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
            {verifying
              ? `Enter the 6-digit code sent to ${emailAddress}`
              : "Register your developer identity and AI companion vault"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6 sm:px-8 pt-2">
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/70 rounded-2xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/70 rounded-2xl text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successNotice}</span>
            </div>
          )}

          {verifying ? (
            /* ================= OTP VERIFICATION SCREEN ================= */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otpCode" className="text-xs font-medium text-zinc-300">
                  6-Digit Verification Code
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="otpCode"
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 pl-10 text-center font-mono tracking-widest text-lg focus-visible:ring-1 focus-visible:ring-zinc-400 h-11 rounded-xl"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy || otpCode.length < 6}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 text-xs sm:text-sm"
              >
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing Registration...
                  </span>
                ) : (
                  <>
                    <span>Verify & Enter Control Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend and Edit Actions */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setVerifying(false)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Edit details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend code"}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= SIGN UP FORM ================= */
            <>
              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuthSignUp("oauth_google")}
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
                  onClick={() => handleOAuthSignUp("oauth_github")}
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
                  or register with email
                </span>
              </div>

              {/* Sign Up Fields */}
              <form onSubmit={handleSubmitSignUp} className="space-y-3 pt-1">
                {/* Full Name & Username grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label
                      htmlFor="fullName"
                      className="text-xs font-medium text-zinc-300"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Alif Constantine"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-9.5 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="username"
                      className="text-xs font-medium text-zinc-300 flex justify-between"
                    >
                      <span>Username</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        @{username || "handle"}
                      </span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">
                        @
                      </span>
                      <Input
                        id="username"
                        type="text"
                        placeholder="operator"
                        value={username}
                        onChange={(e) =>
                          setUsername(
                            e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                          )
                        }
                        className="bg-zinc-900/90 border-zinc-800 text-white pl-7 placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-9.5 rounded-xl font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label
                    htmlFor="emailAddress"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    placeholder="operator@constai.platform"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-9.5 rounded-xl"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-9.5 rounded-xl pr-10"
                      required
                      minLength={8}
                      autoComplete="new-password"
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

                {/* Submit Button */}

                <button
                  type="submit"
                  disabled={isBusy || isSocialLoading !== null}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all mt-3 cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isBusy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <span>Continue with Verification</span>
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
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-white font-medium hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
          <span>Loading registration vault...</span>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
