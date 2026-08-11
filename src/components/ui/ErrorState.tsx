import { View } from "react-native";

import { AppText } from "./AppText";
import { Button } from "./Button";

type ErrorStateProps = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  onRetry?: () => void;
  title?: string;
};

export function ErrorState({
  actionLabel,
  message,
  onAction,
  onRetry,
  title = "Something went wrong",
}: ErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      className="items-start gap-sm rounded-card border border-danger bg-elevatedSurface p-lg"
    >
      <AppText variant="heading">{title}</AppText>
      <AppText tone="muted">{message}</AppText>
      {onRetry || (actionLabel && onAction) ? (
        <View className="flex-row flex-wrap gap-sm">
          {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
          {actionLabel && onAction ? (
            <Button label={actionLabel} onPress={onAction} variant="secondary" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
