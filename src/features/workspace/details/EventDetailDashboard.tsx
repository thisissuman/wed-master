import { expenseAmountLabel, netExpensePaise } from "../expense-amount";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import Clock3 from "lucide-react-native/icons/clock-3";
import MapPin from "lucide-react-native/icons/map-pin";
import Pencil from "lucide-react-native/icons/pencil";
import ReceiptIndianRupee from "lucide-react-native/icons/receipt-indian-rupee";
import { useState } from "react";
import { Alert, Pressable, View } from "react-native";

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
import { formatTimeOfDay } from "@/lib/dates";
import { useTodayDateOnly } from "@/lib/dates/useTodayDateOnly";
import { toUserMessage } from "@/lib/errors";
import { formatInr } from "@/lib/money";
import { tokens, useAppTheme } from "@/theme";
import { useUnlinkInspirationEventMutation } from "@/features/inspire/workspace-integration";

import { removeEventCoverPhoto } from "../files/workspace-files";
import { cleanupSummary, coordinateLocalLifecycle } from "../lifecycle/local-lifecycle";
import { ExpenseCategoryIcon } from "../money/ExpenseCategoryIcon";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { TaskCompletionRow } from "../TaskCompletionRow";
import type { BudgetCategory, Expense } from "../types";
import { useTaskStatusAction } from "../useTaskStatusAction";
import { DetailHeader, formatDate } from "../ui";
import { buildEventDetailItems } from "./event-detail-items";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const bottomClearance = Number.parseInt(tokens.spacing["2xl"], 10);

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View className="min-w-32 flex-1 flex-row items-center gap-xs">
      <View className="h-10 w-10 items-center justify-center rounded-control bg-elevatedSurface">
        <Icon color={theme.colors.primary} size={tokens.iconSize.sm} />
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
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={`Open expense: ${expense.title}, ${expenseAmountLabel(expense)}`}
      accessibilityRole="button"
      android_ripple={{ color: theme.colors.surfaceMuted }}
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
      <AppText
        className="shrink-0 text-right"
        tone={expense.direction === "refund" ? "success" : "danger"}
        variant="label"
      >
        {expenseAmountLabel(expense)}
      </AppText>
    </Pressable>
  );
}

export function EventDetailDashboard({ eventId }: { eventId: string }) {
  const theme = useAppTheme();
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const taskStatus = useTaskStatusAction();
  const unlinkInspirationEventMutation = useUnlinkInspirationEventMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const today = useTodayDateOnly();

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
  const spent = expenses.reduce((sum, expense) => sum + netExpensePaise(expense), 0);
  const items = buildEventDetailItems(event, tasks, expenses);

  const deleteEvent = async () => {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    let outcome;
    try {
      outcome = await coordinateLocalLifecycle(
        () => mutation.mutateAsync((repositories) => repositories.events.deleteEvent(event.id)),
        [
          {
            area: "inspire-event-links",
            run: async () => {
              await unlinkInspirationEventMutation.mutateAsync({
                weddingId: workspace.data.wedding.id,
                eventId: event.id,
              });
            },
          },
          ...(event.coverPhotoUri
            ? [
                {
                  area: "workspace-covers" as const,
                  run: () => removeEventCoverPhoto(event.coverPhotoUri),
                },
              ]
            : []),
        ],
      );
    } catch (error) {
      Alert.alert("Could not delete event", toUserMessage(error));
      setLifecycleBusy(false);
      return;
    }
    setLifecycleBusy(false);
    router.replace("/plan");
    if (outcome.cleanupFailures.length) {
      Alert.alert(
        "Event deleted",
        `The event was deleted, but cleanup is still needed for: ${cleanupSummary(outcome.cleanupFailures)}. Mangalya will retry managed-file cleanup later.`,
      );
    }
  };

  return (
    <Screen edges={["top", "right", "bottom", "left"]}>
      <FlashList
        contentContainerStyle={{
          padding: contentPadding,
          paddingBottom: bottomClearance,
        }}
        data={items}
        drawDistance={720}
        getItemType={(item) => item.type}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          switch (item.type) {
            case "summary":
              return (
                <View className="gap-md pb-lg">
                  <View className="flex-row items-start gap-xs">
                    <View className="min-w-0 flex-1">
                      <DetailHeader fallback="/plan" title={event.name} />
                    </View>
                    <Button
                      icon={Pencil}
                      label="Edit"
                      onPress={() =>
                        router.navigate({ pathname: "/events/edit", params: { id: event.id } })
                      }
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
                    {event.location ? (
                      <Fact icon={MapPin} label="Venue" value={event.location} />
                    ) : null}
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
                </View>
              );
            case "task-section":
              return (
                <View className="gap-xs pb-xs">
                  <SectionHeader title="Related tasks" />
                  {taskStatus.isError ? (
                    <View accessibilityRole="alert" className="rounded-control bg-dangerSoft p-md">
                      <AppText tone="danger" variant="caption">
                        {toUserMessage(taskStatus.error)} Use Retry in the message below.
                      </AppText>
                    </View>
                  ) : null}
                </View>
              );
            case "task":
              return (
                <View className="pb-xs">
                  <TaskCompletionRow
                    disabled={taskStatus.isPending}
                    eventName={event.name}
                    onPress={() => router.navigate(`/tasks/${item.task.id}`)}
                    onToggle={() => taskStatus.toggleTaskStatus(item.task)}
                    task={item.task}
                    today={today}
                  />
                </View>
              );
            case "task-empty":
              return (
                <View className="pb-lg">
                  <EmptyState
                    actionLabel="Add task"
                    description="Add preparation work for this event."
                    onAction={() =>
                      router.navigate({ pathname: "/tasks/new", params: { eventId: event.id } })
                    }
                    title="No related tasks"
                  />
                </View>
              );
            case "note":
              return (
                <View className="gap-xs rounded-card bg-surfaceMuted p-md mb-lg">
                  <SectionHeader title="Event notes" />
                  <AppText>{item.note}</AppText>
                </View>
              );
            case "expense-section":
              return (
                <View className="flex-row items-center gap-sm rounded-t-card border-b border-borderSubtle bg-elevatedSurface px-md py-md shadow-card">
                  <View className="h-12 w-12 items-center justify-center rounded-control bg-accentSoft">
                    <ReceiptIndianRupee color={theme.colors.accent} size={tokens.iconSize.md} />
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
              );
            case "expense": {
              const lastExpense = expenses[expenses.length - 1]?.id === item.expense.id;
              return (
                <View
                  className={`bg-elevatedSurface px-md ${lastExpense ? "rounded-b-card pb-xs" : ""}`}
                >
                  <EventExpenseRow
                    category={categoryById.get(item.expense.categoryId)}
                    expense={item.expense}
                    onPress={() => router.navigate(`/expenses/${item.expense.id}`)}
                  />
                </View>
              );
            }
            case "expense-empty":
              return (
                <View className="rounded-b-card bg-elevatedSurface px-md pb-md pt-sm">
                  <AppText tone="muted">Link an expense to this event to see it here.</AppText>
                </View>
              );
            case "action":
              return (
                <View className="pt-lg">
                  <Button
                    disabled={lifecycleBusy}
                    label="Delete event"
                    onPress={() => setDeleteOpen(true)}
                    variant="dangerGhost"
                  />
                </View>
              );
          }
        }}
        showsVerticalScrollIndicator={false}
      />
      <ConfirmationDialog
        confirmLabel="Delete event"
        description="Tasks, expenses, and inspiration will stay in your workspace but will no longer be linked to this event."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteEvent()}
        pending={mutation.isPending || unlinkInspirationEventMutation.isPending || lifecycleBusy}
        title="Delete this event?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
