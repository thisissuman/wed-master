import { View } from "react-native";

import { AppText } from "./AppText";

export function FieldLabel({
  label,
  optional = false,
  required = false,
}: {
  label: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap items-baseline gap-2xs">
      <AppText variant="label">{label}</AppText>
      {required ? (
        <AppText accessibilityLabel="required" tone="danger" variant="caption">
          Required
        </AppText>
      ) : optional ? (
        <AppText tone="muted" variant="caption">
          Optional
        </AppText>
      ) : null}
    </View>
  );
}
