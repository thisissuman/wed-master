import { type ReactNode, useState } from "react";
import { View } from "react-native";
import { ChevronDown } from "lucide-react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { tokens } from "@/theme";
import {
  exitTransition,
  motionTiming,
  stateEnteringTransition,
  stateLayoutTransition,
} from "@/theme/motion";

import { AppText } from "./AppText";
import { MotionPressable } from "./MotionPressable";

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
  const rotation = useSharedValue(initiallyExpanded ? 180 : 0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    const next = !expanded;
    rotation.set(withTiming(next ? 180 : 0, motionTiming.state));
    setExpanded(next);
  };

  return (
    <Animated.View layout={stateLayoutTransition}>
      <View className="overflow-hidden rounded-card border border-borderSubtle bg-elevatedSurface shadow-card">
        <MotionPressable
          accessibilityHint={description}
          accessibilityLabel={title}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          android_ripple={{ color: tokens.colors.surfaceMuted }}
          className="min-h-14 flex-row items-center gap-sm px-md py-xs active:bg-surfaceMuted"
          onPress={toggle}
        >
          <View className="flex-1 gap-2xs">
            <AppText variant="label">{title}</AppText>
            {description ? <AppText variant="caption">{description}</AppText> : null}
          </View>
          <Animated.View style={chevronStyle}>
            <ChevronDown color={tokens.colors.textSecondary} size={tokens.iconSize.md} />
          </Animated.View>
        </MotionPressable>
        {expanded ? (
          <Animated.View entering={stateEnteringTransition} exiting={exitTransition}>
            <View className="gap-lg border-t border-borderSubtle bg-surface p-md">{children}</View>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}
