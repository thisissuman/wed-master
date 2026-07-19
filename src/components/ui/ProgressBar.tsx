import { View } from "react-native";

type ProgressTone = "danger" | "primary" | "success" | "warning";

const fillClassNames: Record<ProgressTone, string> = {
  danger: "bg-danger",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
};

type ProgressBarProps = {
  accessibilityLabel: string;
  tone?: ProgressTone;
  value: number;
};

export function ProgressBar({ accessibilityLabel, tone = "primary", value }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: 100, min: 0, now: Math.round(percentage) }}
      className="h-2xs overflow-hidden rounded-full bg-surfaceMuted"
    >
      <View
        className={`h-full rounded-full ${fillClassNames[tone]}`}
        style={{ width: `${percentage}%` }}
      />
    </View>
  );
}
