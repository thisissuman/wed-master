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
  className = "",
  icon: Icon,
  size = "md",
  variant = "default",
  ...props
}: IconButtonProps) {
  return (
    <MotionPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.surfaceMuted }}
      className={`min-h-12 min-w-12 items-center justify-center rounded-control active:opacity-80 ${backgroundClassByVariant[variant]} ${className}`}
      pressedScale={0.94}
      {...props}
    >
      <Icon color={iconColorByVariant[variant]} size={tokens.iconSize[size]} />
    </MotionPressable>
  );
}
