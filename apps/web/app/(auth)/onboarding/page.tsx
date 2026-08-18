"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@const-ai/backend";
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
  Camera,
  Upload,
  Trash2,
  ArrowRight,
  Loader2,
  Sparkles,
  User,
  AlertCircle,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  let updateProfileMutation: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    updateProfileMutation = useMutation(api.users.updateProfile);
  } catch {
    // Fallback if Convex is in local offline mode
  }

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load existing session data if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sessionStr = localStorage.getItem("const_user_session");
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session.name) setFullName(session.name);
          if (session.email) setEmail(session.email);
          if (session.avatarUrl) setCustomAvatar(session.avatarUrl);

          const defaultUsername = session.username
            ? session.username
            : session.email
            ? session.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "")
            : session.name
            ? session.name.toLowerCase().replace(/\s+/g, "_")
            : "operator";
          setUsername(defaultUsername);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Compute Initials for Default Avatar
  const userInitials = React.useMemo(() => {
    if (fullName && fullName.trim().length > 0) {
      const parts = fullName.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim().length > 0) {
      return email.slice(0, 2).toUpperCase();
    }
    return "CA";
  }, [fullName, email]);

  // Handle custom image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomAvatar(event.target.result as string);
        setErrorMessage("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCustomAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!username.trim()) {
      setErrorMessage("Please choose a username.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();

      // Sync to Convex Auth user record if available
      if (updateProfileMutation) {
        try {
          await updateProfileMutation({
            name: fullName.trim(),
            username: cleanUsername,
            avatarUrl: customAvatar || undefined,
            initials: userInitials,
            onboardingCompleted: true,
          });
        } catch (convexErr) {
          console.warn("Convex Auth updateProfile notice:", convexErr);
        }
      }

      if (typeof window !== "undefined") {
        const sessionData = {
          name: fullName.trim(),
          username: cleanUsername,
          email: email || "operator@constai.platform",
          avatarUrl: customAvatar || null,
          initials: userInitials,
          isLoggedIn: true,
          onboardingCompleted: true,
          updatedAt: Date.now(),
        };
        localStorage.setItem("const_user_session", JSON.stringify(sessionData));
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save profile. Please try again.");
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
          Complete Your Profile
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
          Set up your identity and avatar for your Const AI companion
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-6 sm:px-8 pt-2">
        {errorMessage && (
          <div className="p-3 bg-red-950/60 border border-red-800/70 rounded-2xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleComplete} className="space-y-4">
          {/* ================= AVATAR SECTION ================= */}
          <div className="flex flex-col items-center justify-center space-y-3 py-1">
            <div className="relative group">
              {customAvatar ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/80 shadow-xl ring-4 ring-white/10">
                  <img
                    src={customAvatar}
                    alt="Uploaded Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                /* Default Initials Avatar */
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-700 border-2 border-zinc-600 flex items-center justify-center text-white text-xl font-bold font-mono shadow-xl ring-4 ring-white/5 select-none">
                  {userInitials}
                </div>
              )}

              {/* Upload Trigger overlay icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Upload / Reset Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3 text-zinc-400" />
                <span>Upload Image</span>
              </button>

              {customAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Use Initials</span>
                </button>
              )}
            </div>
          </div>

          {/* ================= USERNAME & FULL NAME ================= */}
          <div className="space-y-3.5 pt-1">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-medium text-zinc-300">
                Full Name
              </Label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Alif Constantine"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-zinc-900/90 border-zinc-800 text-white placeholder:text-zinc-500 pl-10 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Username */}
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
                  placeholder="alif_constantine"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                    )
                  }
                  className="bg-zinc-900/90 border-zinc-800 text-white pl-8 placeholder:text-zinc-500 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-zinc-400 h-10 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !fullName.trim() || !username.trim()}
            className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-full py-2.5 h-10 transition-all mt-4 cursor-pointer shadow-md flex items-center justify-center gap-2 hover:shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Profile to Vault...
              </span>
            ) : (
              <>
                <span>Enter Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="text-center border-t border-zinc-800/80 pt-3.5 pb-5 px-6 sm:px-8 justify-center">
        <p className="text-[11px] text-zinc-500 font-mono">
          All settings can be modified anytime in your Control Center Settings.
        </p>
      </CardFooter>
    </Card>
  );
}
