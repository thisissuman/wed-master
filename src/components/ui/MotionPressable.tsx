import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import { useState } from "react";
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from "react-native-reanimated";

import { motionDurations } from "@/theme";

type MotionPressableProps = Omit<PressableProps, "style"> & {
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MotionPressable({
  onPressIn,
  onPressOut,
  pressedScale = 0.985,
  style,
  ...props
}: MotionPressableProps) {
  const reduceMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          scale: withTiming(pressed ? pressedScale : 1, {
            duration: reduceMotion ? 0 : motionDurations.press,
          }),
        },
      ],
    }),
    [pressed, pressedScale, reduceMotion],
  );

  const handlePressIn = (event: GestureResponderEvent) => {
    setPressed(true);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    setPressed(false);
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...props}
    />
  );
}
