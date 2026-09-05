import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";

import { tokens, useAppTheme } from "@/theme";

import { AppText } from "./AppText";
import type { StatusBadgeTone } from "./StatusBadge";

const surfaceClassNames: Record<StatusBadgeTone, string> = {
  danger: "bg-dangerSoft",
  neutral: "bg-surfaceMuted",
  primary: "bg-primarySoft",
  success: "bg-successSoft",
  warning: "bg-warningSoft",
};

const textTones = {
  danger: "danger",
  neutral: "muted",
  primary: "primary",
  success: "success",
  warning: "warning",
} as const;

export function StatusPill({
  icon: Icon,
  label,
  tone,
}: {
  icon?: LucideIcon;
  label: string;
  tone: StatusBadgeTone;
}) {
  const theme = useAppTheme();
  const color = {
    danger: theme.colors.danger,
    neutral: theme.colors.textSecondary,
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
  }[tone];

  return (
    <View
      accessibilityLabel={label}
      className={`min-h-8 self-start flex-row items-center gap-2xs rounded-full px-sm py-2xs ${surfaceClassNames[tone]}`}
    >
      {Icon ? <Icon color={color} size={tokens.iconSize.sm} /> : null}
      <AppText tone={textTones[tone]} variant="caption">
        {label}
      </AppText>
    </View>
  );
}
