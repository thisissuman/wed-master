import { ActivityIndicator, View } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      className="items-center gap-sm py-2xl"
    >
      <ActivityIndicator color={tokens.colors.brand} />
      <AppText className="text-textSecondary">{label}</AppText>
    </View>
  );
}
