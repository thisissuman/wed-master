import { type ReactNode, useEffect, useRef } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { motionDurations } from "@/theme";
import { motionEasing } from "@/theme/motion";

type CreatedItemPulseProps = {
  active?: boolean;
  children: ReactNode;
  onFinished?: () => void;
};

const breathHalfDuration = motionDurations.state + motionDurations.press;
const breathStartDelay = motionDurations.fast;
const pulseDuration = breathStartDelay + breathHalfDuration * 2;
const pulseCompletionBuffer = motionDurations.press;
const pulseOpacityDelta = 0.04;
const pulseScaleDelta = 0.025;

export function CreatedItemPulse({ active = false, children, onFinished }: CreatedItemPulseProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      progress.set(0);
      return;
    }

    progress.set(0);
    if (!reduceMotion) {
      progress.set(
        withDelay(
          breathStartDelay,
          withSequence(
            withTiming(1, {
              duration: breathHalfDuration,
              easing: motionEasing.enter,
            }),
            withTiming(0, {
              duration: breathHalfDuration,
              easing: motionEasing.exit,
            }),
          ),
        ),
      );
    }

    const timeout = setTimeout(
      () => onFinishedRef.current?.(),
      reduceMotion ? 0 : pulseDuration + pulseCompletionBuffer,
    );
    return () => {
      clearTimeout(timeout);
      cancelAnimation(progress);
      progress.set(0);
    };
  }, [active, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * pulseOpacityDelta,
    transform: [{ scale: 1 + progress.value * pulseScaleDelta }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
