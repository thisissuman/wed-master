import { View } from "react-native";

import { AppText } from "./AppText";
import { Button } from "./Button";

type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
};

export function EmptyState({ actionLabel, description, onAction, title }: EmptyStateProps) {
  return (
    <View className="items-start gap-sm rounded-card border border-border bg-surfaceRaised p-lg">
      <AppText variant="heading">{title}</AppText>
      <AppText className="text-textSecondary">{description}</AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
