import type { LucideIcon } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { tokens } from "@/theme";
import { AppText } from "./AppText";
import { MotionPressable } from "./MotionPressable";

type ButtonVariant = "dangerGhost" | "destructive" | "ghost" | "primary" | "secondary";

const variantClassNames: Record<ButtonVariant, string> = {
  dangerGhost: "bg-transparent",
  destructive: "bg-danger",
  ghost: "bg-transparent",
  primary: "border border-translucentBorder bg-primary shadow-elevated",
  secondary: "border border-borderStrong bg-elevatedSurface",
};

const iconColorByVariant: Record<ButtonVariant, string> = {
  dangerGhost: tokens.colors.danger,
  destructive: tokens.colors.onPrimary,
  ghost: tokens.colors.primary,
  primary: tokens.colors.onPrimary,
  secondary: tokens.colors.textPrimary,
};

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  icon?: LucideIcon;
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
};

const primaryActionGradient = [
  tokens.gradients.primaryAction[0],
  tokens.gradients.primaryAction[1],
] as const;

export function Button({
  accessibilityLabel,
  accessibilityState,
  className = "",
  disabled = false,
  icon: Icon,
  label,
  loading = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const content = (
    <View className="min-h-12 flex-row items-center justify-center gap-xs px-lg">
      {loading ? <ActivityIndicator color={iconColorByVariant[variant]} /> : null}
      {Icon && !loading ? (
        <Icon color={iconColorByVariant[variant]} size={tokens.iconSize.sm} />
      ) : null}
      <AppText style={{ color: iconColorByVariant[variant] }} variant="label">
        {loading ? "Loading…" : label}
      </AppText>
    </View>
  );

  return (
    <MotionPressable
      {...props}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, busy: loading, disabled: isDisabled }}
      android_ripple={{ color: tokens.colors.surfaceMuted }}
      disabled={isDisabled}
      className={`min-h-12 overflow-hidden rounded-control ${variantClassNames[variant]} ${
        isDisabled ? "opacity-50" : "active:opacity-80"
      } ${className}`}
      pressedScale={variant === "primary" ? 0.975 : 0.985}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={primaryActionGradient}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{ alignSelf: "stretch" }}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </MotionPressable>
  );
}
