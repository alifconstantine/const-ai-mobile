import React, { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";
import { AuthenticateWithRedirectCallback } from "@clerk/react";

export default function SSOCallbackScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.replace("/");
      return;
    }

    // Fallback timer: If session activated, go home, else return to login
    const timeout = setTimeout(() => {
      if (isSignedIn) {
        router.replace("/");
      } else {
        router.replace("/login");
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoaded, isSignedIn, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#38bdf8" />
      <Text style={styles.text}>Menghubungkan akun ke Const AI...</Text>
      <Text style={styles.subtext}>Menyinkronkan sesi autentikasi dan database realtime</Text>
      {Platform.OS === "web" && (
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/"
          signUpForceRedirectUrl="/"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  text: {
    color: "#fafafa",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  subtext: {
    color: "#71717a",
    fontSize: 12,
    textAlign: "center",
    maxWidth: 280,
  },
});
