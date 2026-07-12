import { View } from "react-native";

import { AppText } from "./AppText";

type StatusTone = "danger" | "info" | "success" | "warning";

const toneClassNames: Record<StatusTone, string> = {
  danger: "border-danger",
  info: "border-info",
  success: "border-success",
  warning: "border-warning",
};

type StatusBadgeProps = { label: string; tone: StatusTone };

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <View
      accessibilityLabel={label}
      className={`self-start rounded-control border px-sm py-2xs ${toneClassNames[tone]}`}
    >
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}
