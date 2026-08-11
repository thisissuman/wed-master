import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";
import { MotionPressable } from "./MotionPressable";

export type FilterChipProps = {
  count?: number;
  icon?: LucideIcon;
  label: string;
  onPress: () => void;
  selected?: boolean;
};

export function FilterChip({
  count,
  icon: Icon,
  label,
  onPress,
  selected = false,
}: FilterChipProps) {
  const foreground = selected ? tokens.colors.onPrimary : tokens.colors.textPrimary;

  return (
    <MotionPressable
      accessibilityLabel={`${label}${count ? `, ${count} active` : ""}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      android_ripple={{ color: tokens.colors.primarySoft }}
      className={`min-h-12 flex-row items-center justify-center gap-2xs overflow-hidden rounded-control border px-md ${
        selected
          ? "border-primary bg-primary"
          : "border-borderStrong bg-elevatedSurface active:bg-surfaceMuted"
      }`}
      onPress={onPress}
      pressedScale={0.98}
    >
      {Icon ? <Icon color={foreground} size={tokens.iconSize.sm} /> : null}
      <AppText tone={selected ? "onPrimary" : undefined} variant="label">
        {label}
      </AppText>
      {count ? (
        <View
          className={
            selected ? "rounded-full bg-elevatedSurface px-xs" : "rounded-full bg-primary px-xs"
          }
        >
          <AppText
            style={{ fontVariant: ["tabular-nums"] }}
            tone={selected ? "primary" : "onPrimary"}
            variant="caption"
          >
            {count}
          </AppText>
        </View>
      ) : null}
    </MotionPressable>
  );
}
