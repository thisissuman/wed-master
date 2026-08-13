import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  AlignLeft,
  Ban,
  CalendarDays,
  CalendarHeart,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Flag,
  ListTodo,
  LoaderCircle,
  StickyNote,
  Tag,
  UserRound,
} from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import {
  Button,
  ConfirmationDialog,
  DateField,
  Disclosure,
  Screen,
  SelectField,
  type SelectOption,
  TextField,
} from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import {
  feedbackActionDurationMilliseconds,
  useFeedbackStore,
} from "@/features/feedback/feedback-store";

import { taskFormSchema, type TaskFormValues } from "./forms";
import { useCreatedItemHighlight } from "./created-item-highlight";
import { removeWorkspaceAttachment } from "./files/workspace-files";
import { useWorkspace, useWorkspaceMutation } from "./provider";
import { taskPriorities, taskStatuses, type Task } from "./types";
import { FormShell } from "./ui";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

const priorityOptions: SelectOption[] = taskPriorities.map((value) => ({
  label: value,
  description:
    value === "Critical"
      ? "Needs immediate attention"
      : value === "High"
        ? "Important and time-sensitive"
        : value === "Medium"
          ? "Normal planning priority"
          : "Can wait until later",
  tone:
    value === "Critical"
      ? "danger"
      : value === "High"
        ? "warning"
        : value === "Medium"
          ? "primary"
          : "muted",
  value,
}));

const statusIcons = {
  Cancelled: Ban,
  Completed: CheckCircle2,
  "In Progress": LoaderCircle,
  "Not Started": CircleDashed,
} as const;

const statusOptions: SelectOption[] = taskStatuses.map((value) => ({
  icon: statusIcons[value],
  label: value,
  tone:
    value === "Completed"
      ? "success"
      : value === "Cancelled"
        ? "muted"
        : value === "In Progress"
          ? "primary"
          : "warning",
  value,
}));

export function TaskForm({ initialEventId = "", task }: { initialEventId?: string; task?: Task }) {
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const markCreatedItem = useCreatedItemHighlight((state) => state.mark);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    mode: "onTouched",
    defaultValues: task
      ? {
          title: task.title,
          notes: task.notes ?? "",
          description: task.description ?? "",
          category: task.category ?? "",
          eventId: task.eventId ?? "",
          dueDate: task.dueDate ?? "",
          priority: task.priority,
          status: task.status,
          responsiblePerson: task.responsiblePerson ?? "",
        }
      : {
          title: "",
          notes: "",
          description: "",
          category: "",
          eventId: initialEventId,
          dueDate: "",
          priority: "Medium",
          status: "Not Started",
          responsiblePerson: "",
        },
  });

  const { exitAfterSave, requestExit } = useUnsavedChangesGuard({
    isDirty,
    isSubmitting: isSubmitting || mutation.isPending,
  });

  const save = handleSubmit(async (values) => {
    const linkedEvent = data?.events.find((event) => event.id === values.eventId);
    if (values.dueDate && linkedEvent && values.dueDate > linkedEvent.date) {
      setError("dueDate", {
        message: `Choose a date on or before ${formatDateOnly(linkedEvent.date)}.`,
        type: "validate",
      });
      return;
    }
    const snapshot = await mutation.mutateAsync((repositories) =>
      task
        ? repositories.tasks.updateTask({
            ...task,
            ...values,
            dueDate: (values.dueDate || undefined) as Task["dueDate"],
            eventId: values.eventId || undefined,
            notes: values.notes || undefined,
            description: values.description || undefined,
            category: values.category || undefined,
            responsiblePerson: values.responsiblePerson || undefined,
          })
        : repositories.tasks.createTask({
            ...values,
            dueDate: (values.dueDate || undefined) as Task["dueDate"],
            eventId: values.eventId || undefined,
            notes: values.notes || undefined,
            description: values.description || undefined,
            category: values.category || undefined,
            responsiblePerson: values.responsiblePerson || undefined,
            checklist: [],
            attachments: [],
          }),
    );
    if (!task) {
      const existingIds = new Set(data?.tasks.map((item) => item.id) ?? []);
      const created = snapshot.tasks.find((item) => !existingIds.has(item.id));
      if (created) markCreatedItem("task", [created.id]);
    }
    exitAfterSave();
  });

  const text = (
    name: "category" | "description" | "notes" | "responsiblePerson" | "title",
    label: string,
    icon: LucideIcon,
    options?: { multiline?: boolean; optional?: boolean; placeholder?: string; required?: boolean },
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          autoCapitalize="sentences"
          autoComplete={name === "responsiblePerson" ? "name" : "off"}
          autoFocus={name === "title"}
          error={errors[name]?.message}
          icon={icon}
          label={label}
          multiline={options?.multiline}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          optional={options?.optional}
          placeholder={options?.placeholder}
          returnKeyType={options?.multiline ? "default" : "done"}
          required={options?.required}
          value={field.value}
        />
      )}
    />
  );

  const select = (
    name: "eventId" | "priority" | "status",
    label: string,
    icon: LucideIcon,
    options: SelectOption[],
    optional = false,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          error={errors[name]?.message}
          icon={icon}
          label={label}
          onChange={field.onChange}
          optional={optional}
          options={options}
          value={field.value}
        />
      )}
    />
  );

  const eventOptions: SelectOption[] = [
    {
      description: "Not tied to a specific celebration",
      icon: ClipboardList,
      label: "General task",
      value: "",
    },
    ...(data?.events ?? []).map((event) => ({
      description: [formatDateOnly(event.date), event.location].filter(Boolean).join(" · "),
      icon: CalendarHeart,
      label: event.name,
      value: event.id,
    })),
  ];

  const detailsAlreadyAdded = Boolean(
    task && (task.category || task.notes || task.status !== "Not Started"),
  );

  const deleteTask = async () => {
    if (!task) return;
    await mutation.mutateAsync((repositories) => repositories.tasks.deleteTask(task.id));
    let restored = false;
    setTimeout(() => {
      if (!restored) task.attachments.forEach(removeWorkspaceAttachment);
    }, feedbackActionDurationMilliseconds);
    showFeedback({
      actionLabel: "Undo",
      message: "Task deleted",
      onAction: async () => {
        restored = true;
        await mutation.mutateAsync((repositories) => repositories.tasks.restoreTask(task));
      },
    });
    router.replace("/plan");
  };

  return (
    <Screen>
      <FormShell
        isSubmitting={isSubmitting || mutation.isPending}
        onCancel={requestExit}
        onSubmit={save}
        submitLabel={task ? "Save changes" : "Create task"}
        submissionError={mutation.error ? toUserMessage(mutation.error) : undefined}
        title={task ? "Edit task" : "Add task"}
      >
        {text("title", "Task title", ListTodo, {
          placeholder: "e.g. Confirm wedding photographer",
          required: true,
        })}
        {select("eventId", "Linked event", CalendarHeart, eventOptions, true)}
        <Controller
          control={control}
          name="dueDate"
          render={({ field }) => (
            <DateField
              error={errors.dueDate?.message}
              icon={CalendarDays}
              label="Due date"
              onChange={field.onChange}
              optional
              value={field.value}
            />
          )}
        />
        {select("priority", "Priority", Flag, priorityOptions)}
        {text("responsiblePerson", "Assigned to", UserRound, {
          optional: true,
          placeholder: "Name of the person responsible",
        })}
        {text("description", "Description", AlignLeft, {
          multiline: true,
          optional: true,
          placeholder: "Add useful context or instructions",
        })}
        <Disclosure
          description="Status, category, and private planning notes."
          initiallyExpanded={detailsAlreadyAdded}
          title="More task details"
        >
          {select("status", "Status", CircleDashed, statusOptions)}
          {text("category", "Category", Tag, {
            optional: true,
            placeholder: "e.g. Venue and logistics",
          })}
          {text("notes", "Notes", StickyNote, {
            multiline: true,
            optional: true,
            placeholder: "Anything else to remember",
          })}
        </Disclosure>
        {task ? (
          <Button label="Delete task" onPress={() => setDeleteOpen(true)} variant="dangerGhost" />
        ) : null}
      </FormShell>
      <ConfirmationDialog
        confirmLabel="Delete task"
        description="This task and its saved local files will be removed."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteTask()}
        pending={mutation.isPending}
        title="Delete this task?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
