import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, type TextStyle, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { isLargeText } from "@/lib/responsive";

import { AppText, type AppTextTone, type AppTextVariant } from "./AppText";

const fadeWidth = 16;
const edgePauseMilliseconds = 800;
const pixelsPerSecond = 30;

function transparentVersion(color: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) return `${color}00`;
  if (/^#[0-9a-f]{8}$/i.test(color)) return `${color.slice(0, 7)}00`;
  return "transparent";
}

export function OverflowMarqueeText({
  accessible = true,
  accessibilityLabel,
  fadeColor,
  style,
  text,
  tone,
  variant = "label",
}: {
  accessible?: boolean;
  accessibilityLabel?: string;
  fadeColor: string;
  style?: TextStyle;
  text: string;
  tone?: AppTextTone;
  variant?: AppTextVariant;
}) {
  const { fontScale } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useSharedValue(0);
  const staticFallback = reduceMotion || screenReaderEnabled || isLargeText(fontScale);
  const overflowDistance = Math.max(0, textWidth - containerWidth + fadeWidth);
  const shouldAnimate = !staticFallback && containerWidth > 0 && overflowDistance > 1;
  const transparentFade = useMemo(() => transparentVersion(fadeColor), [fadeColor]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (mounted) setScreenReaderEnabled(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", (enabled) => {
      setScreenReaderEnabled(enabled);
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    cancelAnimation(translateX);
    translateX.set(0);
    if (!shouldAnimate) return;

    const travelDuration = Math.max(900, Math.round((overflowDistance / pixelsPerSecond) * 1_000));
    translateX.set(
      withRepeat(
        withSequence(
          withDelay(
            edgePauseMilliseconds,
            withTiming(-overflowDistance, {
              duration: travelDuration,
              easing: Easing.linear,
            }),
          ),
          withDelay(edgePauseMilliseconds, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(translateX);
  }, [overflowDistance, shouldAnimate, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (staticFallback) {
    return (
      <AppText
        accessibilityLabel={accessible ? (accessibilityLabel ?? text) : undefined}
        accessible={accessible}
        numberOfLines={2}
        style={style}
        tone={tone}
        variant={variant}
      >
        {text}
      </AppText>
    );
  }

  return (
    <View
      accessibilityLabel={accessible ? (accessibilityLabel ?? text) : undefined}
      accessibilityRole="text"
      accessible={accessible}
      className="min-w-0 overflow-hidden"
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View style={[{ alignSelf: "flex-start", flexDirection: "row" }, animatedStyle]}>
        <AppText
          accessible={false}
          numberOfLines={1}
          onLayout={(event) => setTextWidth(event.nativeEvent.layout.width)}
          style={style}
          tone={tone}
          variant={variant}
        >
          {text}
        </AppText>
      </Animated.View>
      {shouldAnimate ? (
        <>
          <LinearGradient
            colors={[fadeColor, transparentFade]}
            end={{ x: 1, y: 0 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={{ bottom: 0, left: 0, position: "absolute", top: 0, width: fadeWidth }}
          />
          <LinearGradient
            colors={[transparentFade, fadeColor]}
            end={{ x: 1, y: 0 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={{ bottom: 0, position: "absolute", right: 0, top: 0, width: fadeWidth }}
          />
        </>
      ) : null}
    </View>
  );
}
