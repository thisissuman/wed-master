import { LinearGradient } from "expo-linear-gradient";
import type { LucideIcon } from "lucide-react-native";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import type { PropsWithChildren, ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, Text, View, type TextProps } from "react-native";
import Animated, { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { MotionPressable } from "@/components/ui";

import { onboardingGradients, onboardingTheme as theme } from "./onboarding-theme";

export function OnboardingText({
  children,
  color = theme.colors.text,
  family = "body",
  size = 16,
  style,
  ...props
}: TextProps &
  PropsWithChildren<{
    color?: string;
    family?: "body" | "emotional" | "medium" | "semibold" | "bold" | "wordmark";
    size?: number;
  }>) {
  return (
    <Text
      allowFontScaling
      style={[
        {
          color,
          fontFamily: theme.fonts[family],
          fontSize: size,
          lineHeight: Math.round(size * 1.35),
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
    ? theme.colors.white
    : light
      ? theme.colors.deepPlum
      : theme.colors.plum;
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
        borderColor: primary ? "rgba(255,255,255,0.18)" : theme.colors.border,
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
        <View style={{ backgroundColor: light ? theme.colors.ivory : theme.colors.elevatedIvory }}>
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
  title,
}: PropsWithChildren<{
  footer: ReactNode;
  onBack: () => void;
  progress: number;
  title: string;
}>) {
  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.ivory, flex: 1 }}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
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
                  style={{ alignItems: "center", height: 48, justifyContent: "center", width: 48 }}
                >
                  <ArrowLeft color={theme.colors.plum} size={24} />
                </MotionPressable>
                <OnboardingText
                  family="semibold"
                  size={15}
                  style={{ flex: 1, textAlign: "center" }}
                >
                  {title}
                </OnboardingText>
                <OnboardingText
                  accessibilityLabel={`Step ${progress} of 4`}
                  color={theme.colors.mutedText}
                  family="semibold"
                  size={13}
                  style={{ textAlign: "right", width: 48 }}
                >
                  {progress}/4
                </OnboardingText>
              </View>
              <View
                accessibilityLabel={`Setup progress, step ${progress} of 4`}
                accessibilityRole="progressbar"
                accessibilityValue={{ max: 4, min: 1, now: progress }}
                style={{
                  flexDirection: "row",
                  gap: 6,
                  paddingHorizontal: theme.layout.pagePadding,
                }}
              >
                {[1, 2, 3, 4].map((item) => (
                  <View
                    key={item}
                    style={{
                      backgroundColor:
                        item <= progress ? theme.colors.bridalRed : theme.colors.border,
                      borderRadius: 99,
                      flex: 1,
                      height: 4,
                    }}
                  />
                ))}
              </View>
              <ScrollView
                contentContainerStyle={{
                  gap: 20,
                  padding: theme.layout.pagePadding,
                  paddingBottom: 140,
                }}
                contentInsetAdjustmentBehavior="automatic"
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
              >
                {children}
              </ScrollView>
              <View
                style={{
                  backgroundColor: "rgba(255,248,242,0.96)",
                  borderTopColor: "rgba(75,23,77,0.08)",
                  borderTopWidth: 1,
                  bottom: 0,
                  left: 0,
                  padding: theme.layout.pagePadding,
                  paddingBottom: 16,
                  position: "absolute",
                  right: 0,
                }}
              >
                {footer}
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function StepHeading({ children, description }: PropsWithChildren<{ description: string }>) {
  return (
    <View style={{ gap: 8 }}>
      <OnboardingText family="emotional" size={36} style={{ letterSpacing: -0.4 }}>
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
        backgroundColor: theme.colors.elevatedIvory,
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
