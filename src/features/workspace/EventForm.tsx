import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Check, Clock3, MapPin, Palette, PartyPopper, StickyNote } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  AppText,
  DateField,
  ImagePickerField,
  MotionPressable,
  Screen,
  TextField,
  TimeField,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";

import { eventFormSchema, type EventFormValues } from "./forms";
import { pickEventCoverPhoto, removeEventCoverPhoto } from "./files/workspace-files";
import { useWorkspaceMutation } from "./provider";
import { eventColorKeys, type EventColorKey, type WeddingEvent } from "./types";
import { FormShell } from "./ui";

const eventColors: Record<EventColorKey, { color: string; label: string }> = {
  botanical: { color: tokens.colors.eventBotanical, label: "Lavender" },
  gold: { color: tokens.colors.eventGold, label: "Antique gold" },
  terracotta: { color: tokens.colors.eventTerracotta, label: "Terracotta" },
  sage: { color: tokens.colors.eventSage, label: "Sage" },
};

const eventCoverErrorMessage = (error: unknown) =>
  error instanceof Error &&
  /Cover photos must|Choose an image for the event cover/.test(error.message)
    ? error.message
    : toUserMessage(error);

function EventColorField({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (value: EventColorKey) => void;
  value: EventColorKey;
}) {
  return (
    <View className="gap-xs">
      <View className="flex-row items-center gap-xs">
        <Palette color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
        <AppText variant="label">Theme colour</AppText>
      </View>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-sm">
        {eventColorKeys.map((key) => {
          const option = eventColors[key];
          const selected = key === value;
          return (
            <MotionPressable
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={`h-14 w-14 items-center justify-center rounded-full border-2 ${
                selected ? "border-primary bg-primarySoft shadow-card" : "border-borderSubtle"
              }`}
              key={key}
              onPress={() => {
                onChange(key);
                void Haptics.selectionAsync();
              }}
              pressedScale={0.92}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: option.color }}
              >
                {selected ? (
                  <Check color={tokens.colors.onPrimary} size={tokens.iconSize.md} />
                ) : null}
              </View>
            </MotionPressable>
          );
        })}
      </View>
      <AppText tone="muted" variant="caption">
        {eventColors[value].label}
      </AppText>
      {error ? (
        <AppText accessibilityRole="alert" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function EventForm({ event }: { event?: WeddingEvent }) {
  const mutation = useWorkspaceMutation();
  const [coverPhotoUri, setCoverPhotoUri] = useState(event?.coverPhotoUri);
  const [coverPhotoError, setCoverPhotoError] = useState<string>();
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const pendingCoverPhotoRef = useRef<string | undefined>(undefined);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event
      ? {
          name: event.name,
          date: event.date,
          time: event.time ?? "",
          endTime: event.endTime ?? "",
          location: event.location ?? "",
          notes: event.notes ?? "",
          colorToken: event.colorToken ?? "botanical",
        }
      : {
          name: "",
          date: "",
          time: "",
          endTime: "",
          location: "",
          notes: "",
          colorToken: "botanical",
        },
  });

  useEffect(
    () => () => {
      if (pendingCoverPhotoRef.current) {
        removeEventCoverPhoto(pendingCoverPhotoRef.current);
      }
    },
    [],
  );

  const saveValues = async (values: EventFormValues) => {
    await mutation.mutateAsync((repositories) =>
      event
        ? repositories.events.updateEvent({
            ...event,
            ...values,
            coverPhotoUri: coverPhotoUri || undefined,
            date: values.date as WeddingEvent["date"],
            time: values.time || undefined,
            endTime: values.endTime || undefined,
            location: values.location || undefined,
            notes: values.notes || undefined,
          })
        : repositories.events.createEvent({
            ...values,
            coverPhotoUri: coverPhotoUri || undefined,
            date: values.date as WeddingEvent["date"],
            time: values.time || undefined,
            endTime: values.endTime || undefined,
            location: values.location || undefined,
            notes: values.notes || undefined,
            requiredItems: [],
          }),
    );
    pendingCoverPhotoRef.current = undefined;
    if (event?.coverPhotoUri && event.coverPhotoUri !== coverPhotoUri) {
      removeEventCoverPhoto(event.coverPhotoUri);
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const save = () => {
    void handleSubmit(saveValues)();
  };

  const cancel = () => {
    if (pendingCoverPhotoRef.current) {
      removeEventCoverPhoto(pendingCoverPhotoRef.current);
      pendingCoverPhotoRef.current = undefined;
    }
    router.back();
  };

  const pickCoverPhoto = async () => {
    if (isPickingPhoto) return;
    setCoverPhotoError(undefined);
    setIsPickingPhoto(true);
    try {
      const result = await pickEventCoverPhoto();
      if (result.status === "cancelled") return;
      if (result.status === "permission-denied") {
        const openSettings = () => {
          void Linking.openSettings().catch(() => {
            Alert.alert(
              "Could not open settings",
              "Open Mangalya in your device settings and allow photo access.",
            );
          });
        };
        Alert.alert(
          "Photo access needed",
          result.canAskAgain
            ? "Allow photo access to choose an event cover."
            : "Photo access is disabled. Open device settings to choose an event cover.",
          [
            { style: "cancel", text: "Not now" },
            { onPress: openSettings, text: "Open settings" },
            ...(result.canAskAgain
              ? [{ onPress: () => void pickCoverPhoto(), text: "Try again" }]
              : []),
          ],
        );
        return;
      }
      if (pendingCoverPhotoRef.current) {
        removeEventCoverPhoto(pendingCoverPhotoRef.current);
      }
      pendingCoverPhotoRef.current = result.uri;
      setCoverPhotoUri(result.uri);
      void Haptics.selectionAsync();
    } catch (error) {
      setCoverPhotoError(eventCoverErrorMessage(error));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const removeCoverPhoto = () => {
    if (pendingCoverPhotoRef.current) {
      removeEventCoverPhoto(pendingCoverPhotoRef.current);
      pendingCoverPhotoRef.current = undefined;
    }
    setCoverPhotoUri(undefined);
    setCoverPhotoError(undefined);
  };

  const field = (
    name: "location" | "name" | "notes",
    label: string,
    icon: LucideIcon,
    options?: { multiline?: boolean; optional?: boolean; placeholder?: string; required?: boolean },
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: input }) => (
        <TextField
          error={errors[name]?.message}
          icon={icon}
          label={label}
          multiline={options?.multiline}
          onBlur={input.onBlur}
          onChangeText={input.onChange}
          optional={options?.optional}
          placeholder={options?.placeholder}
          required={options?.required}
          value={input.value}
        />
      )}
    />
  );

  return (
    <Screen>
      <FormShell
        description="Shape a celebration around the details your family chooses."
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={cancel}
        onSubmit={save}
        submitLabel={event ? "Save changes" : "Create event"}
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title={event ? "Edit event" : "Add event"}
      >
        {field("name", "Event name", PartyPopper, {
          placeholder: "e.g. Mehendi ceremony",
          required: true,
        })}
        <Controller
          control={control}
          name="date"
          render={({ field: input }) => (
            <DateField
              error={errors.date?.message}
              label="Date"
              onChange={input.onChange}
              required
              value={input.value}
            />
          )}
        />
        <View className="flex-row flex-wrap gap-sm">
          <View className="min-w-40 flex-1">
            <Controller
              control={control}
              name="time"
              render={({ field: input }) => (
                <TimeField
                  error={errors.time?.message}
                  icon={Clock3}
                  label="Start time"
                  onChange={input.onChange}
                  optional
                  value={input.value}
                />
              )}
            />
          </View>
          <View className="min-w-40 flex-1">
            <Controller
              control={control}
              name="endTime"
              render={({ field: input }) => (
                <TimeField
                  error={errors.endTime?.message}
                  icon={Clock3}
                  label="End time"
                  onChange={input.onChange}
                  optional
                  value={input.value}
                />
              )}
            />
          </View>
        </View>
        {field("location", "Venue", MapPin, {
          optional: true,
          placeholder: "Venue name or address",
        })}
        <Controller
          control={control}
          name="colorToken"
          render={({ field: input }) => (
            <EventColorField
              error={errors.colorToken?.message}
              onChange={input.onChange}
              value={input.value}
            />
          )}
        />
        <ImagePickerField
          error={coverPhotoError}
          label="Cover photo"
          loading={isPickingPhoto}
          onPick={() => void pickCoverPhoto()}
          onRemove={removeCoverPhoto}
          uri={coverPhotoUri}
        />
        {field("notes", "Notes", StickyNote, {
          multiline: true,
          optional: true,
          placeholder: "Add details or special notes",
        })}
      </FormShell>
    </Screen>
  );
}
