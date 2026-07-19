import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import { useState } from "react";

type MotionPressableProps = Omit<PressableProps, "style"> & {
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
};

export function MotionPressable({
  onPressIn,
  onPressOut,
  pressedScale = 0.985,
  style,
  ...props
}: MotionPressableProps) {
  const [pressed, setPressed] = useState(false);

  const handlePressIn = (event: GestureResponderEvent) => {
    setPressed(true);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    setPressed(false);
    onPressOut?.(event);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, pressed ? { transform: [{ scale: pressedScale }] } : undefined]}
      {...props}
    />
  );
}
