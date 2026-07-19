import { View } from "react-native";
import { Image, type ImageSource } from "expo-image";

import { AppText } from "./AppText";
import { Button } from "./Button";

type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  imageSource?: ImageSource | number | string;
  onAction?: () => void;
  title: string;
};

export function EmptyState({
  actionLabel,
  description,
  imageSource,
  onAction,
  title,
}: EmptyStateProps) {
  return (
    <View className="items-start gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-lg">
      {imageSource ? (
        <Image
          accessible={false}
          contentFit="contain"
          source={imageSource}
          style={{ aspectRatio: 512 / 279, width: "100%" }}
        />
      ) : null}
      <AppText variant="heading">{title}</AppText>
      <AppText tone="muted">{description}</AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
