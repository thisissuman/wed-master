import { type ReactNode } from "react";
import { View } from "react-native";

import { useAppTheme } from "@/theme";

import { AppText } from "./AppText";
import { MotionPressable } from "./MotionPressable";

type ListRowProps = {
  accessory?: ReactNode;
  accessibilityLabel?: string;
  className?: string;
  description?: string;
  disabled?: boolean;
  leading?: ReactNode;
  onPress?: () => void;
  title: string;
  trailing?: ReactNode;
};

export function ListRow({
  accessory,
  accessibilityLabel,
  className = "",
  description,
  disabled = false,
  leading,
  onPress,
  title,
  trailing,
}: ListRowProps) {
  const theme = useAppTheme();
  const ending = trailing ?? accessory;
  const content = (
    <View className={`min-h-4xl flex-row items-center gap-sm py-md ${className}`}>
      {leading ? <View>{leading}</View> : null}
      <View className="flex-1 gap-2xs">
        <AppText variant="label">{title}</AppText>
        {description ? <AppText variant="caption">{description}</AppText> : null}
      </View>
      {ending ? <View>{ending}</View> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <MotionPressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={{ color: theme.colors.surfaceMuted }}
      className="rounded-control active:bg-surfaceMuted"
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.99}
    >
      {content}
    </MotionPressable>
  );
}
