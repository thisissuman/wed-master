import { forwardRef, type ComponentRef } from "react";
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motionDurations } from "@/theme";
import { motionEasing } from "@/theme/motion";

type MotionPressableProps = Omit<PressableProps, "style"> & {
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const MotionPressable = forwardRef<ComponentRef<typeof Pressable>, MotionPressableProps>(
  function MotionPressable({ onPressIn, onPressOut, pressedScale = 0.97, style, ...props }, ref) {
    const reduceMotion = useReducedMotion();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (event: GestureResponderEvent) => {
      scale.set(
        withTiming(pressedScale, {
          duration: reduceMotion ? 0 : motionDurations.press,
          easing: motionEasing.feedback,
        }),
      );
      onPressIn?.(event);
    };

    const handlePressOut = (event: GestureResponderEvent) => {
      scale.set(
        withTiming(1, {
          duration: reduceMotion ? 0 : motionDurations.fast,
          easing: motionEasing.feedback,
        }),
      );
      onPressOut?.(event);
    };

    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        ref={ref}
        style={[style, animatedStyle]}
        {...props}
      />
    );
  },
);
