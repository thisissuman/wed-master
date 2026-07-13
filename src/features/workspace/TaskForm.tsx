import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DateField, Disclosure, Screen, SelectField, TextField } from "@/components/ui";

import { taskFormSchema, type TaskFormValues } from "./forms";
import { useWorkspace, useWorkspaceMutation } from "./provider";
import { taskPriorities, taskStatuses, type Task } from "./types";
import { FormShell } from "./ui";

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

  const dueDateField = (
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

  const detailsAlreadyAdded = task
    ? Boolean(
        task.eventId ||
          task.dueDate ||
          task.notes ||
          task.responsiblePerson ||
          task.priority !== "Medium" ||
          task.status !== "Not Started",
      )
    : false;

  return (
    <Screen>
      <FormShell
        description="Start with one action. You can add context only when it helps."
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={() => router.back()}
        onSubmit={save}
        submitLabel={task ? "Save changes" : "Create task"}
        title={task ? "Edit task" : "Add task"}
      >
        {text("title", "What needs to be done?", "e.g. Confirm catering menu")}
        <Disclosure
          description="Set a due date, related event, priority, owner, or notes."
          initiallyExpanded={detailsAlreadyAdded}
          title="Add details"
        >
          {select("eventId", "Related event", [
            { label: "General task", value: "" },
            ...(data?.events ?? []).map((event) => ({ label: event.name, value: event.id })),
          ])}
          {dueDateField}
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
          {text("notes", "Notes", undefined, true)}
        </Disclosure>
      </FormShell>
    </Screen>
  );
}
