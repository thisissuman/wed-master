import FileText from "lucide-react-native/icons/file-text";
import Paperclip from "lucide-react-native/icons/paperclip";
import Trash2 from "lucide-react-native/icons/trash-2";
import { Pressable, View } from "react-native";

import { AppText, Button } from "@/components/ui";
import { tokens, useAppTheme } from "@/theme";

import type { AttachmentRef } from "../types";

export function AttachmentField({
  attachment,
  error,
  label = "Attachment",
  loading,
  onPick,
  onRemove,
}: {
  attachment?: AttachmentRef;
  error?: string;
  label?: string;
  loading?: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View className="gap-xs">
      <AppText variant="label">{label}</AppText>
      {attachment ? (
        <View className="flex-row items-center gap-sm rounded-control border border-borderSubtle bg-elevatedSurface p-sm">
          <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
            <FileText color={theme.colors.primary} size={tokens.iconSize.md} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText numberOfLines={1} variant="label">
              {attachment.name}
            </AppText>
            <AppText tone="muted" variant="caption">
              {(attachment.size / 1024).toFixed(0)} KB
            </AppText>
          </View>
          <Pressable
            accessibilityLabel={`Remove ${attachment.name}`}
            accessibilityRole="button"
            className="min-h-12 min-w-12 items-center justify-center"
            onPress={onRemove}
          >
            <Trash2 color={theme.colors.danger} size={tokens.iconSize.md} />
          </Pressable>
        </View>
      ) : (
        <Button
          icon={Paperclip}
          label={loading ? "Opening files" : "Choose JPG, PNG, or PDF"}
          loading={loading}
          onPress={onPick}
          variant="secondary"
        />
      )}
      <AppText tone={error ? "danger" : "muted"} variant="caption">
        {error ?? "Maximum file size: 5 MB"}
      </AppText>
    </View>
  );
}
