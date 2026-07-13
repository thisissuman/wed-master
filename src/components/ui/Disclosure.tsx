import { type ReactNode, useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";

type DisclosureProps = {
  children: ReactNode;
  description?: string;
  initiallyExpanded?: boolean;
  title: string;
};

export function Disclosure({
  children,
  description,
  initiallyExpanded = false,
  title,
}: DisclosureProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  return (
    <View className="overflow-hidden rounded-card border border-border bg-surfaceRaised">
      <Pressable
        accessibilityHint={description}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        android_ripple={{ color: tokens.colors.surfaceSubtle }}
        className="min-h-12 flex-row items-center gap-sm px-md active:bg-surfaceSubtle"
        onPress={() => setExpanded((value) => !value)}
      >
        <View className="flex-1 gap-2xs">
          <AppText variant="label">{title}</AppText>
          {description ? <AppText variant="caption">{description}</AppText> : null}
        </View>
        <ChevronDown
          color={tokens.colors.textSecondary}
          size={tokens.iconSize.md}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {expanded ? <View className="gap-lg border-t border-border p-md">{children}</View> : null}
    </View>
  );
}
