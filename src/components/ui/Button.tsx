import type { LucideIcon } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { tokens, useAppTheme, type AppThemeColorRole } from "@/theme";
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

const iconColorRoleByVariant: Record<ButtonVariant, AppThemeColorRole> = {
  dangerGhost: "danger",
  destructive: "onPrimary",
  ghost: "primary",
  primary: "onPrimary",
  secondary: "textPrimary",
};

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  icon?: LucideIcon;
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
};

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
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const iconColor = theme.colors[iconColorRoleByVariant[variant]];

  const content = (
    <View className="min-h-4xl flex-row items-center justify-center gap-xs px-lg">
      {loading ? <ActivityIndicator color={iconColor} /> : null}
      {Icon && !loading ? <Icon color={iconColor} size={tokens.iconSize.sm} /> : null}
      <AppText style={{ color: iconColor }} variant="label">
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
      android_ripple={{ color: theme.colors.surfaceMuted }}
      disabled={isDisabled}
      className={`min-h-4xl overflow-hidden rounded-control ${variantClassNames[variant]} ${
        isDisabled ? "opacity-50" : "active:opacity-80"
      } ${className}`}
      pressedScale={variant === "primary" ? 0.975 : 0.985}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={theme.gradients.primaryAction}
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
