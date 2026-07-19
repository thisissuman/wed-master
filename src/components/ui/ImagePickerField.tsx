import { Image } from "expo-image";
import { ActivityIndicator, View } from "react-native";
import { ImagePlus, Trash2 } from "lucide-react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";
import { FieldLabel } from "./FieldLabel";
import { IconButton } from "./IconButton";
import { MotionPressable } from "./MotionPressable";

export function ImagePickerField({
  error,
  label,
  loading = false,
  onPick,
  onRemove,
  optional = true,
  uri,
}: {
  error?: string;
  label: string;
  loading?: boolean;
  onPick: () => void;
  onRemove: () => void;
  optional?: boolean;
  uri?: string;
}) {
  return (
    <View className="gap-2xs">
      <FieldLabel label={label} optional={optional} />
      <View className="relative overflow-hidden rounded-card border border-borderStrong bg-elevatedSurface shadow-card">
        <MotionPressable
          accessibilityLabel={
            uri ? `Change ${label.toLowerCase()}` : `Choose ${label.toLowerCase()}`
          }
          accessibilityRole="button"
          className="min-h-36 overflow-hidden"
          disabled={loading}
          onPress={onPick}
          pressedScale={0.99}
        >
          {uri ? (
            <Image
              accessibilityLabel={`${label} preview`}
              contentFit="cover"
              source={{ uri }}
              style={{ height: 144, width: "100%" }}
            />
          ) : (
            <View className="min-h-36 items-center justify-center gap-xs border border-dashed border-borderStrong bg-surfaceMuted/40 p-lg">
              {loading ? (
                <ActivityIndicator color={tokens.colors.primary} />
              ) : (
                <View className="h-12 w-12 items-center justify-center rounded-full bg-primarySoft">
                  <ImagePlus color={tokens.colors.primary} size={tokens.iconSize.lg} />
                </View>
              )}
              <AppText tone="primary" variant="label">
                {loading ? "Opening photos…" : "Choose a photo"}
              </AppText>
              <AppText tone="muted" variant="caption">
                JPG, PNG, WebP or HEIC · up to 15 MB
              </AppText>
            </View>
          )}
        </MotionPressable>
        {uri ? (
          <View className="absolute right-xs top-xs rounded-control bg-translucentSurface">
            <IconButton
              accessibilityLabel={`Remove ${label.toLowerCase()}`}
              icon={Trash2}
              onPress={onRemove}
              variant="subtle"
            />
          </View>
        ) : null}
      </View>
      {error ? (
        <AppText accessibilityRole="alert" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
