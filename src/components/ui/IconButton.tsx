import type { LucideIcon } from "lucide-react-native";
import { Pressable, type PressableProps } from "react-native";

import { tokens } from "@/theme";

type IconButtonProps = Omit<PressableProps, "children"> & {
  accessibilityLabel: string;
  icon: LucideIcon;
  size?: keyof typeof tokens.iconSize;
};

export function IconButton({
  accessibilityLabel,
  icon: Icon,
  size = "md",
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.border }}
      className="min-h-12 min-w-12 items-center justify-center rounded-control"
      {...props}
    >
      <Icon color={tokens.colors.textPrimary} size={tokens.iconSize[size]} />
    </Pressable>
  );
}
