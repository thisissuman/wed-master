import { View } from "react-native";

import { AppText } from "./AppText";
import { Button } from "./Button";

type SectionHeaderProps = {
  actionLabel?: string;
  onAction?: () => void;
  title: string;
};

export function SectionHeader({ actionLabel, onAction, title }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-sm">
      <AppText className="flex-1" variant="heading">
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="ghost" />
      ) : null}
    </View>
  );
}
