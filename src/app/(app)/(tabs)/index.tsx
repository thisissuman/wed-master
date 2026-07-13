import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Plus } from "lucide-react-native";
import { router } from "expo-router";

import { AppText, Button, EmptyState, LoadingState, Screen, SectionHeader } from "@/components/ui";
import { todayDateOnly } from "@/lib/dates";
import { expenseTotals, useWorkspace, useWorkspaceMutation } from "@/features/workspace";
import { formatDate, HomeBudgetSnapshot, PageHeader, TaskListItem } from "@/features/workspace/ui";
import { QuickAddSheet } from "@/features/workspace/QuickAddSheet";
import type { Task } from "@/features/workspace";

const priorityOrder: Record<Task["priority"], number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export default function HomeScreen() {
  const [today] = useState(() => todayDateOnly());
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { data, isLoading } = useWorkspace();
  const mutation = useWorkspaceMutation();

  if (isLoading || !data) {
    return (
      <Screen>
        <LoadingState label="Opening your wedding workspace" />
      </Screen>
    );
  }

  const totals = expenseTotals(data.expenses);
  const upcomingEvents = [...data.events]
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder);
  const nextEvent = upcomingEvents[0];
  const upcomingTasks = [...data.tasks]
    .filter((task) => task.status !== "Completed" && task.status !== "Cancelled")
    .sort((left, right) => {
      const leftOverdue = Boolean(left.dueDate && left.dueDate < today);
      const rightOverdue = Boolean(right.dueDate && right.dueDate < today);
      if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
      const priorityDifference = priorityOrder[left.priority] - priorityOrder[right.priority];
      if (priorityDifference) return priorityDifference;
      return (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31");
    })
    .slice(0, 3);
  const days = Math.max(
    0,
    Math.ceil(
      (new Date(`${data.wedding.date}T12:00:00`).getTime() -
        new Date(`${today}T12:00:00`).getTime()) /
        86_400_000,
    ),
  );

  const toggleTask = (task: Task) => {
    mutation.mutate((repositories) =>
      repositories.tasks.updateTask({
        ...task,
        status: task.status === "Completed" ? "Not Started" : "Completed",
      }),
    );
  };

  const openAddRoute = (route: "/events/new" | "/expenses/new" | "/tasks/new") => {
    setQuickAddOpen(false);
    router.push(route);
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-xl">
        <View className="gap-lg border-b border-border pb-lg">
          <PageHeader title={data.wedding.name} />
          <View className="gap-2xs">
            <AppText variant="display">{days} days to go</AppText>
            <AppText variant="caption">
              {formatDate(data.wedding.date)}
              {data.wedding.location ? ` · ${data.wedding.location}` : ""}
            </AppText>
          </View>
          {nextEvent ? (
            <View className="gap-2xs rounded-card bg-surfaceSubtle p-md">
              <AppText className="text-brand" variant="caption">
                NEXT EVENT
              </AppText>
              <AppText variant="label">{nextEvent.name}</AppText>
              <AppText variant="caption">{formatDate(nextEvent.date)}</AppText>
            </View>
          ) : null}
        </View>

        <View className="gap-xs">
          <SectionHeader
            actionLabel="View all"
            onAction={() => router.push({ pathname: "/plan", params: { view: "tasks" } })}
            title="Next actions"
          />
          {upcomingTasks.length ? (
            upcomingTasks.map((task) => (
              <TaskListItem
                eventName={data.events.find((event) => event.id === task.eventId)?.name}
                key={task.id}
                onPress={() => router.push(`/tasks/${task.id}`)}
                onToggle={() => toggleTask(task)}
                task={task}
                today={today}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add task"
              description="Add the first action that will move the plan forward."
              onAction={() => openAddRoute("/tasks/new")}
              title="Nothing needs attention"
            />
          )}
        </View>

        <View className="gap-xs">
          <SectionHeader title="Budget snapshot" />
          <HomeBudgetSnapshot
            actualPaise={totals.actualPaise}
            estimatedPaise={totals.estimatedPaise}
            outstandingPaise={totals.outstandingPaise}
          />
        </View>
      </ScrollView>
      <View className="border-t border-border bg-surface p-md">
        <Button icon={Plus} label="Add" onPress={() => setQuickAddOpen(true)} />
      </View>
      <QuickAddSheet
        onAddEvent={() => openAddRoute("/events/new")}
        onAddExpense={() => openAddRoute("/expenses/new")}
        onAddTask={() => openAddRoute("/tasks/new")}
        onClose={() => setQuickAddOpen(false)}
        visible={quickAddOpen}
      />
    </Screen>
  );
}
