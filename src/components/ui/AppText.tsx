import { type PropsWithChildren } from "react";
import { Text, type TextProps } from "react-native";

type AppTextVariant = "body" | "caption" | "display" | "heading" | "label" | "title";

const variantClassNames: Record<AppTextVariant, string> = {
  body: "text-body text-textPrimary",
  caption: "text-caption text-textSecondary",
  display: "text-display text-textPrimary",
  heading: "text-heading text-textPrimary",
  label: "text-label text-textPrimary",
  title: "text-title text-textPrimary",
};

type AppTextProps = PropsWithChildren<
  TextProps & {
    className?: string;
    variant?: AppTextVariant;
  }
>;

export function AppText({ children, className = "", variant = "body", ...props }: AppTextProps) {
  return (
    <Text allowFontScaling className={`${variantClassNames[variant]} ${className}`} {...props}>
      {children}
    </Text>
  );
}
