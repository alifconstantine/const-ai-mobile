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
  User,
  ArrowRight,
  Sparkles,
  Smartphone,
} from "lucide-react-native";
import { useNavigation } from "../context/NavigationContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loginWithDevAccount, loginWithCredentials, isAuthLoading } =
    useNavigation();

  const [email, setEmail] = useState("alif@constai.platform");
  const [name, setName] = useState("Alif Constantine");
  const [username, setUsername] = useState("alif");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingDev, setIsLoadingDev] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);

  const handleDevLogin = async () => {
    setErrorMessage("");
    setIsLoadingDev(true);
    try {
      const success = await loginWithDevAccount();
      if (success) {
        router.replace("/");
      } else {
        setErrorMessage("Gagal masuk dengan akun dev default. Periksa koneksi backend Convex.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat login");
    } finally {
      setIsLoadingDev(false);
    }
  };

  const handleCustomLogin = async () => {
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Masukkan alamat email yang valid");
      return;
    }
    setErrorMessage("");
    setIsLoadingCustom(true);
    try {
      const success = await loginWithCredentials(
        email.trim(),
        name.trim() || undefined,
        username.trim() || undefined
      );
      if (success) {
        router.replace("/");
      } else {
        setErrorMessage("Gagal masuk dengan akun tersebut. Coba lagi.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat login");
    } finally {
      setIsLoadingCustom(false);
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
          <Text style={styles.brandTitle}>Const AI Mobile</Text>
          <Text style={styles.brandSubtitle}>
            Autonomous On-Device Agent & Productivity Engine
          </Text>

          <View style={styles.featurePillsRow}>
            <View style={styles.featurePill}>
              <Zap size={11} color="#38bdf8" />
              <Text style={styles.featurePillText}>Multi-LLM</Text>
            </View>
            <View style={styles.featurePill}>
              <ShieldCheck size={11} color="#22c55e" />
              <Text style={styles.featurePillText}>Safety HITL</Text>
            </View>
            <View style={styles.featurePill}>
              <Smartphone size={11} color="#f59e0b" />
              <Text style={styles.featurePillText}>Native Fast-Path</Text>
            </View>
          </View>
        </View>

        {/* Error Alert */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Card Form */}
        <View style={styles.card}>
          {/* Quick 1-Click Dev Sign-in */}
          <View style={styles.devSection}>
            <View style={styles.devHeader}>
              <Sparkles size={14} color="#38bdf8" />
              <Text style={styles.devSectionTitle}>Quick Dev Access</Text>
              <View style={styles.devBadge}>
                <Text style={styles.devBadgeText}>RECOMMENDED</Text>
              </View>
            </View>
            <Text style={styles.devDesc}>
              Masuk instan sebagai Developer Operator dengan profil dan BYOK API keys yang sudah terkonfigurasi di Convex.
            </Text>

            <TouchableOpacity
              style={styles.btnDevLogin}
              onPress={handleDevLogin}
              disabled={isLoadingDev || isLoadingCustom || isAuthLoading}
              activeOpacity={0.8}
            >
              {isLoadingDev ? (
                <ActivityIndicator size="small" color="#09090b" />
              ) : (
                <>
                  <Text style={styles.btnDevLoginText}>Continue as Alif Constantine</Text>
                  <ArrowRight size={16} color="#09090b" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SIGN IN WITH CUSTOM ACCOUNT</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Custom Form Toggle & Inputs */}
          {!isCustomMode ? (
            <TouchableOpacity
              style={styles.btnToggleCustom}
              onPress={() => setIsCustomMode(true)}
            >
              <Mail size={14} color="#a1a1aa" />
              <Text style={styles.btnToggleCustomText}>Masuk dengan Email / Akun Lain</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.customForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="nama@domain.com"
                    placeholderTextColor="#52525b"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Alif Constantine"
                    placeholderTextColor="#52525b"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username Handle</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.atPrefix}>@</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="alif"
                    placeholderTextColor="#52525b"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.btnCustomLogin}
                onPress={handleCustomLogin}
                disabled={isLoadingDev || isLoadingCustom || isAuthLoading}
                activeOpacity={0.8}
              >
                {isLoadingCustom ? (
                  <ActivityIndicator size="small" color="#fafafa" />
                ) : (
                  <>
                    <Text style={styles.btnCustomLoginText}>Sign In & Synchronize</Text>
                    <ArrowRight size={16} color="#fafafa" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Const AI Platform • End-to-End Encrypted & Synced with Convex Backend
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(56, 189, 248, 0.25)",
    transform: [{ scale: 1.15 }],
  },
  logoIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: 12.5,
    color: "#a1a1aa",
    textAlign: "center",
    maxWidth: 280,
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
    gap: 4,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 8,
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
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
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
  devSection: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 12,
    padding: 14,
  },
  devHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  devSectionTitle: {
    color: "#fafafa",
    fontSize: 13.5,
    fontWeight: "600",
    flex: 1,
  },
  devBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  devBadgeText: {
    color: "#38bdf8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  devDesc: {
    color: "#a1a1aa",
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },
  btnDevLogin: {
    backgroundColor: "#38bdf8",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDevLoginText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 16,
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
  btnToggleCustom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    paddingVertical: 10,
  },
  btnToggleCustomText: {
    color: "#d4d4d8",
    fontSize: 12.5,
    fontWeight: "500",
  },
  customForm: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: "#a1a1aa",
    fontSize: 11,
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
  atPrefix: {
    color: "#71717a",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    color: "#fafafa",
    fontSize: 13,
    padding: 0,
  },
  btnCustomLogin: {
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
  btnCustomLoginText: {
    color: "#fafafa",
    fontSize: 13,
    fontWeight: "600",
  },
  footerNote: {
    marginTop: 20,
    alignItems: "center",
  },
  footerNoteText: {
    color: "#52525b",
    fontSize: 10.5,
    textAlign: "center",
  },
});
