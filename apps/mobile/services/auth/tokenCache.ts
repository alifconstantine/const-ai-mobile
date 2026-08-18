import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          return localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn("SecureStore get token error:", err);
      return null;
    }
  },

  async saveToken(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn("SecureStore save token error:", err);
    }
  },

  async clearToken(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn("SecureStore clear token error:", err);
    }
  },
};
