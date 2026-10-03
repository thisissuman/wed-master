import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { type PropsWithChildren, type ReactNode, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View, type TextProps } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { MotionPressable } from "@/components/ui";

import { onboardingGradients, onboardingTheme as theme } from "./onboarding-theme";

export function OnboardingText({
  children,
  color = theme.colors.text,
  family = "medium",
  size = 16,
  style,
  ...props
}: TextProps &
  PropsWithChildren<{
    color?: string;
    family?: "body" | "medium" | "semibold" | "bold" | "wordmark";
    size?: number;
  }>) {
  const { fontScale } = useWindowDimensions();

  return (
    <Text
      allowFontScaling
      style={[
        {
          color,
          fontFamily: theme.fonts[family],
          fontSize: size,
          lineHeight: Math.round(size * 1.35 * fontScale),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}

export function OnboardingButton({
  disabled = false,
  icon: Icon = ChevronRight,
  label,
  loading = false,
  onPress,
  variant = "primary",
}: {
  disabled?: boolean;
  icon?: LucideIcon;
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: "primary" | "secondary" | "light";
}) {
  const primary = variant === "primary";
  const light = variant === "light";
  const foreground = primary
    ? theme.colors.onPrimary
    : light
      ? theme.colors.nightSurface
      : theme.colors.primary;
  const content = (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        minHeight: theme.layout.controlHeight,
        paddingHorizontal: 20,
      }}
    >
      <OnboardingText color={foreground} family="semibold" size={15}>
        {loading ? "Building…" : label}
      </OnboardingText>
      {!loading ? <Icon color={foreground} size={19} /> : null}
    </View>
  );

  return (
    <MotionPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      pressedScale={0.975}
      style={{
        borderColor: primary ? theme.colors.translucentBorder : theme.colors.border,
        borderRadius: theme.radius.control,
        borderWidth: 1,
        opacity: disabled ? 0.5 : 1,
        overflow: "hidden",
      }}
    >
      {primary ? (
        <LinearGradient
          colors={onboardingGradients.action}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={{
            backgroundColor: light ? theme.colors.onNight : theme.colors.elevatedSurface,
          }}
        >
          {content}
        </View>
      )}
    </MotionPressable>
  );
}

export function OnboardingStep({
  children,
  footer,
  onBack,
  progress,
  totalSteps = 5,
  title,
}: PropsWithChildren<{
  footer: ReactNode;
  onBack: () => void;
  progress: number;
  totalSteps?: number;
  title: string;
}>) {
  const [footerHeight, setFooterHeight] = useState(0);
  const bottomOffset = footerHeight + 16;
  const scrollContent = <>{children}</>;
  const footerContent = (
    <View
      onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
      style={{
        backgroundColor: theme.colors.translucentSurface,
        borderTopColor: theme.colors.translucentBorder,
        borderTopWidth: 1,
        padding: theme.layout.pagePadding,
        paddingBottom: 16,
      }}
    >
      {footer}
    </View>
  );

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.canvas, flex: 1 }}>
      <LinearGradient
        colors={onboardingGradients.light}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{ flex: 1 }}
      >
        <Animated.View
          entering={FadeIn.duration(theme.motion.entrance).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(theme.motion.exit).reduceMotion(ReduceMotion.System)}
          style={{ flex: 1 }}
        >
          <View
            style={{
              alignSelf: "center",
              flex: 1,
              maxWidth: theme.layout.maxWidth,
              width: "100%",
            }}
          >
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                minHeight: 64,
                paddingHorizontal: theme.layout.pagePadding,
              }}
            >
              <MotionPressable
                accessibilityLabel="Back"
                accessibilityRole="button"
                onPress={onBack}
                pressedScale={0.94}
                style={{
                  alignItems: "center",
                  height: 48,
                  justifyContent: "center",
                  width: 48,
                }}
              >
                <ArrowLeft color={theme.colors.primary} size={24} />
              </MotionPressable>
              <OnboardingText family="semibold" size={15} style={{ flex: 1, textAlign: "center" }}>
                {title}
              </OnboardingText>
              <OnboardingText
                accessibilityLabel={`Step ${progress} of ${totalSteps}`}
                color={theme.colors.mutedText}
                family="semibold"
                size={13}
                style={{ textAlign: "right", width: 48 }}
              >
                {progress}/{totalSteps}
              </OnboardingText>
            </View>
            <View
              accessibilityLabel={`Setup progress, step ${progress} of ${totalSteps}`}
              accessibilityRole="progressbar"
              accessibilityValue={{ max: totalSteps, min: 1, now: progress }}
              style={{
                flexDirection: "row",
                gap: 6,
                paddingHorizontal: theme.layout.pagePadding,
              }}
            >
              {Array.from({ length: totalSteps }, (_, index) => index + 1).map((item) => (
                <View
                  key={item}
                  style={{
                    backgroundColor: item <= progress ? theme.colors.primary : theme.colors.border,
                    borderRadius: 99,
                    flex: 1,
                    height: 4,
                  }}
                />
              ))}
            </View>
            {process.env.EXPO_OS === "web" ? (
              <ScrollView
                contentContainerStyle={{
                  gap: 20,
                  padding: theme.layout.pagePadding,
                }}
                contentInsetAdjustmentBehavior="automatic"
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
              >
                {scrollContent}
              </ScrollView>
            ) : (
              <KeyboardAwareScrollView
                bottomOffset={bottomOffset}
                contentContainerStyle={{
                  gap: 20,
                  padding: theme.layout.pagePadding,
                  paddingBottom: bottomOffset + theme.layout.pagePadding,
                }}
                contentInsetAdjustmentBehavior="automatic"
                disableScrollOnKeyboardHide
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                mode="insets"
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                testID="onboarding-keyboard-aware-scroll"
              >
                {scrollContent}
              </KeyboardAwareScrollView>
            )}
            {process.env.EXPO_OS === "web" ? (
              footerContent
            ) : (
              <KeyboardStickyView testID="onboarding-keyboard-sticky-footer">
                {footerContent}
              </KeyboardStickyView>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

export function StepHeading({ children, description }: PropsWithChildren<{ description: string }>) {
  return (
    <View style={{ gap: 8 }}>
      <OnboardingText family="bold" size={30} style={{ letterSpacing: -0.3 }}>
        {children}
      </OnboardingText>
      <OnboardingText color={theme.colors.mutedText}>{description}</OnboardingText>
    </View>
  );
}

export function OnboardingCard({ children }: PropsWithChildren) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.elevatedSurface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.card,
        borderWidth: 1,
        gap: 16,
        padding: 18,
      }}
    >
      {children}
    </View>
  );
}
