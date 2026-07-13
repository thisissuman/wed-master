import type { LucideIcon } from "lucide-react-native";
import { Pressable, type PressableProps } from "react-native";

import { tokens } from "@/theme";

type IconButtonProps = Omit<PressableProps, "children"> & {
  accessibilityLabel: string;
  icon: LucideIcon;
  size?: keyof typeof tokens.iconSize;
  variant?: "brand" | "default" | "subtle";
};

const backgroundClassByVariant = {
  brand: "bg-brand",
  default: "bg-transparent",
  subtle: "bg-surfaceSubtle",
} as const;

const iconColorByVariant = {
  brand: tokens.colors.brandOn,
  default: tokens.colors.textPrimary,
  subtle: tokens.colors.brand,
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
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.surfaceSubtle }}
      className={`min-h-12 min-w-12 items-center justify-center rounded-control active:opacity-80 ${backgroundClassByVariant[variant]} ${className}`}
      {...props}
    >
      <Icon color={iconColorByVariant[variant]} size={tokens.iconSize[size]} />
    </Pressable>
  );
}
