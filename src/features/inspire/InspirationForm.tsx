import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import FolderHeart from "lucide-react-native/icons/folder-heart";
import StickyNote from "lucide-react-native/icons/sticky-note";
import Type from "lucide-react-native/icons/type";
import { useEffect, useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, type TextInput } from "react-native";

import { AppText, Screen, SelectField, TextField } from "@/components/ui";
import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { uiFieldLimits } from "@/lib/forms/fieldLimits";
import { useSingleFlightSubmission } from "@/lib/forms/useSingleFlightSubmission";
import {
  RouteLoadError,
  RouteLoading,
  RouteNotFound,
} from "@/features/workspace/routes/RouteStates";
import { useUnsavedChangesGuard } from "@/features/workspace/useUnsavedChangesGuard";
import { useWorkspace } from "@/features/workspace/provider";
import { FormShell } from "@/features/workspace/ui";
import { useAppTheme } from "@/theme";

import { boardAspectRatio } from "./InspireComponents";
import { useInspirationDraftStore } from "./draft-store";
import { inspirationErrorMessage } from "./errors";
import { inspirationFormSchema, type InspirationFormValues } from "./forms";
import { removeInspirationMedia } from "./media";
import {
  useCreateInspirationMutation,
  useInspiration,
  useUpdateInspirationMutation,
} from "./provider";
import { inspirationCategories, inspirationCategoryLabels, type Inspiration } from "./types";

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

const formImageMaxHeight = 480;

export function InspirationForm({ inspirationId }: { inspirationId?: string }) {
  const workspace = useWorkspace();
  const weddingId = workspace.data?.wedding.id ?? "";
  const inspirationQuery = useInspiration(weddingId, inspirationId ?? "");

  if (workspace.isLoading || (inspirationId && inspirationQuery.isLoading)) {
    return <RouteLoading label="Opening inspiration" />;
  }
  if (workspace.isError) {
    return (
      <RouteLoadError
        error={workspace.error}
        fallback="/inspire"
        onRetry={() => void workspace.refetch()}
        title="We could not open this form"
      />
    );
  }
  if (!workspace.data) return <RouteNotFound entity="Wedding" fallback="/inspire" />;
  if (inspirationId && inspirationQuery.isError) {
    return (
      <RouteLoadError
        error={inspirationQuery.error}
        fallback="/inspire"
        onRetry={() => void inspirationQuery.refetch()}
        title="We could not open this inspiration"
      />
    );
  }
  if (inspirationId && !inspirationQuery.data) {
    return <RouteNotFound entity="Inspiration" fallback="/inspire" />;
  }

  return (
    <InspirationFormContent
      events={workspace.data.events}
      inspiration={inspirationQuery.data ?? undefined}
      weddingId={workspace.data.wedding.id}
    />
  );
}

function InspirationFormContent({
  events,
  inspiration,
  weddingId,
}: {
  events: NonNullable<ReturnType<typeof useWorkspace>["data"]>["events"];
  inspiration?: Inspiration;
  weddingId: string;
}) {
  const theme = useAppTheme();
  const draft = useInspirationDraftStore((state) => state.draft);
  const clearDraft = useInspirationDraftStore((state) => state.clear);
  const showFeedback = useFeedbackStore((state) => state.show);
  const createMutation = useCreateInspirationMutation();
  const updateMutation = useUpdateInspirationMutation();
  const titleRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);
  const media = inspiration?.media ?? draft?.media;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<InspirationFormValues>({
    resolver: zodResolver(inspirationFormSchema),
    mode: "onTouched",
    defaultValues: {
      category: inspiration?.category ?? "decor",
      eventId: inspiration?.eventId ?? "",
      note: inspiration?.note ?? "",
      title: inspiration?.title ?? "",
    },
  });
  const mutation = inspiration ? updateMutation : createMutation;
  const eventOptions = useMemo(
    () => [
      { label: "No event yet", value: "" },
      ...events.map((event) => ({
        description: event.date,
        label: event.name,
        value: event.id,
      })),
    ],
    [events],
  );
  const categoryOptions = useMemo(
    () =>
      inspirationCategories.map((category) => ({
        label: inspirationCategoryLabels[category],
        value: category,
      })),
    [],
  );

  useEffect(() => {
    if (!inspiration) return;
    reset({
      category: inspiration.category,
      eventId: inspiration.eventId ?? "",
      note: inspiration.note ?? "",
      title: inspiration.title ?? "",
    });
  }, [inspiration, reset]);

  const { exitAfterSaveTo, requestExitTo } = useUnsavedChangesGuard({
    isDirty: isDirty || Boolean(!inspiration && draft),
    isSubmitting: isSubmitting || mutation.isPending,
    onDiscard:
      !inspiration && draft
        ? () => {
            removeInspirationMedia(draft);
          }
        : undefined,
  });

  const saveValues = useSingleFlightSubmission(async (values: InspirationFormValues) => {
    if (inspiration) {
      await updateMutation.mutateAsync({
        id: inspiration.id,
        weddingId,
        category: values.category,
        eventId: optional(values.eventId ?? ""),
        note: optional(values.note),
        title: optional(values.title),
      });
      showFeedback({ message: "Inspiration updated" });
    } else if (draft) {
      await createMutation.mutateAsync({
        weddingId,
        category: values.category,
        sourceType: draft.sourceType,
        media: draft.media,
        eventId: optional(values.eventId ?? ""),
        note: optional(values.note),
        title: optional(values.title),
      });
      clearDraft();
      showFeedback({ message: "Inspiration saved" });
    }
    exitAfterSaveTo("/inspire");
  });

  if (!inspiration && !draft) {
    return <RouteNotFound entity="Inspiration draft" fallback="/inspire" />;
  }

  return (
    <Screen>
      <FormShell
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={() => requestExitTo("/inspire")}
        onSubmit={() => void handleSubmit(saveValues)()}
        submitLabel={inspiration ? "Save changes" : "Save inspiration"}
        submissionError={
          mutation.error
            ? inspirationErrorMessage(
                mutation.error,
                "This inspiration could not be saved. Try again.",
              )
            : undefined
        }
        title={inspiration ? "Edit inspiration" : "Add inspiration"}
      >
        {media ? (
          <View className="gap-xs">
            <View
              className="w-full overflow-hidden rounded-card border border-borderSubtle bg-surfaceMuted"
              style={{
                aspectRatio: boardAspectRatio(media.detailWidth, media.detailHeight),
                borderCurve: "continuous",
                maxHeight: formImageMaxHeight,
              }}
            >
              <Image
                accessibilityLabel="Selected inspiration preview"
                cachePolicy="memory-disk"
                contentFit="contain"
                source={{ uri: media.detailUri }}
                style={{ height: "100%", width: "100%" }}
              />
            </View>
            <AppText tone="muted" variant="caption">
              {inspiration
                ? "The saved image stays unchanged while you edit its planning details."
                : "Your photo stays on this device and is not included in data-only backups."}
            </AppText>
          </View>
        ) : null}
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SelectField
              error={errors.category?.message}
              icon={FolderHeart}
              label="Category"
              onChange={field.onChange}
              options={categoryOptions}
              required
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <TextField
              autoCapitalize="sentences"
              autoComplete="off"
              error={errors.title?.message}
              icon={Type}
              label="Title"
              maxLength={uiFieldLimits.shortText}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              onSubmitEditing={() => noteRef.current?.focus()}
              optional
              placeholder="Pastel floral mandap"
              ref={titleRef}
              returnKeyType="next"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <TextField
              autoCapitalize="sentences"
              error={errors.note?.message}
              icon={StickyNote}
              label="Note"
              maxLength={uiFieldLimits.longText}
              multiline
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              optional
              placeholder="What do you love, and what would you change?"
              ref={noteRef}
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="eventId"
          render={({ field }) => (
            <SelectField
              icon={CalendarDays}
              label="Event"
              onChange={field.onChange}
              optional
              options={eventOptions}
              value={field.value ?? ""}
            />
          )}
        />
        <View className="rounded-control bg-surfaceMuted p-md">
          <AppText style={{ color: theme.colors.textSecondary }} variant="caption">
            Categories describe what the idea is. You can connect it to more planning decisions in a
            future shared release.
          </AppText>
        </View>
      </FormShell>
    </Screen>
  );
}
