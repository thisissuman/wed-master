import { type PropsWithChildren } from "react";
import { Text, type TextProps } from "react-native";

import { tokens, useAppTheme, type AppThemeColorRole } from "@/theme";

export type AppTextVariant =
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
export type AppTextTone =
  | "accent"
  | "brand"
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
  body: tokens.fontFamily.sansMedium,
  caption: tokens.fontFamily.sansMedium,
  countdown: tokens.fontFamily.serifMedium,
  display: tokens.fontFamily.sansBold,
  formTitle: tokens.fontFamily.sansBold,
  heading: tokens.fontFamily.sansSemibold,
  hero: tokens.fontFamily.serifSemibold,
  heroCompact: tokens.fontFamily.serifSemibold,
  label: tokens.fontFamily.sansSemibold,
  metadata: tokens.fontFamily.sansMedium,
  title: tokens.fontFamily.sansBold,
  wordmark: tokens.fontFamily.serifSemibold,
};

const toneColorRoles: Record<AppTextTone, AppThemeColorRole> = {
  accent: "accent",
  brand: "headingAccent",
  danger: "danger",
  muted: "textSecondary",
  nightAccent: "nightAccent",
  onNight: "onNight",
  onNightMuted: "onNightMuted",
  onPrimary: "onPrimary",
  primary: "textPrimary",
  secondary: "secondary",
  success: "success",
  warning: "warning",
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
  const theme = useAppTheme();

  return (
    <Text
      allowFontScaling
      className={`${variantClassNames[variant]} ${className}`}
      style={[
        { fontFamily: variantFontFamilies[variant] },
        tone ? { color: theme.colors[toneColorRoles[tone]] } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
