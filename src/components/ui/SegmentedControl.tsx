import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motionDurations, tokens } from "@/theme";
import { motionEasing } from "@/theme/motion";

import { AppText } from "./AppText";

export type SegmentOption<Value extends string> = {
  label: string;
  value: Value;
};

export type SegmentedControlProps<Value extends string> = {
  accessibilityLabel: string;
  onChange: (value: Value) => void;
  options: SegmentOption<Value>[];
  value: Value;
};

function SegmentLabel({
  index,
  label,
  selectedIndex,
}: {
  index: number;
  label: string;
  selectedIndex: SharedValue<number>;
}) {
  const baseStyle = useAnimatedStyle(() => ({
    opacity:
      1 -
      interpolate(
        selectedIndex.value,
        [index - 1, index, index + 1],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
  }));
  const selectedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      selectedIndex.value,
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View className="items-center justify-center">
      <Animated.View style={baseStyle}>
        <AppText tone="muted" variant="label">
          {label}
        </AppText>
      </Animated.View>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[{ position: "absolute" }, selectedStyle]}
      >
        <AppText tone="onPrimary" variant="label">
          {label}
        </AppText>
      </Animated.View>
    </View>
  );
}

export function SegmentedControl<Value extends string>({
  accessibilityLabel,
  onChange,
  options,
  value,
}: SegmentedControlProps<Value>) {
  const reduceMotion = useReducedMotion();
  const selectedOptionIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedIndex = useSharedValue(selectedOptionIndex);
  const [containerWidth, setContainerWidth] = useState(0);
  const inset = Number.parseInt(tokens.spacing["2xs"], 10);
  const indicatorWidth = options.length
    ? Math.max(0, (containerWidth - inset * 2) / options.length)
    : 0;

  useEffect(() => {
    selectedIndex.set(
      withTiming(selectedOptionIndex, {
        duration: reduceMotion ? 0 : motionDurations.tab,
        easing: motionEasing.move,
      }),
    );
  }, [reduceMotion, selectedIndex, selectedOptionIndex]);

  const indicatorStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: selectedIndex.value * indicatorWidth }],
      width: indicatorWidth,
    }),
    [indicatorWidth],
  );

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className="relative flex-row overflow-hidden rounded-control bg-surfaceMuted p-2xs"
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {indicatorWidth ? (
        <Animated.View
          accessibilityElementsHidden
          className="absolute bottom-2xs left-2xs top-2xs rounded-control bg-primary"
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={indicatorStyle}
          testID="segmented-control-indicator"
        />
      ) : null}
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            android_ripple={{ color: tokens.colors.primarySoft }}
            className="min-h-12 flex-1 items-center justify-center overflow-hidden rounded-control px-sm"
            key={option.value}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
          >
            <SegmentLabel index={index} label={option.label} selectedIndex={selectedIndex} />
          </Pressable>
        );
      })}
    </View>
  );
}
