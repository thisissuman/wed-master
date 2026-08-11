import type { LucideIcon } from "lucide-react-native";
import { ChevronRight, CircleDashed, Plus } from "lucide-react-native";
import { useWindowDimensions, View } from "react-native";

import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";

import { AppText } from "./AppText";
import { MotionPressable } from "./MotionPressable";

type EmptyStateProps = {
  actionIcon?: LucideIcon;
  actionLabel?: string;
  description?: string;
  icon?: LucideIcon;
  onAction?: () => void;
  title: string;
};

export function EmptyState({
  actionIcon: ActionIcon = Plus,
  actionLabel,
  description,
  icon: Icon = CircleDashed,
  onAction,
  title,
}: EmptyStateProps) {
  const { fontScale } = useWindowDimensions();
  const largeText = isLargeText(fontScale);

  if (actionLabel && onAction) {
    return (
      <MotionPressable
        accessibilityHint={[title, description].filter(Boolean).join(". ")}
        accessibilityLabel={actionLabel}
        accessibilityRole="button"
        android_ripple={{ color: tokens.colors.primarySoft }}
        className="min-h-16 flex-row items-center gap-sm overflow-hidden rounded-control border border-borderSubtle bg-elevatedSurface px-md py-sm active:bg-primarySoft"
        onPress={onAction}
        pressedScale={0.985}
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primarySoft">
          <ActionIcon color={tokens.colors.primary} size={tokens.iconSize.md} />
        </View>
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText numberOfLines={largeText ? undefined : 2} variant="label">
            {title}
          </AppText>
          {largeText ? (
            <View className="flex-row items-center gap-2xs">
              <AppText tone="primary" variant="label">
                {actionLabel}
              </AppText>
              <ChevronRight color={tokens.colors.primary} size={tokens.iconSize.sm} />
            </View>
          ) : null}
        </View>
        {largeText ? null : (
          <>
            <AppText tone="primary" variant="label">
              {actionLabel}
            </AppText>
            <ChevronRight color={tokens.colors.primary} size={tokens.iconSize.sm} />
          </>
        )}
      </MotionPressable>
    );
  }

  return (
    <View
      accessibilityLabel={[title, description].filter(Boolean).join(". ")}
      accessibilityRole="text"
      accessible
      className="min-h-16 flex-row items-center gap-sm rounded-control bg-surfaceMuted px-md py-sm"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-elevatedSurface">
        <Icon color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
      </View>
      <View className="min-w-0 flex-1 gap-2xs">
        <AppText variant="label">{title}</AppText>
        {description ? (
          <AppText numberOfLines={largeText ? undefined : 2} tone="muted" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
