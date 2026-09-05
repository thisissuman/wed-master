import { Image } from "expo-image";
import Camera from "lucide-react-native/icons/camera";
import Heart from "lucide-react-native/icons/heart";
import ImageOff from "lucide-react-native/icons/image-off";
import Images from "lucide-react-native/icons/images";
import Plus from "lucide-react-native/icons/plus";
import { FlashList } from "@shopify/flash-list";
import { memo, useState } from "react";
import { View } from "react-native";

import { AppBottomSheet, AppText, Button, ListRow, MotionPressable } from "@/components/ui";
import { tokens, useAppTheme } from "@/theme";

import type { Inspiration, InspirationSourceType } from "./types";
import { inspirationCategoryLabels } from "./types";
import { demoInspirationPreviewManifest } from "./demo-seed";

export function boardAspectRatio(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 1;
  return width / height;
}

export const InspirationTile = memo(function InspirationTile({
  eventName,
  inspiration,
  onLongPress,
  onPress,
}: {
  eventName?: string;
  inspiration: Inspiration;
  onLongPress: () => void;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const [failedUri, setFailedUri] = useState<string>();
  const label = [
    inspiration.title || `${inspirationCategoryLabels[inspiration.category]} inspiration`,
    inspirationCategoryLabels[inspiration.category],
    inspiration.isFavourite ? "shortlisted" : undefined,
    eventName ? `linked to ${eventName}` : undefined,
  ]
    .filter(Boolean)
    .join(", ");
  const aspectRatio = boardAspectRatio(
    inspiration.media.thumbnailWidth,
    inspiration.media.thumbnailHeight,
  );
  const failed = failedUri === inspiration.media.thumbnailUri;

  return (
    <MotionPressable
      accessibilityHint="Double tap to open. Long press for actions."
      accessibilityLabel={label}
      accessibilityRole="imagebutton"
      android_ripple={{ color: theme.colors.surfaceMuted }}
      className="relative overflow-hidden rounded-card border border-borderSubtle bg-surfaceMuted"
      onLongPress={onLongPress}
      onPress={onPress}
      pressedScale={0.985}
      style={{ aspectRatio, borderCurve: "continuous" }}
    >
      {failed ? (
        <View className="flex-1 items-center justify-center gap-xs p-md">
          <ImageOff color={theme.colors.textMuted} size={tokens.iconSize.lg} />
          <AppText className="text-center" tone="muted" variant="caption">
            Image unavailable
          </AppText>
          <AppText className="text-center" tone="muted" variant="metadata">
            Open for details
          </AppText>
        </View>
      ) : (
        <Image
          accessibilityElementsHidden
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setFailedUri(inspiration.media.thumbnailUri)}
          recyclingKey={`${inspiration.id}:${inspiration.updatedAt}`}
          source={{ uri: inspiration.media.thumbnailUri }}
          style={{ height: "100%", width: "100%" }}
        />
      )}
      {inspiration.isFavourite ? (
        <View
          accessibilityElementsHidden
          className="absolute right-xs top-xs h-9 w-9 items-center justify-center rounded-full bg-translucentSurface"
          pointerEvents="none"
        >
          <Heart
            color={theme.colors.secondary}
            fill={theme.colors.secondary}
            size={tokens.iconSize.sm}
          />
        </View>
      ) : null}
    </MotionPressable>
  );
});

const skeletonRatios = [0.72, 1.2, 0.84, 0.64, 1.36, 0.76] as const;

export function InspirationSkeletonBoard() {
  return (
    <View
      accessibilityLabel="Loading wedding inspiration"
      accessibilityRole="progressbar"
      className="flex-row gap-xs px-md pb-2xl"
    >
      {[0, 1].map((column) => (
        <View className="flex-1 gap-xs" key={column}>
          {skeletonRatios
            .filter((_, index) => index % 2 === column)
            .map((ratio, index) => (
              <View
                className="overflow-hidden rounded-card border border-borderSubtle bg-surfaceMuted"
                key={`${column}-${index}`}
                style={{ aspectRatio: ratio, borderCurve: "continuous" }}
              >
                <View className="flex-1 bg-elevatedSurface opacity-40" />
              </View>
            ))}
        </View>
      ))}
    </View>
  );
}

export function InspireEmptyState({
  columnCount,
  onAdd,
}: {
  columnCount: number;
  onAdd: () => void;
}) {
  return (
    <FlashList
      contentContainerStyle={{
        paddingBottom: Number.parseInt(tokens.spacing["4xl"], 10) + tokens.navigation.tabBarHeight,
        paddingHorizontal: Number.parseInt(tokens.spacing.sm, 10),
        paddingTop: Number.parseInt(tokens.spacing.xs, 10),
      }}
      data={demoInspirationPreviewManifest}
      key={`inspiration-examples-${columnCount}`}
      keyExtractor={(item) => item.title}
      ListFooterComponent={
        <View className="items-center gap-sm px-md pb-xl pt-lg">
          <AppText className="text-center" tone="muted" variant="caption">
            These five examples are read-only and disappear when you add your own inspiration.
          </AppText>
          <Button icon={Plus} label="Add your first inspiration" onPress={onAdd} />
        </View>
      }
      ListHeaderComponent={
        <View className="gap-2xs px-xs pb-md">
          <AppText accessibilityRole="header" variant="heading">
            A little inspiration to begin
          </AppText>
          <AppText tone="muted" variant="caption">
            Your private board will take this shape as you save ideas.
          </AppText>
        </View>
      }
      masonry
      numColumns={columnCount}
      optimizeItemArrangement={false}
      renderItem={({ item }) => (
        <View className="px-2xs pb-xs">
          <View
            accessibilityLabel={`${item.title}, example inspiration`}
            accessibilityRole="image"
            accessible
            className="overflow-hidden rounded-card border border-borderSubtle bg-surfaceMuted"
            style={{ aspectRatio: item.width / item.height, borderCurve: "continuous" }}
          >
            <Image
              accessibilityElementsHidden
              contentFit="cover"
              source={item.asset}
              style={{ height: "100%", width: "100%" }}
            />
            <View className="absolute bottom-0 left-0 right-0 bg-translucentSurface px-sm py-xs">
              <AppText numberOfLines={2} variant="caption">
                {item.title}
              </AppText>
            </View>
          </View>
        </View>
      )}
      showsVerticalScrollIndicator={false}
      testID="inspiration-example-board"
    />
  );
}

export function FilteredInspirationEmpty({ onClear }: { onClear: () => void }) {
  const theme = useAppTheme();
  return (
    <View className="flex-1 items-center justify-center gap-md px-xl py-2xl">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-surfaceMuted">
        <Images color={theme.colors.textMuted} size={tokens.iconSize.lg} />
      </View>
      <View className="items-center gap-2xs">
        <AppText accessibilityRole="header" className="text-center" variant="heading">
          Nothing matches yet
        </AppText>
        <AppText className="text-center" tone="muted">
          Try another category or clear your search.
        </AppText>
      </View>
      <Button label="Clear filters" onPress={onClear} variant="secondary" />
    </View>
  );
}

export function InspirationSourceSheet({
  busySource,
  onAfterClose,
  onClose,
  onSelect,
  visible,
}: {
  busySource?: InspirationSourceType;
  onAfterClose?: () => void;
  onClose: () => void;
  onSelect: (source: InspirationSourceType) => void;
  visible: boolean;
}) {
  const theme = useAppTheme();
  return (
    <AppBottomSheet
      description="Bring a reference into your private wedding workspace."
      onAfterClose={onAfterClose}
      onClose={onClose}
      presentation="dialog"
      scrollable={false}
      title="Add inspiration"
      visible={visible}
    >
      <View className="gap-2xs">
        <ListRow
          accessibilityLabel={busySource === "gallery" ? "Opening Gallery" : "Gallery"}
          description="Choose an image up to 50 MB from this device"
          disabled={Boolean(busySource)}
          leading={
            <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
              <Images color={theme.colors.primary} size={tokens.iconSize.md} />
            </View>
          }
          onPress={() => onSelect("gallery")}
          title="Gallery"
        />
        <ListRow
          accessibilityLabel={busySource === "camera" ? "Opening Camera" : "Camera"}
          description="Capture an idea while visiting a venue or shop"
          disabled={Boolean(busySource)}
          leading={
            <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
              <Camera color={theme.colors.primary} size={tokens.iconSize.md} />
            </View>
          }
          onPress={() => onSelect("camera")}
          title="Camera"
        />
      </View>
    </AppBottomSheet>
  );
}
