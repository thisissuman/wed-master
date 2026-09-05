import type { LucideIcon } from "lucide-react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

import { tokens, useAppTheme, type AppThemeColorRole } from "@/theme";
import { MotionPressable } from "./MotionPressable";

type IconButtonProps = Omit<PressableProps, "children" | "style"> & {
  accessibilityLabel: string;
  icon: LucideIcon;
  size?: keyof typeof tokens.iconSize;
  style?: StyleProp<ViewStyle>;
  variant?: "danger" | "default" | "night" | "primary" | "subtle";
};

const backgroundClassByVariant = {
  danger: "bg-dangerSoft",
  default: "bg-transparent",
  night: "bg-nightSoft",
  primary: "bg-primary",
  subtle: "bg-surfaceMuted",
} as const;

const iconColorRoleByVariant: Record<NonNullable<IconButtonProps["variant"]>, AppThemeColorRole> = {
  danger: "danger",
  default: "textPrimary",
  night: "nightAccent",
  primary: "onPrimary",
  subtle: "primary",
};

export function IconButton({
  accessibilityLabel,
  accessibilityState,
  className = "",
  disabled = false,
  icon: Icon,
  size = "md",
  variant = "default",
  ...props
}: IconButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled === true;
  return (
    <MotionPressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
      android_ripple={{ color: theme.colors.surfaceMuted }}
      className={`min-h-12 min-w-12 items-center justify-center rounded-control active:opacity-80 ${backgroundClassByVariant[variant]} ${className}`}
      disabled={isDisabled}
      pressedScale={0.94}
    >
      <Icon color={theme.colors[iconColorRoleByVariant[variant]]} size={tokens.iconSize[size]} />
    </MotionPressable>
  );
}
