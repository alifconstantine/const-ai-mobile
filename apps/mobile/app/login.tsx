import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  Bot,
  Zap,
  ShieldCheck,
  Smartphone,
  Globe,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
} from "lucide-react-native";
import { useSSO, useAuth } from "@clerk/expo";

// Handle completed authentication sessions immediately
WebBrowser.maybeCompleteAuthSession();

// Warm up the browser on Android to reduce authentication load times
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function LoginScreen() {
  useWarmUpBrowser();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { startSSOFlow } = useSSO();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto redirect to "/" if user is already signed in
  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.href = "/";
      } else {
        router.replace("/");
      }
    }
  }, [isAuthLoaded, isSignedIn, router]);

  const getRedirectUrl = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return `${window.location.origin}/sso-callback`;
    }
    return AuthSession.makeRedirectUri({
      scheme: "constai",
      path: "sso-callback",
    });
  };

  // Single Web-Based OAuth SSO Flow (Google)
  const handleWebAuth = async () => {
    setErrorMessage("");
    setIsLoading(true);
    try {
      const redirectUrl = getRedirectUrl();
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.location.href = "/";
        } else {
          router.replace("/");
        }
      }
    } catch (err: any) {
      if (
        err?.code === "ERR_CANCELED" ||
        err?.code === "SIGN_IN_CANCELLED" ||
        err?.message?.includes("cancelled") ||
        err?.message?.includes("dismissed")
      ) {
        setIsLoading(false);
        return;
      }

      console.error("SSO sign-in error:", err);
      setErrorMessage(
        err?.errors?.[0]?.message ||
          err?.message ||
          "Gagal menghubungkan akun. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthLoaded || isSignedIn) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.redirectText}>Memuat sesi Const AI...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Brand Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoGlow} />
            <View style={styles.logoIconCircle}>
              <Bot size={36} color="#38bdf8" />
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

        {/* Single Auth Action Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Sparkles size={20} color="#38bdf8" />
            </View>
            <View style={styles.cardHeaderTexts}>
              <Text style={styles.cardTitle}>Akses Platform Terpadu</Text>
              <Text style={styles.cardDescription}>
                Pilih akun Google Anda di browser web untuk menyinkronkan chat, model AI, dan workspace secara realtime.
              </Text>
            </View>
          </View>

          {/* Benefits Feature Checklist */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureDot}>
                <Globe size={13} color="#38bdf8" />
              </View>
              <View style={styles.featureItemContent}>
                <Text style={styles.featureItemTitle}>Pilihan Akun di Browser Web</Text>
                <Text style={styles.featureItemDesc}>
                  Pilih akun Google mana yang ingin Anda gunakan langsung di browser.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureDot}>
                <Layers size={13} color="#22c55e" />
              </View>
              <View style={styles.featureItemContent}>
                <Text style={styles.featureItemTitle}>Sinkronisasi Realtime 100%</Text>
                <Text style={styles.featureItemDesc}>
                  Data di mobile dan web dashboard langsung terhubung via Convex.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureDot}>
                <Lock size={13} color="#f59e0b" />
              </View>
              <View style={styles.featureItemContent}>
                <Text style={styles.featureItemTitle}>Keamanan Terverifikasi</Text>
                <Text style={styles.featureItemDesc}>
                  Enkripsi token sesi dengan SecureStore & Convex JWT Auth.
                </Text>
              </View>
            </View>
          </View>

          {/* The Single Primary Action Button */}
          <TouchableOpacity
            style={[styles.btnPrimary, isLoading && styles.btnPrimaryLoading]}
            onPress={handleWebAuth}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <View style={styles.btnLoadingContent}>
                <ActivityIndicator size="small" color="#09090b" />
                <Text style={styles.btnPrimaryText}>Membuka Browser Web...</Text>
              </View>
            ) : (
              <View style={styles.btnContent}>
                <Globe size={18} color="#09090b" />
                <Text style={styles.btnPrimaryText}>Sign In / Sign Up with Web</Text>
                <ArrowRight size={18} color="#09090b" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <ShieldCheck size={12} color="#52525b" />
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
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  redirectText: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "500",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadgeContainer: {
    position: "relative",
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(56, 189, 248, 0.22)",
    transform: [{ scale: 1.2 }],
  },
  logoIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#18181b",
    borderWidth: 1.5,
    borderColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fafafa",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 12.5,
    color: "#a1a1aa",
    textAlign: "center",
    maxWidth: 290,
    lineHeight: 18,
    marginBottom: 14,
  },
  featurePillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  featurePillText: {
    fontSize: 10.5,
    fontWeight: "500",
    color: "#d4d4d8",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#f87171",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 17,
  },
  card: {
    backgroundColor: "#121215",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e24",
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#18181c",
    borderWidth: 1,
    borderColor: "#27272f",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  cardHeaderTexts: {
    flex: 1,
  },
  cardTitle: {
    color: "#fafafa",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    color: "#a1a1aa",
    fontSize: 12,
    lineHeight: 16.5,
  },
  featureList: {
    gap: 14,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#18181c",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  featureItemContent: {
    flex: 1,
  },
  featureItemTitle: {
    color: "#e4e4e7",
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  featureItemDesc: {
    color: "#71717a",
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  btnPrimary: {
    backgroundColor: "#38bdf8",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnPrimaryLoading: {
    opacity: 0.85,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  btnLoadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrimaryText: {
    color: "#09090b",
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  footerNote: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerNoteText: {
    color: "#52525b",
    fontSize: 10.5,
  },
});
