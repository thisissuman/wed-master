import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppText, Button, DateField, Screen, SelectField, TextField } from "@/components/ui";
import { taskFormSchema, type TaskFormValues } from "./forms";
import { useWorkspace, useWorkspaceMutation } from "./provider";
import { taskPriorities, taskStatuses, type Task } from "./types";
export function TaskForm({ task }: { task?: Task }) {
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task
      ? {
          title: task.title,
          notes: task.notes ?? "",
          eventId: task.eventId ?? "",
          dueDate: task.dueDate ?? "",
          priority: task.priority,
          status: task.status,
          responsiblePerson: task.responsiblePerson ?? "",
        }
      : {
          title: "",
          notes: "",
          eventId: "",
          dueDate: "",
          priority: "Medium",
          status: "Not Started",
          responsiblePerson: "",
        },
  });
  const save = handleSubmit(async (values) => {
    await mutation.mutateAsync((repositories) =>
      task
        ? repositories.tasks.updateTask({
            ...task,
            ...values,
            dueDate: (values.dueDate || undefined) as Task["dueDate"],
            eventId: values.eventId || undefined,
            notes: values.notes || undefined,
            responsiblePerson: values.responsiblePerson || undefined,
          })
        : repositories.tasks.createTask({
            ...values,
            dueDate: (values.dueDate || undefined) as Task["dueDate"],
            eventId: values.eventId || undefined,
            notes: values.notes || undefined,
            responsiblePerson: values.responsiblePerson || undefined,
          }),
    );
    router.back();
  });
  const text = (
    name: keyof TaskFormValues,
    label: string,
    placeholder?: string,
    multiline?: boolean,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          error={errors[name]?.message}
          label={label}
          multiline={multiline}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          placeholder={placeholder}
          value={field.value}
        />
      )}
    />
  );
  const select = (
    name: "eventId" | "priority" | "status",
    label: string,
    options: { label: string; value: string }[],
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          error={errors[name]?.message}
          label={label}
          onChange={field.onChange}
          options={options}
          value={field.value}
        />
      )}
    />
  );
  const dateField = (
    <Controller
      control={control}
      name="dueDate"
      render={({ field }) => (
        <DateField
          error={errors.dueDate?.message}
          label="Due date"
          onChange={field.onChange}
          value={field.value}
        />
      )}
    />
  );
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-lg p-md" keyboardShouldPersistTaps="handled">
        <View className="gap-2xs">
          <AppText variant="title">{task ? "Edit task" : "Add task"}</AppText>
          <AppText variant="caption">Keep each task specific and easy to hand off.</AppText>
        </View>
        {text("title", "Task title")}
        {text("notes", "Notes", undefined, true)}
        {select("eventId", "Related event", [
          { label: "General task", value: "" },
          ...(data?.events ?? []).map((event) => ({ label: event.name, value: event.id })),
        ])}
        {dateField}
        {select(
          "priority",
          "Priority",
          taskPriorities.map((value) => ({ label: value, value })),
        )}
        {select(
          "status",
          "Status",
          taskStatuses.map((value) => ({ label: value, value })),
        )}
        {text("responsiblePerson", "Responsible person")}
        <Button
          disabled={isSubmitting || mutation.isPending}
          label={task ? "Save changes" : "Create task"}
          loading={isSubmitting || mutation.isPending}
          onPress={save}
        />
        <Button label="Cancel" onPress={() => router.back()} variant="ghost" />
      </ScrollView>
    </Screen>
  );
}
