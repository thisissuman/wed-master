import { type PropsWithChildren, useEffect, useMemo } from "react";
import { Appearance, View } from "react-native";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { colorScheme, vars } from "nativewind";

import { runNonCriticalNativeEffect } from "@/lib/native-effects";

import { createThemeVariables } from "./app-theme";
import { useAppTheme } from "./app-theme-store";

export function AppThemeProvider({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const themeVariables = useMemo(() => vars(createThemeVariables(theme)), [theme]);

  useEffect(() => {
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(theme.colorScheme);
    }
    colorScheme.set(theme.colorScheme);
    runNonCriticalNativeEffect(() => SystemUI.setBackgroundColorAsync(theme.colors.canvas));
  }, [theme.colorScheme, theme.colors.canvas]);

  const dark = theme.colorScheme === "dark";

  return (
    <View className="flex-1 bg-canvas" style={themeVariables} testID="app-theme-root">
      <StatusBar style={dark ? "light" : "dark"} />
      <NavigationBar style={dark ? "light" : "dark"} />
      {children}
    </View>
  );
}
