import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { CalendarDays, Clock3, MapPin, Pencil, ReceiptIndianRupee } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import {
  AppText,
  Button,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { formatTimeOfDay, todayDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { formatInr } from "@/lib/money";
import { tokens } from "@/theme";

import { removeEventCoverPhoto } from "../files/workspace-files";
import { ExpenseCategoryIcon } from "../money/ExpenseCategoryIcon";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { TaskCompletionRow } from "../TaskCompletionRow";
import type { BudgetCategory, Expense, Task } from "../types";
import { DetailHeader, formatDate } from "../ui";

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <View className="min-w-32 flex-1 flex-row items-center gap-xs">
      <View className="h-10 w-10 items-center justify-center rounded-control bg-elevatedSurface">
        <Icon color={tokens.colors.primary} size={tokens.iconSize.sm} />
      </View>
      <View className="min-w-0 flex-1 gap-2xs">
        <AppText tone="muted" variant="caption">
          {label}
        </AppText>
        <AppText numberOfLines={2} variant="label">
          {value}
        </AppText>
      </View>
    </View>
  );
}

function EventExpenseRow({
  category,
  expense,
  onPress,
}: {
  category?: BudgetCategory;
  expense: Expense;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Open expense: ${expense.title}, ${formatInr(expense.actualPaise)}`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.surfaceMuted }}
      className="min-h-16 flex-row items-center gap-sm border-b border-borderSubtle py-sm last:border-b-0 active:bg-surfaceMuted"
      onPress={onPress}
    >
      <ExpenseCategoryIcon iconKey={category?.iconKey ?? "other"} size="sm" />
      <View className="min-w-0 flex-1 gap-2xs">
        <AppText numberOfLines={2} variant="label">
          {expense.title}
        </AppText>
        <AppText tone="muted" variant="caption">
          {[category?.name ?? "Uncategorised", expense.date ? formatDate(expense.date) : undefined]
            .filter(Boolean)
            .join(" · ")}
        </AppText>
      </View>
      <AppText className="shrink-0 text-right" tone="primary" variant="label">
        {formatInr(expense.actualPaise)}
      </AppText>
    </Pressable>
  );
}

export function EventDetailDashboard({ eventId }: { eventId: string }) {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [today] = useState(() => todayDateOnly());

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md" edges={["top", "right", "bottom", "left"]}>
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open this event"
          />
        </Screen>
      );
    }
    return (
      <Screen edges={["top", "right", "bottom", "left"]}>
        <LoadingState label="Opening event" />
      </Screen>
    );
  }

  const event = workspace.data.events.find((item) => item.id === eventId);
  if (!event) {
    return (
      <Screen className="justify-center p-md" edges={["top", "right", "bottom", "left"]}>
        <ErrorState message="This event may have been deleted." title="Event not found" />
      </Screen>
    );
  }

  const tasks = workspace.data.tasks.filter((task) => task.eventId === event.id);
  const expenses = workspace.data.expenses.filter((expense) => expense.eventId === event.id);
  const categoryById = new Map(
    workspace.data.categories.map((category) => [category.id, category]),
  );
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const progress = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
  const spent = expenses.reduce((sum, expense) => sum + expense.actualPaise, 0);

  const toggleTask = (task: Task) => {
    if (mutation.isPending) return;
    mutation.mutate(
      (repositories) =>
        repositories.tasks.updateTask({
          ...task,
          status: task.status === "Completed" ? "Not Started" : "Completed",
        }),
      { onSuccess: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
    );
  };

  const deleteEvent = async () => {
    await mutation.mutateAsync((repositories) => repositories.events.deleteEvent(event.id));
    if (event.coverPhotoUri) removeEventCoverPhoto(event.coverPhotoUri);
    router.replace("/plan");
  };

  return (
    <Screen edges={["top", "right", "bottom", "left"]}>
      <ScrollView
        contentContainerClassName="gap-lg p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start gap-xs">
          <View className="min-w-0 flex-1">
            <DetailHeader fallback="/plan" title={event.name} />
          </View>
          <Button
            icon={Pencil}
            label="Edit"
            onPress={() => router.navigate({ pathname: "/events/edit", params: { id: event.id } })}
            variant="ghost"
          />
        </View>

        <View className="gap-md rounded-card bg-primarySoft p-md">
          <View className="flex-row flex-wrap gap-md">
            <Fact icon={CalendarDays} label="Date" value={formatDate(event.date)} />
            {event.time ? (
              <Fact
                icon={Clock3}
                label="Time"
                value={`${formatTimeOfDay(event.time)}${event.endTime ? ` – ${formatTimeOfDay(event.endTime)}` : ""}`}
              />
            ) : null}
          </View>
          {event.location ? <Fact icon={MapPin} label="Venue" value={event.location} /> : null}
          <View className="gap-xs border-t border-borderStrong pt-sm">
            <View className="flex-row justify-between gap-sm">
              <AppText variant="label">Preparation progress</AppText>
              <AppText tone="primary" variant="caption">
                {completedTasks}/{tasks.length} tasks
              </AppText>
            </View>
            <ProgressBar accessibilityLabel="Event task progress" value={progress} />
          </View>
        </View>

        <View className="gap-xs">
          <SectionHeader title="Related tasks" />
          {mutation.isError ? (
            <View accessibilityRole="alert" className="rounded-control bg-dangerSoft p-md">
              <AppText tone="danger" variant="caption">
                {toUserMessage(mutation.error)} Try the task update again.
              </AppText>
            </View>
          ) : null}
          {tasks.length ? (
            tasks.map((task) => (
              <TaskCompletionRow
                disabled={mutation.isPending}
                eventName={event.name}
                key={task.id}
                onPress={() => router.navigate(`/tasks/${task.id}`)}
                onToggle={() => toggleTask(task)}
                task={task}
                today={today}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add task"
              description="Add preparation work for this event."
              onAction={() =>
                router.navigate({ pathname: "/tasks/new", params: { eventId: event.id } })
              }
              title="No related tasks"
            />
          )}
        </View>

        {event.notes ? (
          <View className="gap-xs rounded-card bg-surfaceMuted p-md">
            <SectionHeader title="Event notes" />
            <AppText>{event.notes}</AppText>
          </View>
        ) : null}

        <View className="overflow-hidden rounded-card bg-elevatedSurface px-md shadow-card">
          <View className="flex-row items-center gap-sm border-b border-borderSubtle py-md">
            <View className="h-12 w-12 items-center justify-center rounded-control bg-accentSoft">
              <ReceiptIndianRupee color={tokens.colors.accent} size={tokens.iconSize.md} />
            </View>
            <View className="min-w-0 flex-1">
              <SectionHeader title="Linked expenses" />
              <AppText tone="muted" variant="caption">
                {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
              </AppText>
            </View>
            <AppText className="shrink-0 text-right" tone="primary" variant="heading">
              {formatInr(spent)}
            </AppText>
          </View>
          {expenses.length ? (
            expenses.map((expense) => (
              <EventExpenseRow
                category={categoryById.get(expense.categoryId)}
                expense={expense}
                key={expense.id}
                onPress={() => router.navigate(`/expenses/${expense.id}`)}
              />
            ))
          ) : (
            <AppText className="py-md" tone="muted">
              Link an expense to this event to see it here.
            </AppText>
          )}
        </View>

        <Button label="Delete event" onPress={() => setDeleteOpen(true)} variant="dangerGhost" />
      </ScrollView>
      <ConfirmationDialog
        confirmLabel="Delete event"
        description="Tasks and expenses will stay in your workspace but will no longer be linked."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteEvent()}
        pending={mutation.isPending}
        title="Delete this event?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
