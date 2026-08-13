import { type PropsWithChildren } from "react";
import { Text, type TextProps } from "react-native";

import { tokens } from "@/theme";

type AppTextVariant =
  | "body"
  | "caption"
  | "countdown"
  | "display"
  | "formTitle"
  | "heading"
  | "hero"
  | "heroCompact"
  | "label"
  | "metadata"
  | "title"
  | "wordmark";
type AppTextTone =
  | "accent"
  | "danger"
  | "muted"
  | "nightAccent"
  | "onNight"
  | "onNightMuted"
  | "onPrimary"
  | "primary"
  | "secondary"
  | "success"
  | "warning";

const variantClassNames: Record<AppTextVariant, string> = {
  body: "text-body text-textPrimary",
  caption: "text-caption text-textSecondary",
  countdown: "text-countdown text-textPrimary",
  display: "text-display text-textPrimary",
  formTitle: "text-formTitle text-textPrimary",
  heading: "text-heading text-textPrimary",
  hero: "text-hero text-textPrimary",
  heroCompact: "text-heroCompact text-textPrimary",
  label: "text-label text-textPrimary",
  metadata: "text-metadata text-textMuted",
  title: "text-title text-textPrimary",
  wordmark: "text-wordmark text-textPrimary",
};

const variantFontFamilies: Record<AppTextVariant, string> = {
  body: tokens.fontFamily.sansRegular,
  caption: tokens.fontFamily.sansRegular,
  countdown: tokens.fontFamily.serifMedium,
  display: tokens.fontFamily.sansBold,
  formTitle: tokens.fontFamily.sansBold,
  heading: tokens.fontFamily.sansSemibold,
  hero: tokens.fontFamily.serifSemibold,
  heroCompact: tokens.fontFamily.serifSemibold,
  label: tokens.fontFamily.sansSemibold,
  metadata: tokens.fontFamily.sansMedium,
  title: tokens.fontFamily.sansSemibold,
  wordmark: tokens.fontFamily.serifSemibold,
};

const toneColors: Record<AppTextTone, string> = {
  accent: tokens.colors.accent,
  danger: tokens.colors.danger,
  muted: tokens.colors.textSecondary,
  nightAccent: tokens.colors.nightAccent,
  onNight: tokens.colors.onNight,
  onNightMuted: tokens.colors.onNightMuted,
  onPrimary: tokens.colors.onPrimary,
  primary: tokens.colors.primary,
  secondary: tokens.colors.secondary,
  success: tokens.colors.success,
  warning: tokens.colors.warning,
};

type AppTextProps = PropsWithChildren<
  TextProps & {
    className?: string;
    tone?: AppTextTone;
    variant?: AppTextVariant;
  }
>;

export function AppText({
  children,
  className = "",
  style,
  tone,
  variant = "body",
  ...props
}: AppTextProps) {
  return (
    <Text
      allowFontScaling
      className={`${variantClassNames[variant]} ${className}`}
      style={[
        { fontFamily: variantFontFamilies[variant] },
        tone ? { color: toneColors[tone] } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
