import React, { useEffect } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function SSOCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#38bdf8" />
      <Text style={styles.text}>Menghubungkan akun...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  text: {
    color: "#a1a1aa",
    fontSize: 14,
    fontWeight: "500",
  },
});
