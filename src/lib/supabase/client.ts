import "react-native-url-polyfill/auto";

import * as SecureStore from "expo-secure-store";
import { AppState, type AppStateStatus } from "react-native";
import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseEnvironment } from "./environment";

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

let supabaseClient: SupabaseClient | null = null;
let appStateListenerStarted = false;

function startSessionRefresh(client: SupabaseClient): void {
  if (appStateListenerStarted) {
    return;
  }

  appStateListenerStarted = true;
  AppState.addEventListener("change", (nextState: AppStateStatus) => {
    if (nextState === "active") {
      client.auth.startAutoRefresh();
      return;
    }

    client.auth.stopAutoRefresh();
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { anonKey, url } = requireSupabaseEnvironment();
  supabaseClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
      persistSession: true,
      storage: secureStorage,
    },
  });
  startSessionRefresh(supabaseClient);

  return supabaseClient;
}
