import { View } from "react-native";

import { AppText } from "./AppText";
import { Button } from "./Button";

type ErrorStateProps = { message: string; onRetry?: () => void; title?: string };

export function ErrorState({ message, onRetry, title = "Something went wrong" }: ErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      className="items-start gap-sm rounded-card border border-danger bg-surfaceRaised p-lg"
    >
      <AppText variant="heading">{title}</AppText>
      <AppText className="text-textSecondary">{message}</AppText>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}
