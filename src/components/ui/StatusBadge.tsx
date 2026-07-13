import { View } from "react-native";

import { AppText } from "./AppText";

export type StatusBadgeTone = "brand" | "danger" | "neutral" | "success" | "warning";

const toneClassNames: Record<StatusBadgeTone, string> = {
  brand: "bg-brandSoft",
  danger: "bg-dangerSoft",
  neutral: "bg-surfaceSubtle",
  success: "bg-successSoft",
  warning: "bg-warningSoft",
};

const textClassNames: Record<StatusBadgeTone, string> = {
  brand: "text-brand",
  danger: "text-danger",
  neutral: "text-textSecondary",
  success: "text-success",
  warning: "text-warning",
};

type StatusBadgeProps = { label: string; tone: StatusBadgeTone };

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <View
      accessibilityLabel={label}
      className={`self-start rounded-control px-sm py-2xs ${toneClassNames[tone]}`}
    >
      <AppText className={textClassNames[tone]} variant="caption">
        {label}
      </AppText>
    </View>
  );
}
