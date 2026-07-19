import { View } from "react-native";

import { AppText } from "./AppText";

export type StatusBadgeTone = "danger" | "neutral" | "primary" | "success" | "warning";

const toneClassNames: Record<StatusBadgeTone, string> = {
  danger: "bg-dangerSoft",
  neutral: "bg-surfaceMuted",
  primary: "bg-primarySoft",
  success: "bg-successSoft",
  warning: "bg-warningSoft",
};

const textTones: Record<StatusBadgeTone, "danger" | "muted" | "primary" | "success" | "warning"> = {
  danger: "danger",
  neutral: "muted",
  primary: "primary",
  success: "success",
  warning: "warning",
};

type StatusBadgeProps = { label: string; tone: StatusBadgeTone };

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <View
      accessibilityLabel={label}
      className={`self-start rounded-control px-sm py-2xs ${toneClassNames[tone]}`}
    >
      <AppText tone={textTones[tone]} variant="caption">
        {label}
      </AppText>
    </View>
  );
}
