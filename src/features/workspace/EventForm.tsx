import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppText, Button, DateField, Screen, TextField } from "@/components/ui";
import { eventFormSchema, type EventFormValues } from "./forms";
import { useWorkspaceMutation } from "./provider";
import type { WeddingEvent } from "./types";
export function EventForm({ event }: { event?: WeddingEvent }) {
  const mutation = useWorkspaceMutation();
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
          location: event.location ?? "",
          notes: event.notes ?? "",
        }
      : { name: "", date: "", time: "", location: "", notes: "" },
  });
  const save = handleSubmit(async (values) => {
    await mutation.mutateAsync((repositories) =>
      event
        ? repositories.events.updateEvent({
            ...event,
            ...values,
            date: values.date as WeddingEvent["date"],
            time: values.time || undefined,
            location: values.location || undefined,
            notes: values.notes || undefined,
          })
        : repositories.events.createEvent({
            ...values,
            date: values.date as WeddingEvent["date"],
            time: values.time || undefined,
            location: values.location || undefined,
            notes: values.notes || undefined,
          }),
    );
    router.back();
  });
  const field = (
    name: keyof EventFormValues,
    label: string,
    placeholder?: string,
    multiline?: boolean,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: input }) => (
        <TextField
          error={errors[name]?.message}
          label={label}
          multiline={multiline}
          onBlur={input.onBlur}
          onChangeText={input.onChange}
          placeholder={placeholder}
          value={input.value}
        />
      )}
    />
  );
  const dateField = (
    <Controller
      control={control}
      name="date"
      render={({ field: input }) => (
        <DateField
          error={errors.date?.message}
          label="Date"
          onChange={input.onChange}
          value={input.value}
        />
      )}
    />
  );
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-lg p-md" keyboardShouldPersistTaps="handled">
        <View className="gap-2xs">
          <AppText variant="title">{event ? "Edit event" : "Add event"}</AppText>
          <AppText variant="caption">All ceremonies remain fully customisable.</AppText>
        </View>
        {field("name", "Event name", "e.g. Haldi")}
        {dateField}
        {field("time", "Time", "HH:MM")}
        {field("location", "Location")}
        {field("notes", "Notes", undefined, true)}
        <Button
          disabled={isSubmitting || mutation.isPending}
          label={event ? "Save changes" : "Create event"}
          loading={isSubmitting || mutation.isPending}
          onPress={save}
        />
        <Button label="Cancel" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    </Screen>
  );
}
