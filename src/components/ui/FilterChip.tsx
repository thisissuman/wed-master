import Check from "lucide-react-native/icons/check";
import type { LucideIcon } from "lucide-react-native";
import { forwardRef, type ComponentRef } from "react";
import { Pressable, View } from "react-native";

import { tokens, useAppTheme } from "@/theme";

import { AppText } from "./AppText";
import { MotionPressable } from "./MotionPressable";

export type FilterChipProps = {
  count?: number;
  icon?: LucideIcon;
  label: string;
  onPress: () => void;
  selected?: boolean;
  variant?: "default" | "soft";
};

export const FilterChip = forwardRef<ComponentRef<typeof Pressable>, FilterChipProps>(
  function FilterChip(
    { count, icon: Icon, label, onPress, selected = false, variant = "default" },
    ref,
  ) {
    const theme = useAppTheme();
    const soft = variant === "soft";
    const foreground = selected
      ? soft
        ? theme.colors.primary
        : theme.colors.onPrimary
      : theme.colors.textPrimary;
    const containerClassName = soft
      ? selected
        ? "border-primary bg-primarySoft"
        : "border-borderSubtle bg-surface active:bg-surfaceMuted"
      : selected
        ? "border-primary bg-primary"
        : "border-borderStrong bg-elevatedSurface active:bg-surfaceMuted";
    const countTone = soft && selected ? "onPrimary" : selected ? "primary" : "onPrimary";

    return (
      <MotionPressable
        accessibilityLabel={`${label}${count ? `, ${count} active` : ""}`}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        android_ripple={{ color: theme.colors.primarySoft }}
        className={`min-h-12 flex-row items-center justify-center gap-2xs overflow-hidden rounded-control border px-md ${containerClassName}`}
        onPress={onPress}
        pressedScale={0.98}
        ref={ref}
      >
        {selected && soft ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            testID="filter-chip-selection-mark"
          >
            <Check color={foreground} size={tokens.iconSize.sm} strokeWidth={2.2} />
          </View>
        ) : Icon ? (
          <Icon color={foreground} size={tokens.iconSize.sm} />
        ) : null}
        <AppText style={{ color: foreground }} variant="label">
          {label}
        </AppText>
        {count ? (
          <View
            className={`rounded-full px-xs ${selected && !soft ? "bg-elevatedSurface" : "bg-primary"}`}
          >
            <AppText style={{ fontVariant: ["tabular-nums"] }} tone={countTone} variant="caption">
              {count}
            </AppText>
          </View>
        ) : null}
      </MotionPressable>
    );
  },
);
