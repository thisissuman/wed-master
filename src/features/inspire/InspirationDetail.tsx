import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import Heart from "lucide-react-native/icons/heart";
import ImageOff from "lucide-react-native/icons/image-off";
import MoreHorizontal from "lucide-react-native/icons/ellipsis";
import Pencil from "lucide-react-native/icons/pencil";
import Share2 from "lucide-react-native/icons/share-2";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AppText, Button, IconButton, Screen } from "@/components/ui";
import {
  feedbackActionDurationMilliseconds,
  useFeedbackStore,
} from "@/features/feedback/feedback-store";
import { useWorkspace } from "@/features/workspace/provider";
import {
  RouteLoadError,
  RouteLoading,
  RouteNotFound,
} from "@/features/workspace/routes/RouteStates";
import { DetailHeader } from "@/features/workspace/ui";
import { tokens, useAppTheme } from "@/theme";

import { InspirationActionSheet } from "./InspirationActionSheet";
import { isManagedInspirationMediaUri, removeInspirationMedia } from "./media";
import {
  useDeleteInspirationMutation,
  useInspiration,
  useRestoreInspirationMutation,
  useSetInspirationFavouriteMutation,
} from "./provider";
import { inspirationCategoryLabels, type Inspiration } from "./types";

function readableDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-2xs border-b border-borderSubtle py-md">
      <AppText tone="muted" variant="metadata">
        {label}
      </AppText>
      <AppText selectable>{value}</AppText>
    </View>
  );
}

export function InspirationDetail({ inspirationId }: { inspirationId?: string }) {
  const theme = useAppTheme();
  const workspace = useWorkspace();
  const weddingId = workspace.data?.wedding.id ?? "";
  const inspirationQuery = useInspiration(weddingId, inspirationId ?? "");
  const favouriteMutation = useSetInspirationFavouriteMutation();
  const deleteMutation = useDeleteInspirationMutation();
  const restoreMutation = useRestoreInspirationMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const [imageFailed, setImageFailed] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  if (workspace.isLoading || inspirationQuery.isLoading) {
    return <RouteLoading label="Opening inspiration" />;
  }
  if (workspace.isError || inspirationQuery.isError) {
    return (
      <RouteLoadError
        error={workspace.error ?? inspirationQuery.error}
        fallback="/inspire"
        onRetry={() => {
          void workspace.refetch();
          void inspirationQuery.refetch();
        }}
        title="We could not open this inspiration"
      />
    );
  }
  const inspiration = inspirationQuery.data;
  if (!inspiration || !workspace.data) {
    return <RouteNotFound entity="Inspiration" fallback="/inspire" />;
  }
  const event = inspiration.eventId
    ? workspace.data.events.find((candidate) => candidate.id === inspiration.eventId)
    : undefined;

  const share = async () => {
    try {
      if (!isManagedInspirationMediaUri(inspiration.media.detailUri)) {
        throw new Error("This image could not be shared.");
      }
      if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available here.");
      await Sharing.shareAsync(inspiration.media.detailUri, {
        dialogTitle: inspiration.title || "Share inspiration",
        mimeType: inspiration.media.mimeType,
      });
    } catch {
      showFeedback({ message: "This image could not be shared. Try again." });
    }
  };

  const toggleFavourite = async () => {
    try {
      await favouriteMutation.mutateAsync({
        weddingId,
        id: inspiration.id,
        isFavourite: !inspiration.isFavourite,
      });
    } catch {
      showFeedback({ message: "The shortlist could not be updated. Try again." });
    }
  };

  const deleteInspiration = async (target: Inspiration) => {
    try {
      const deleted = await deleteMutation.mutateAsync({ weddingId, id: target.id });
      router.replace("/inspire");
      let restored = false;
      const cleanup = setTimeout(() => {
        if (!restored) removeInspirationMedia(deleted.media);
      }, feedbackActionDurationMilliseconds);
      showFeedback({
        message: "Inspiration deleted",
        actionLabel: "Undo",
        onAction: async () => {
          restored = true;
          clearTimeout(cleanup);
          await restoreMutation.mutateAsync(deleted);
        },
      });
    } catch {
      showFeedback({ message: "This inspiration could not be deleted. Try again." });
    }
  };
  const editInspiration = () =>
    router.navigate({ pathname: "/inspire/edit", params: { id: inspiration.id } });

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-lg p-md pb-3xl"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <DetailHeader fallback="/inspire" title={inspiration.title || "Inspiration"} />
        <View
          className="w-full overflow-hidden rounded-card border border-borderSubtle bg-surfaceMuted"
          style={{
            aspectRatio: inspiration.media.detailWidth / inspiration.media.detailHeight,
            borderCurve: "continuous",
          }}
        >
          {imageFailed ? (
            <View className="flex-1 items-center justify-center gap-xs p-xl">
              <ImageOff color={theme.colors.textMuted} size={tokens.iconSize.lg} />
              <AppText className="text-center" tone="muted">
                This image is unavailable on this device.
              </AppText>
              <Button
                label="Retry image"
                onPress={() => setImageFailed(false)}
                variant="secondary"
              />
            </View>
          ) : (
            <Image
              accessibilityLabel={inspiration.title || "Saved wedding inspiration"}
              cachePolicy="memory-disk"
              contentFit="contain"
              onError={() => setImageFailed(true)}
              recyclingKey={`${inspiration.id}:${inspiration.updatedAt}:detail`}
              source={{ uri: inspiration.media.detailUri }}
              style={{ height: "100%", width: "100%" }}
            />
          )}
        </View>

        <View className="flex-row flex-wrap gap-xs">
          <Button
            accessibilityState={{ selected: inspiration.isFavourite }}
            icon={Heart}
            label={inspiration.isFavourite ? "Shortlisted" : "Favourite"}
            loading={favouriteMutation.isPending}
            onPress={() => void toggleFavourite()}
            variant={inspiration.isFavourite ? "primary" : "secondary"}
          />
          <Button icon={Pencil} label="Edit" onPress={editInspiration} variant="secondary" />
          <Button icon={Share2} label="Share" onPress={() => void share()} variant="secondary" />
          <IconButton
            accessibilityLabel="More inspiration actions"
            icon={MoreHorizontal}
            onPress={() => setActionsOpen(true)}
            variant="subtle"
          />
        </View>

        <View>
          <Metadata label="Category" value={inspirationCategoryLabels[inspiration.category]} />
          {inspiration.title ? <Metadata label="Title" value={inspiration.title} /> : null}
          {inspiration.note ? <Metadata label="Note" value={inspiration.note} /> : null}
          {event ? (
            <View className="gap-xs border-b border-borderSubtle py-md">
              <AppText tone="muted" variant="metadata">
                Event
              </AppText>
              <Button
                icon={CalendarDays}
                label={event.name}
                onPress={() => router.navigate(`/events/${event.id}`)}
                variant="ghost"
              />
            </View>
          ) : null}
          <Metadata
            label="Added from"
            value={inspiration.sourceType === "camera" ? "Camera" : "Gallery"}
          />
          <Metadata label="Date added" value={readableDate(inspiration.createdAt)} />
        </View>
        <AppText tone="muted" variant="caption">
          Inspiration photos stay on this device and are not included in data-only backups.
        </AppText>
      </ScrollView>
      <InspirationActionSheet
        inspiration={actionsOpen ? inspiration : undefined}
        onClose={() => setActionsOpen(false)}
        onDelete={deleteInspiration}
        onEdit={editInspiration}
        onEditCategory={editInspiration}
        onEditEvent={editInspiration}
        onFavourite={() => toggleFavourite()}
        onShare={() => share()}
      />
    </Screen>
  );
}
