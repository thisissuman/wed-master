import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Pressable, View, type PressableProps } from "react-native";

import { tokens } from "@/theme";
import { AppText } from "./AppText";

type ButtonVariant = "dangerGhost" | "destructive" | "ghost" | "primary" | "secondary";

const variantClassNames: Record<ButtonVariant, string> = {
  dangerGhost: "bg-transparent",
  destructive: "bg-danger",
  ghost: "bg-transparent",
  primary: "bg-brand",
  secondary: "bg-surfaceRaised border border-border",
};

const iconColorByVariant: Record<ButtonVariant, string> = {
  dangerGhost: tokens.colors.danger,
  destructive: tokens.colors.brandOn,
  ghost: tokens.colors.brand,
  primary: tokens.colors.brandOn,
  secondary: tokens.colors.textPrimary,
};

type ButtonProps = Omit<PressableProps, "children"> & {
  icon?: LucideIcon;
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  className = "",
  disabled = false,
  icon: Icon,
  label,
  loading = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      android_ripple={{ color: tokens.colors.surfaceSubtle }}
      disabled={isDisabled}
      className={`min-h-12 flex-row items-center justify-center gap-xs rounded-control px-lg ${variantClassNames[variant]} ${
        isDisabled ? "opacity-50" : "active:opacity-80"
      } ${className}`}
      {...props}
    >
      {loading ? <ActivityIndicator color={iconColorByVariant[variant]} /> : null}
      {Icon && !loading ? (
        <Icon color={iconColorByVariant[variant]} size={tokens.iconSize.sm} />
      ) : null}
      <View>
        <AppText style={{ color: iconColorByVariant[variant] }} variant="label">
          {loading ? "Loading…" : label}
        </AppText>
      </View>
    </Pressable>
  );
}
