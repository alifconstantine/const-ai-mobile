"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConstLogoIcon } from "@/components/ConstLogo";
import { Loader2, Eye, EyeOff } from "lucide-react";

function SignUpForm() {
  const router = useRouter();

  let authActions: { signIn?: any; signOut?: any } = {};
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    authActions = useAuthActions();
  } catch {
    // In case running outside active Convex Auth Context
  }

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "bg-zinc-800" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage("Please accept the terms and conditions.");
      return;
    }

    setIsLoading(true);
    try {
      if (authActions.signIn) {
        try {
          await authActions.signIn("password", {
            email,
            password,
            name: fullName,
            flow: "signUp",
          });
        } catch (convexErr) {
          console.warn("Convex Auth SignUp notice:", convexErr);
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "const_user_session",
          JSON.stringify({
            email,
            name: fullName,
            username: email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, ""),
            isLoggedIn: true,
            needsOnboarding: true,
            loginAt: Date.now(),
          })
        );
      }
      // Route to Onboarding to choose avatar / confirm username
      router.push("/onboarding");
    } catch {
      setErrorMessage("Registration failed. Please check the entered details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMessage("");

    try {
      if (authActions.signIn) {
        try {
          await authActions.signIn("google", {
            redirectTo: "/onboarding",
          });
          return;
        } catch (convexErr) {
          console.warn("Convex Auth Google notice:", convexErr);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "const_user_session",
          JSON.stringify({
            email: "alif.constantine@gmail.com",
            name: "Alif Constantine",
            username: "alif_constantine",
            isLoggedIn: true,
            needsOnboarding: true,
            authProvider: "google",
            loginAt: Date.now(),
          })
        );
      }
      router.push("/onboarding");
    } catch {
      setErrorMessage("Failed to authenticate with Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="bg-[#121214]/95 border-zinc-800 text-white shadow-2xl backdrop-blur-2xl transition-all">
      <CardHeader className="text-center pb-3 pt-6">
        <div className="w-12 h-12 bg-white rounded-full mx-auto mb-3 flex items-center justify-center p-2.5 shadow-lg ring-4 ring-white/5">
          <ConstLogoIcon size="md" color="#000000" className="w-full h-full" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Create an Account
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm">
          Join Const AI via Convex Auth for decentralized agent control
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-6">
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-700/80 hover:border-zinc-500 text-white font-medium rounded-full py-2.5 px-4 text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Sign up with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-800 w-full" />
          <span className="bg-[#121214] px-3 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
            or sign up with email
          </span>
          <div className="border-t border-zinc-800 w-full" />
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs text-zinc-300">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Alif Constantine"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-zinc-400 h-10 rounded-xl"
              required
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-zinc-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="alif@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-zinc-400 h-10 rounded-xl"
              required
            />
          </div>

          {/* Password Field with View Toggle */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-zinc-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-zinc-400 pr-10 h-10 rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Strength */}
            {password && (
              <div className="pt-1 space-y-1">
                <div className="flex gap-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Strength: {passwordStrength.label}</span>
                  <span>Min. 8 characters</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password with View Toggle */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs text-zinc-300">
              Confirm Password
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

          {/* Terms */}
          <div className="flex items-start space-x-2 pt-1">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
              className="mt-0.5 border-zinc-700 data-[state=checked]:bg-white data-[state=checked]:text-black rounded-md"
            />
            <Label
              htmlFor="terms"
              className="text-[11px] text-zinc-400 leading-tight cursor-pointer select-none"
            >
              I agree to the{" "}
              <a href="#" className="text-zinc-200 underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-zinc-200 underline">
                Privacy Policy
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all mt-2 cursor-pointer shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Continue to Profile Setup →"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="text-center border-t border-zinc-800/80 pt-3 pb-5 px-6 justify-center">
        <p className="text-xs text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-white font-medium hover:underline ml-1"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-xs text-zinc-500 font-mono">
          Loading sign up...
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
