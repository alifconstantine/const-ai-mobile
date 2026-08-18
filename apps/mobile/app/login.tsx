import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bot,
  Zap,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  Globe,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react-native";
import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { startSSOFlow } = useSSO();
  const { signIn, errors: signInErrors, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpFetchStatus } = useSignUp();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);

  // Google SSO Auth
  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setIsLoadingGoogle(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED" || err?.code === "SIGN_IN_CANCELLED") {
        return;
      }
      console.error("Google sign-in error:", err);
      setErrorMessage(
        err?.errors?.[0]?.message ||
          err?.message ||
          "Gagal masuk dengan Google. Coba lagi."
      );
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // GitHub SSO Auth
  const handleGithubSignIn = async () => {
    setErrorMessage("");
    setIsLoadingGithub(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_github",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED" || err?.code === "SIGN_IN_CANCELLED") {
        return;
      }
      console.error("GitHub sign-in error:", err);
      setErrorMessage(
        err?.errors?.[0]?.message ||
          err?.message ||
          "Gagal masuk dengan GitHub. Coba lagi."
      );
    } finally {
      setIsLoadingGithub(false);
    }
  };

  // Email + Password Sign In
  const handleEmailSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("Masukkan email dan password");
      return;
    }

    setErrorMessage("");
    setIsLoadingEmail(true);
    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Email atau password salah.");
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => router.replace("/"),
        });
      } else {
        setErrorMessage("Autentikasi belum lengkap. Periksa status akun Anda.");
      }
    } catch (err: any) {
      console.error("Email sign-in error:", err);
      setErrorMessage(
        err?.message ||
          "Terjadi kesalahan saat masuk dengan email."
      );
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // Email + Password Sign Up
  const handleEmailSignUp = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("Masukkan email dan password baru");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password minimal 8 karakter");
      return;
    }

    setErrorMessage("");
    setIsLoadingEmail(true);
    try {
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Gagal mendaftarkan akun.");
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: () => router.replace("/"),
        });
      } else if (signUp.status === "missing_requirements") {
        await signUp.verifications.sendEmailCode();
        setPendingVerification(true);
      }
    } catch (err: any) {
      console.error("Sign-up error:", err);
      setErrorMessage(
        err?.message ||
          "Gagal mendaftarkan akun baru."
      );
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // Verify Email Code
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setErrorMessage("Masukkan kode verifikasi 6 digit");
      return;
    }

    setErrorMessage("");
    setIsLoadingEmail(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode.trim(),
      });

      if (error) {
        setErrorMessage(error.message || "Kode verifikasi tidak valid.");
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: () => router.replace("/"),
        });
      } else {
        setErrorMessage("Verifikasi belum selesai. Coba masukkan kode kembali.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setErrorMessage(
        err?.message ||
          "Kode verifikasi tidak valid atau telah kedaluwarsa."
      );
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // Open Web Login in Browser
  const handleOpenWebLogin = async () => {
    try {
      const frontendApi =
        process.env.EXPO_PUBLIC_CLERK_FRONTEND_API_URL ||
        "https://natural-lemming-4644.clerk.accounts.dev";
      const webUrl = `${frontendApi}/sign-in?redirect_url=constai://sso-callback`;
      await WebBrowser.openAuthSessionAsync(webUrl, "constai://sso-callback");
    } catch (err) {
      console.warn("Web login browser error:", err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Brand Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoGlow} />
            <View style={styles.logoIconCircle}>
              <Bot size={34} color="#38bdf8" />
            </View>
          </View>
          <Text style={styles.brandTitle}>Const AI</Text>
          <Text style={styles.brandSubtitle}>
            Autonomous Multi-LLM Agent & On-Device Engine
          </Text>

          <View style={styles.featurePillsRow}>
            <View style={styles.featurePill}>
              <Zap size={11} color="#38bdf8" />
              <Text style={styles.featurePillText}>Clerk Unified</Text>
            </View>
            <View style={styles.featurePill}>
              <ShieldCheck size={11} color="#22c55e" />
              <Text style={styles.featurePillText}>Convex Realtime</Text>
            </View>
            <View style={styles.featurePill}>
              <Smartphone size={11} color="#f59e0b" />
              <Text style={styles.featurePillText}>Native Sync</Text>
            </View>
          </View>
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Auth Card */}
        <View style={styles.card}>
          {/* SSO Web OAuth Buttons */}
          <View style={styles.ssoSection}>
            <Text style={styles.sectionLabel}>MASUK DENGAN AKUN WEB</Text>

            {/* Google SSO */}
            <TouchableOpacity
              style={styles.btnGoogle}
              onPress={handleGoogleSignIn}
              disabled={isLoadingGoogle || isLoadingGithub || isLoadingEmail}
              activeOpacity={0.8}
            >
              {isLoadingGoogle ? (
                <ActivityIndicator size="small" color="#09090b" />
              ) : (
                <>
                  <Globe size={18} color="#09090b" />
                  <Text style={styles.btnGoogleText}>Continue with Google</Text>
                  <ArrowRight size={16} color="#09090b" />
                </>
              )}
            </TouchableOpacity>

            {/* GitHub SSO */}
            <TouchableOpacity
              style={styles.btnGithub}
              onPress={handleGithubSignIn}
              disabled={isLoadingGoogle || isLoadingGithub || isLoadingEmail}
              activeOpacity={0.8}
            >
              {isLoadingGithub ? (
                <ActivityIndicator size="small" color="#fafafa" />
              ) : (
                <>
                  <KeyRound size={16} color="#a1a1aa" />
                  <Text style={styles.btnGithubText}>Continue with GitHub</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU EMAIL & PASSWORD</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tab Selector: Sign In vs Sign Up */}
          {!pendingVerification && (
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tabBtn, authMode === "signin" && styles.tabBtnActive]}
                onPress={() => {
                  setAuthMode("signin");
                  setErrorMessage("");
                }}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    authMode === "signin" && styles.tabBtnTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, authMode === "signup" && styles.tabBtnActive]}
                onPress={() => {
                  setAuthMode("signup");
                  setErrorMessage("");
                }}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    authMode === "signup" && styles.tabBtnTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Email / Password Form */}
          {!pendingVerification ? (
            <View style={styles.formGroup}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="nama@email.com"
                    placeholderTextColor="#52525b"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor="#52525b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color="#a1a1aa" />
                    ) : (
                      <Eye size={16} color="#a1a1aa" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bot Protection mount point for Clerk */}
              <View nativeID="clerk-captcha" />

              <TouchableOpacity
                style={styles.btnSubmit}
                onPress={authMode === "signin" ? handleEmailSignIn : handleEmailSignUp}
                disabled={isLoadingEmail || isLoadingGoogle || isLoadingGithub}
                activeOpacity={0.8}
              >
                {isLoadingEmail ? (
                  <ActivityIndicator size="small" color="#fafafa" />
                ) : (
                  <>
                    <Text style={styles.btnSubmitText}>
                      {authMode === "signin" ? "Sign In to Const AI" : "Register Account"}
                    </Text>
                    <ArrowRight size={16} color="#fafafa" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* OTP Verification Code Form */
            <View style={styles.formGroup}>
              <View style={styles.otpHeader}>
                <Sparkles size={16} color="#38bdf8" />
                <Text style={styles.otpTitle}>Verifikasi Email</Text>
              </View>
              <Text style={styles.otpDesc}>
                Kode verifikasi 6 digit telah dikirim ke {email}.
              </Text>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Kode Verifikasi</Text>
                <View style={styles.inputWrapper}>
                  <KeyRound size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { letterSpacing: 4, fontWeight: "700" }]}
                    placeholder="123456"
                    placeholderTextColor="#52525b"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.btnSubmit}
                onPress={handleVerifyCode}
                disabled={isLoadingEmail}
                activeOpacity={0.8}
              >
                {isLoadingEmail ? (
                  <ActivityIndicator size="small" color="#fafafa" />
                ) : (
                  <Text style={styles.btnSubmitText}>Verifikasi & Masuk</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnBack}
                onPress={() => setPendingVerification(false)}
              >
                <Text style={styles.btnBackText}>← Kembali ke Form</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Web Browser Direct Portal Button */}
          <TouchableOpacity
            style={styles.btnWebFallback}
            onPress={handleOpenWebLogin}
            activeOpacity={0.7}
          >
            <Globe size={13} color="#71717a" />
            <Text style={styles.btnWebFallbackText}>
              Buka Halaman Login di Web Browser
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Secured by Clerk Authentication & Realtime Convex Synced
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBadgeContainer: {
    position: "relative",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(56, 189, 248, 0.25)",
    transform: [{ scale: 1.15 }],
  },
  logoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#18181b",
    borderWidth: 1.5,
    borderColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fafafa",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 16,
    marginBottom: 12,
  },
  featurePillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#d4d4d8",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: "#f87171",
    fontSize: 12,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  ssoSection: {
    gap: 8,
  },
  sectionLabel: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  btnGoogle: {
    backgroundColor: "#38bdf8",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnGoogleText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  btnGithub: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnGithubText: {
    color: "#e4e4e7",
    fontSize: 12.5,
    fontWeight: "500",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#27272a",
  },
  dividerText: {
    color: "#71717a",
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#18181b",
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: "#27272a",
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#71717a",
  },
  tabBtnTextActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  formGroup: {
    gap: 10,
  },
  inputBlock: {
    gap: 4,
  },
  inputLabel: {
    color: "#a1a1aa",
    fontSize: 10.5,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: "#fafafa",
    fontSize: 13,
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  btnSubmit: {
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  btnSubmitText: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  otpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  otpTitle: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  otpDesc: {
    color: "#a1a1aa",
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 4,
  },
  btnBack: {
    alignItems: "center",
    paddingVertical: 4,
  },
  btnBackText: {
    color: "#71717a",
    fontSize: 11.5,
  },
  btnWebFallback: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1f1f23",
  },
  btnWebFallbackText: {
    color: "#71717a",
    fontSize: 11,
  },
  footerNote: {
    marginTop: 16,
    alignItems: "center",
  },
  footerNoteText: {
    color: "#52525b",
    fontSize: 10,
    textAlign: "center",
  },
});
