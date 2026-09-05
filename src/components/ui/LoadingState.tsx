import { ActivityIndicator, View } from "react-native";

import { useAppTheme } from "@/theme";

import { AppText } from "./AppText";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      className="items-center gap-sm py-2xl"
    >
      <ActivityIndicator color={theme.colors.primary} />
      <AppText tone="muted">{label}</AppText>
    </View>
  );
}
