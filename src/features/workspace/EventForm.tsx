import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Check, Clock3, MapPin, Palette, PartyPopper, StickyNote } from "lucide-react-native";
import { useRef } from "react";
import { View, type TextInput } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppText, DateField, MotionPressable, Screen, TextField, TimeField } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { tokens } from "@/theme";

import { eventFormSchema, type EventFormValues } from "./forms";
import { useWorkspaceMutation } from "./provider";
import { eventColorKeys, type EventColorKey, type WeddingEvent } from "./types";
import { FormShell } from "./ui";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

const eventColors: Record<EventColorKey, { color: string; label: string }> = {
  botanical: { color: tokens.colors.eventBotanical, label: "Lavender" },
  gold: { color: tokens.colors.eventGold, label: "Antique gold" },
  terracotta: { color: tokens.colors.eventTerracotta, label: "Terracotta" },
  sage: { color: tokens.colors.eventSage, label: "Sage" },
};

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
                selected ? "border-primary bg-primarySoft" : "border-borderSubtle"
              }`}
              key={key}
              onPress={() => {
                onChange(key);
                void Haptics.selectionAsync();
              }}
              pressedScale={0.92}
              style={selected ? { boxShadow: tokens.elevation.card } : undefined}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: option.color }}
              >
                {selected ? (
                  <Check color={tokens.colors.textPrimary} size={tokens.iconSize.md} />
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
  const showFeedback = useFeedbackStore((state) => state.show);
  const locationInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    mode: "onTouched",
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
  const { exitAfterSave, requestExit } = useUnsavedChangesGuard({
    isDirty,
    isSubmitting: isSubmitting || mutation.isPending,
  });

  const saveValues = async (values: EventFormValues) => {
    await mutation.mutateAsync((repositories) =>
      event
        ? repositories.events.updateEvent({
            ...event,
            ...values,
            date: values.date as WeddingEvent["date"],
            time: values.time || undefined,
            endTime: values.endTime || undefined,
            location: values.location || undefined,
            notes: values.notes || undefined,
          })
        : repositories.events.createEvent({
            ...values,
            date: values.date as WeddingEvent["date"],
            time: values.time || undefined,
            endTime: values.endTime || undefined,
            location: values.location || undefined,
            notes: values.notes || undefined,
            requiredItems: [],
          }),
    );
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showFeedback({ message: event ? "Event updated" : "Event created" });
    exitAfterSave();
  };

  const save = () => {
    void handleSubmit(saveValues)();
  };

  const cancel = () => {
    requestExit();
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
          autoCapitalize="sentences"
          autoComplete="off"
          autoFocus={name === "name"}
          error={errors[name]?.message}
          icon={icon}
          label={label}
          multiline={options?.multiline}
          onBlur={input.onBlur}
          onChangeText={input.onChange}
          onSubmitEditing={
            name === "name"
              ? () => locationInputRef.current?.focus()
              : name === "location"
                ? () => notesInputRef.current?.focus()
                : undefined
          }
          optional={options?.optional}
          placeholder={options?.placeholder}
          ref={
            name === "location" ? locationInputRef : name === "notes" ? notesInputRef : undefined
          }
          returnKeyType={options?.multiline ? "default" : "next"}
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
        {field("notes", "Notes", StickyNote, {
          multiline: true,
          optional: true,
          placeholder: "Add details or special notes",
        })}
      </FormShell>
    </Screen>
  );
}
