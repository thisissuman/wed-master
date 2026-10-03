import type { ReactNode } from "react";
import { View } from "react-native";

import { MangalyaHeartAccent } from "@/components/brand/MangalyaHeartAccent";
import { AppText } from "./AppText";

export function PageHeader({
  actions,
  description,
  heartAccent = false,
  title,
}: {
  actions?: ReactNode;
  description?: string;
  heartAccent?: boolean;
  title: string;
}) {
  return (
    <View className="gap-2xs">
      <View className="flex-row items-start justify-between gap-sm">
        <View className="min-w-0 flex-1 flex-row items-center gap-xs">
          <AppText
            accessibilityRole="header"
            className="min-w-0 shrink"
            tone="brand"
            variant="display"
          >
            {title}
          </AppText>
          {heartAccent ? <MangalyaHeartAccent /> : null}
        </View>
        {actions ? <View className="shrink-0 flex-row items-center gap-2xs">{actions}</View> : null}
      </View>
      {description ? (
        <AppText tone="muted" variant="caption">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
