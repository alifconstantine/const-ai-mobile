import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationProvider } from "../context/NavigationContext";

const convexUrl =
  process.env.EXPO_PUBLIC_CONVEX_URL || "https://dummy-convex-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const styleId = "const-ai-web-reset";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          * {
            outline: none !important;
            -webkit-tap-highlight-color: transparent;
            box-sizing: border-box;
          }
          *:focus, *:focus-visible, input:focus, textarea:focus, select:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          html, body, #root {
            background-color: #09090b !important;
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
          }
          input, textarea {
            user-select: auto;
            -webkit-user-select: auto;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ConvexProvider client={convex}>
        <NavigationProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#09090b" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
          </Stack>
        </NavigationProvider>
      </ConvexProvider>
    </SafeAreaProvider>
  );
}
