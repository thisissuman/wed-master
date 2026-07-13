import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";

type ListRowProps = {
  accessory?: ReactNode;
  accessibilityLabel?: string;
  className?: string;
  description?: string;
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
  leading,
  onPress,
  title,
  trailing,
}: ListRowProps) {
  const ending = trailing ?? accessory;
  const content = (
    <View className={`min-h-12 flex-row items-center gap-sm py-md ${className}`}>
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
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.surfaceSubtle }}
      className="rounded-control active:bg-surfaceSubtle"
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}
