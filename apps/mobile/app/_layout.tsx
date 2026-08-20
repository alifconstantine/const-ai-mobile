import React, { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { NavigationProvider } from "../context/NavigationContext";
import { tokenCache } from "../services/auth/tokenCache";

// Handle any pending auth sessions on web/native redirects
WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

function resolveConvexUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (envUrl && !envUrl.includes("127.0.0.1") && !envUrl.includes("localhost")) {
    return envUrl;
  }
  // Full production & mobile cloud instance
  return "https://polished-parrot-102.convex.cloud";
}


export default function RootLayout() {
  const convex = useMemo(() => new ConvexReactClient(resolveConvexUrl()), []);

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
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
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
              <Stack.Screen name="sso-callback" />
            </Stack>
          </NavigationProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
