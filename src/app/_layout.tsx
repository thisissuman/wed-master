import "../global.css";

import { useEffect } from "react";
import { EBGaramond_500Medium } from "@expo-google-fonts/eb-garamond/500Medium";
import { EBGaramond_600SemiBold } from "@expo-google-fonts/eb-garamond/600SemiBold";
import { EBGaramond_700Bold_Italic } from "@expo-google-fonts/eb-garamond/700Bold_Italic";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/providers";
import { tokens } from "@/theme";
import { Sentry, sentryEnabled } from "@/lib/observability/sentry";

void SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    EBGaramond_500Medium,
    EBGaramond_600SemiBold,
    EBGaramond_700Bold_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: tokens.colors.canvas },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AppProviders>
  );
}

export default sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;
