import CalendarDays from "lucide-react-native/icons/calendar-days";
import Heart from "lucide-react-native/icons/heart";
import HeartOff from "lucide-react-native/icons/heart-off";
import Pencil from "lucide-react-native/icons/pencil";
import Share2 from "lucide-react-native/icons/share-2";
import Tags from "lucide-react-native/icons/tags";
import Trash2 from "lucide-react-native/icons/trash-2";
import { useState } from "react";
import { View } from "react-native";

import { AppBottomSheet, ConfirmationDialog, ListRow } from "@/components/ui";
import { tokens, useAppTheme } from "@/theme";

import type { Inspiration } from "./types";

export function InspirationActionSheet({
  inspiration,
  onClose,
  onDelete,
  onEdit,
  onEditCategory,
  onEditEvent,
  onFavourite,
  onShare,
}: {
  inspiration?: Inspiration;
  onClose: () => void;
  onDelete: (inspiration: Inspiration) => Promise<void> | void;
  onEdit: (inspiration: Inspiration) => void;
  onEditCategory?: (inspiration: Inspiration) => void;
  onEditEvent?: (inspiration: Inspiration) => void;
  onFavourite: (inspiration: Inspiration) => Promise<void> | void;
  onShare: (inspiration: Inspiration) => Promise<void> | void;
}) {
  const theme = useAppTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const editActionCount =
    onEditCategory || onEditEvent
      ? Number(Boolean(onEditCategory)) + Number(Boolean(onEditEvent))
      : 1;
  const presentation = 3 + editActionCount <= 4 ? "dialog" : "sheet";
  const icon = (Icon: typeof Heart, danger = false) => (
    <View
      className={`h-12 w-12 items-center justify-center rounded-control ${danger ? "bg-dangerSoft" : "bg-surfaceMuted"}`}
    >
      <Icon
        color={danger ? theme.colors.danger : theme.colors.textSecondary}
        size={tokens.iconSize.md}
      />
    </View>
  );

  return (
    <>
      <AppBottomSheet
        onClose={onClose}
        presentation={presentation}
        scrollable={false}
        title={inspiration?.title || "Inspiration actions"}
        visible={Boolean(inspiration) && !confirmDelete}
      >
        {inspiration ? (
          <View className="gap-2xs">
            <ListRow
              leading={icon(inspiration.isFavourite ? HeartOff : Heart)}
              onPress={() => {
                onClose();
                void onFavourite(inspiration);
              }}
              title={inspiration.isFavourite ? "Remove from favourites" : "Add to favourites"}
            />
            {onEditCategory || onEditEvent ? (
              <>
                {onEditCategory ? (
                  <ListRow
                    leading={icon(Tags)}
                    onPress={() => {
                      onClose();
                      onEditCategory(inspiration);
                    }}
                    title="Change category"
                  />
                ) : null}
                {onEditEvent ? (
                  <ListRow
                    leading={icon(CalendarDays)}
                    onPress={() => {
                      onClose();
                      onEditEvent(inspiration);
                    }}
                    title={inspiration.eventId ? "Change linked event" : "Link to an event"}
                  />
                ) : null}
              </>
            ) : (
              <ListRow
                leading={icon(Pencil)}
                onPress={() => {
                  onClose();
                  onEdit(inspiration);
                }}
                title="Edit details"
              />
            )}
            <ListRow
              leading={icon(Share2)}
              onPress={() => {
                onClose();
                void onShare(inspiration);
              }}
              title="Share image"
            />
            <ListRow
              leading={icon(Trash2, true)}
              onPress={() => setConfirmDelete(true)}
              title="Delete inspiration"
            />
          </View>
        ) : null}
      </AppBottomSheet>
      <ConfirmationDialog
        confirmLabel="Delete"
        description="This removes the saved reference from this device. You can undo for a few seconds."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!inspiration) return;
          setDeleting(true);
          void Promise.resolve(onDelete(inspiration)).finally(() => {
            setDeleting(false);
            setConfirmDelete(false);
            onClose();
          });
        }}
        pending={deleting}
        title="Delete this inspiration?"
        visible={confirmDelete}
      />
    </>
  );
}
