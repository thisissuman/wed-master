import { View } from "react-native";

import { AppText } from "./AppText";

export function PageHeader({ description, title }: { description?: string; title: string }) {
  return (
    <View className="gap-2xs">
      <AppText accessibilityRole="header" tone="primary" variant="display">
        {title}
      </AppText>
      {description ? (
        <AppText tone="muted" variant="caption">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
