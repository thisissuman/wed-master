import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "./AppText";

type ListRowProps = {
  accessory?: ReactNode;
  description?: string;
  onPress?: () => void;
  title: string;
};

export function ListRow({ accessory, description, onPress, title }: ListRowProps) {
  const content = (
    <View className="min-h-12 flex-row items-center justify-between gap-md py-sm">
      <View className="flex-1 gap-2xs">
        <AppText variant="label">{title}</AppText>
        {description ? <AppText variant="caption">{description}</AppText> : null}
      </View>
      {accessory}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable accessibilityRole="button" className="rounded-control" onPress={onPress}>
      {content}
    </Pressable>
  );
}
