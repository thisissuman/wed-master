import "../global.css";

import { useEffect } from "react";
import { EBGaramond_500Medium } from "@expo-google-fonts/eb-garamond/500Medium";
import { EBGaramond_500Medium_Italic } from "@expo-google-fonts/eb-garamond/500Medium_Italic";
import { EBGaramond_600SemiBold } from "@expo-google-fonts/eb-garamond/600SemiBold";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { useFonts } from "expo-font";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { Sentry, sentryEnabled } from "@/lib/observability/sentry";
import { AppProviders } from "@/providers/app-providers";
import { AppThemeProvider } from "@/theme/AppThemeProvider";
import { useAppTheme, useAppThemeStore } from "@/theme/app-theme-store";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <AppThemeProvider>
      <View className="flex-1 items-center justify-center bg-canvas px-lg py-xl">
        <View className="w-full max-w-lg gap-md rounded-card border border-borderSubtle bg-elevatedSurface p-lg">
          <View className="gap-xs">
            <AppText accessibilityRole="header" variant="title">
              Mangalya ran into a problem
            </AppText>
            <AppText tone="muted">
              We could not open this screen. Try again to return to your planning workspace.
            </AppText>
          </View>
          <Button label="Retry" onPress={() => void retry().catch(() => undefined)} />
        </View>
      </View>
    </AppThemeProvider>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    EBGaramond_500Medium,
    EBGaramond_500Medium_Italic,
    EBGaramond_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const theme = useAppTheme();
  const themeHasHydrated = useAppThemeStore((state) => state.hasHydrated);
  const hydrateTheme = useAppThemeStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateTheme().catch(() => undefined);
  }, [hydrateTheme]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && themeHasHydrated) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontError, fontsLoaded, themeHasHydrated]);

  if (fontError) throw fontError;
  if (!fontsLoaded || !themeHasHydrated) return null;

  return (
    <AppThemeProvider>
      <AppProviders>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: theme.colors.canvas },
            headerShown: false,
          }}
        >
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AppProviders>
    </AppThemeProvider>
  );
}

export default sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;
