import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  appThemes,
  defaultAppThemeId,
  isAppThemeId,
  type AppTheme,
  type AppThemeId,
} from "./app-theme";

export const appThemeStorageKey = "mangalya:wedding-card-theme:v1";

type AppThemeState = {
  errorMessage?: string;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  isHydrating: boolean;
  isSaving: boolean;
  selectTheme: (themeId: AppThemeId) => Promise<void>;
  themeId: AppThemeId;
};

const initialAppThemeState = {
  errorMessage: undefined,
  hasHydrated: false,
  isHydrating: false,
  isSaving: false,
  themeId: defaultAppThemeId,
} satisfies Pick<
  AppThemeState,
  "errorMessage" | "hasHydrated" | "isHydrating" | "isSaving" | "themeId"
>;

export const useAppThemeStore = create<AppThemeState>((set, get) => ({
  ...initialAppThemeState,
  hydrate: async () => {
    if (get().hasHydrated || get().isHydrating) return;

    set({ errorMessage: undefined, isHydrating: true });
    try {
      const storedThemeId = await AsyncStorage.getItem(appThemeStorageKey);
      set({ themeId: isAppThemeId(storedThemeId) ? storedThemeId : defaultAppThemeId });
    } catch {
      set({
        errorMessage:
          "Your saved application theme could not be loaded. Choose a theme to try again.",
      });
    } finally {
      set({ hasHydrated: true, isHydrating: false });
    }
  },
  selectTheme: async (themeId) => {
    const previousThemeId = get().themeId;
    if (get().isSaving || (themeId === previousThemeId && !get().errorMessage)) return;

    set({ errorMessage: undefined, isSaving: true, themeId });
    try {
      await AsyncStorage.setItem(appThemeStorageKey, themeId);
    } catch (error) {
      set({
        errorMessage:
          "Your application theme could not be saved. The previous theme is still active.",
        themeId: previousThemeId,
      });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },
}));

export const useAppTheme = (): AppTheme => {
  const themeId = useAppThemeStore((state) => state.themeId);
  return appThemes[themeId];
};

export const resetAppThemeStoreForTests = () => {
  useAppThemeStore.setState(initialAppThemeState);
};
