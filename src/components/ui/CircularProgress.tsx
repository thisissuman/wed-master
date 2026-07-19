import { type PropsWithChildren, useEffect } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";

import { motionTiming } from "@/theme/motion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CircularProgressProps = PropsWithChildren<{
  accessibilityLabel: string;
  accessibilityValueText: string;
  progressColor: string;
  size: number;
  strokeWidth: number;
  trackColor: string;
  value: number;
}>;

export function CircularProgress({
  accessibilityLabel,
  accessibilityValueText,
  children,
  progressColor,
  size,
  strokeWidth,
  trackColor,
  value,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.min(1, Math.max(0, value));
  const animatedValue = useSharedValue(normalizedValue);

  useEffect(() => {
    animatedValue.set(withTiming(normalizedValue, motionTiming.state));
  }, [animatedValue, normalizedValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedValue.value),
  }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ text: accessibilityValueText }}
      accessible
      style={{ height: size, width: size }}
    >
      <Svg
        accessibilityElementsHidden
        height={size}
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        width={size}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          origin={`${size / 2}, ${size / 2}`}
          r={radius}
          rotation={-90}
          stroke={progressColor}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </Svg>
      <View
        className="absolute inset-0 items-center justify-center"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
      >
        {children}
      </View>
    </View>
  );
}
