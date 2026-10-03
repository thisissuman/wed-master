import * as Haptics from "expo-haptics";
import Plus from "lucide-react-native/icons/plus";
import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";

import { tokens, useAppTheme } from "@/theme";
import { runNonCriticalNativeEffect } from "@/lib/native-effects";

import { MotionPressable } from "./MotionPressable";

export function FloatingActionButton({
  accessibilityHint,
  accessibilityLabel,
  bottomInset = Number.parseInt(tokens.spacing.md, 10),
  disabled = false,
  icon: Icon = Plus,
  onPress,
  testID,
}: {
  accessibilityHint?: string;
  accessibilityLabel: string;
  bottomInset?: number;
  disabled?: boolean;
  icon?: LucideIcon;
  onPress: () => void;
  testID?: string;
}) {
  const theme = useAppTheme();

  return (
    <View className="absolute right-md" pointerEvents="box-none" style={{ bottom: bottomInset }}>
      <MotionPressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        android_ripple={{ color: theme.colors.primarySoft, radius: 28 }}
        className="h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary shadow-elevated active:opacity-90"
        disabled={disabled}
        onPress={() => {
          runNonCriticalNativeEffect(() => Haptics.selectionAsync());
          onPress();
        }}
        pressedScale={0.96}
        testID={testID}
      >
        <Icon color={theme.colors.onPrimary} size={tokens.iconSize.lg} strokeWidth={2.2} />
      </MotionPressable>
    </View>
  );
}
