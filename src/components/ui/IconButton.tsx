import type { LucideIcon } from "lucide-react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

import { tokens } from "@/theme";
import { MotionPressable } from "./MotionPressable";

type IconButtonProps = Omit<PressableProps, "children" | "style"> & {
  accessibilityLabel: string;
  icon: LucideIcon;
  size?: keyof typeof tokens.iconSize;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "primary" | "subtle";
};

const backgroundClassByVariant = {
  default: "bg-transparent",
  primary: "bg-primary",
  subtle: "bg-surfaceMuted",
} as const;

const iconColorByVariant = {
  default: tokens.colors.textPrimary,
  primary: tokens.colors.onPrimary,
  subtle: tokens.colors.primary,
} as const;

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
  const isDisabled = disabled === true;
  return (
    <MotionPressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
      android_ripple={{ color: tokens.colors.surfaceMuted }}
      className={`min-h-12 min-w-12 items-center justify-center rounded-control active:opacity-80 ${backgroundClassByVariant[variant]} ${className}`}
      disabled={isDisabled}
      pressedScale={0.94}
    >
      <Icon color={iconColorByVariant[variant]} size={tokens.iconSize[size]} />
    </MotionPressable>
  );
}
