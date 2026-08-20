import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface TokenCache {
  getToken: (key: string) => Promise<string | null | undefined>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => Promise<void>;
}

// In-memory fallback in case SecureStore is unavailable in non-native or testing environments
const memoryCache = new Map<string, string>();




export const tokenCache: TokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          return localStorage.getItem(key);
        }
        return memoryCache.get(key) || null;
      }
      const item = await SecureStore.getItemAsync(key);
      return item || memoryCache.get(key) || null;
    } catch (err) {
      console.warn("SecureStore get token error, falling back to memory:", err);
      return memoryCache.get(key) || null;
    }
  },

  async saveToken(key: string, value: string): Promise<void> {
    try {
      memoryCache.set(key, value);
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn("SecureStore save token error, cached in memory:", err);
    }
  },

  async clearToken(key: string): Promise<void> {
    try {
      memoryCache.delete(key);
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

