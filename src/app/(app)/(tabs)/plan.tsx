import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Plus, SlidersHorizontal } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";

import {
  AppText,
  Button,
  EmptyState,
  FilterSheet,
  LoadingState,
  Screen,
  SectionHeader,
  SelectField,
} from "@/components/ui";
import { todayDateOnly } from "@/lib/dates";
import {
  isOverdue,
  taskPriorities,
  taskStatuses,
  useWorkspace,
  useWorkspaceMutation,
  type Task,
} from "@/features/workspace";
import { EventTimelineRow, PageHeader, TaskListItem } from "@/features/workspace/ui";
import { tokens } from "@/theme";

type PlanView = "events" | "tasks";

const planViews: PlanView[] = ["events", "tasks"];

const planViewFromParam = (view: string | string[] | undefined): PlanView => {
  const value = Array.isArray(view) ? view[0] : view;
  return value === "tasks" ? "tasks" : "events";
};

const priorityOrder: Record<Task["priority"], number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export default function PlanScreen() {
  const { view } = useLocalSearchParams();
  const activeView = planViewFromParam(view);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [eventFilter, setEventFilter] = useState("All");
  const [overdueOnly, setOverdueOnly] = useState("All");
  const [today] = useState(() => todayDateOnly());
  const { data, isLoading } = useWorkspace();
  const mutation = useWorkspaceMutation();

  if (isLoading || !data) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  const events = [...data.events].sort(
    (left, right) => left.date.localeCompare(right.date) || left.sortOrder - right.sortOrder,
  );
  const tasks = [...data.tasks]
    .filter((task) => statusFilter === "All" || task.status === statusFilter)
    .filter((task) => priorityFilter === "All" || task.priority === priorityFilter)
    .filter((task) => eventFilter === "All" || task.eventId === eventFilter)
    .filter(
      (task) =>
        overdueOnly !== "Overdue" ||
        (task.status !== "Completed" && isOverdue(task.dueDate, today)),
    )
    .sort((left, right) => {
      const completionDifference =
        Number(left.status === "Completed") - Number(right.status === "Completed");
      if (completionDifference) return completionDifference;
      const dueDateDifference = (left.dueDate ?? "9999-12-31").localeCompare(
        right.dueDate ?? "9999-12-31",
      );
      if (dueDateDifference) return dueDateDifference;
      return priorityOrder[left.priority] - priorityOrder[right.priority];
    });
  const activeFilterLabels = [
    statusFilter !== "All" ? statusFilter : undefined,
    priorityFilter !== "All" ? `${priorityFilter} priority` : undefined,
    eventFilter !== "All"
      ? (data.events.find((event) => event.id === eventFilter)?.name ?? "General tasks")
      : undefined,
    overdueOnly === "Overdue" ? "Overdue" : undefined,
  ].filter((label): label is string => Boolean(label));

  const clearFilters = () => {
    setStatusFilter("All");
    setPriorityFilter("All");
    setEventFilter("All");
    setOverdueOnly("All");
  };

  const toggleTask = (task: Task) => {
    mutation.mutate((repositories) =>
      repositories.tasks.updateTask({
        ...task,
        status: task.status === "Completed" ? "Not Started" : "Completed",
      }),
    );
  };

  const addRoute = activeView === "events" ? "/events/new" : "/tasks/new";

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-xl">
        <PageHeader title="Plan" />
        <View accessibilityLabel="Plan content" style={styles.segmentedControl}>
          {planViews.map((mode) => {
            const selected = activeView === mode;
            return (
              <TouchableOpacity
                accessibilityLabel={mode === "events" ? "Events" : "Tasks"}
                accessibilityHint={selected ? "Selected" : "Switch plan view"}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                activeOpacity={0.78}
                key={mode}
                onPress={() => router.setParams({ view: mode })}
                style={[styles.segmentOption, selected ? styles.segmentOptionSelected : null]}
              >
                <AppText
                  style={selected ? styles.segmentLabelSelected : styles.segmentLabel}
                  variant="label"
                >
                  {mode === "events" ? "Events" : "Tasks"}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeView === "events" ? (
          <View className="gap-xs">
            <SectionHeader title="Wedding events" />
            {events.length ? (
              events.map((event) => {
                const relatedTasks = data.tasks.filter((task) => task.eventId === event.id);
                return (
                  <EventTimelineRow
                    event={event}
                    key={event.id}
                    onPress={() => router.push(`/events/${event.id}`)}
                    taskProgress={{
                      completed: relatedTasks.filter((task) => task.status === "Completed").length,
                      total: relatedTasks.length,
                    }}
                  />
                );
              })
            ) : (
              <EmptyState
                actionLabel="Add event"
                description="Start with the ceremony or gathering that anchors the plan."
                onAction={() => router.push("/events/new")}
                title="No events yet"
              />
            )}
          </View>
        ) : (
          <View className="gap-sm">
            <View className="flex-row items-center justify-between gap-sm">
              <AppText className="flex-1" variant="heading">
                Tasks
              </AppText>
              <Button
                icon={SlidersHorizontal}
                label="Filter"
                onPress={() => setFiltersOpen(true)}
                variant="secondary"
              />
            </View>
            {activeFilterLabels.length ? (
              <View className="flex-row items-center justify-between gap-sm rounded-control bg-surfaceSubtle px-md py-xs">
                <AppText className="flex-1" numberOfLines={1} variant="caption">
                  {activeFilterLabels.join(" · ")}
                </AppText>
                <Button label="Clear" onPress={clearFilters} variant="ghost" />
              </View>
            ) : null}
            {tasks.length ? (
              tasks.map((task) => (
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
                description={
                  activeFilterLabels.length
                    ? "Clear the filters or add a new task."
                    : "Break the plan into one clear next action."
                }
                onAction={() => router.push("/tasks/new")}
                title={activeFilterLabels.length ? "No matching tasks" : "No tasks yet"}
              />
            )}
          </View>
        )}
      </ScrollView>
      <View className="border-t border-border bg-surface p-md">
        <Button
          icon={Plus}
          label={activeView === "events" ? "Add event" : "Add task"}
          onPress={() => router.push(addRoute)}
        />
      </View>
      <FilterSheet
        onClear={clearFilters}
        onClose={() => setFiltersOpen(false)}
        title="Filter tasks"
        visible={filtersOpen}
      >
        <SelectField
          label="Status"
          onChange={setStatusFilter}
          options={[
            { label: "All statuses", value: "All" },
            ...taskStatuses.map((value) => ({ label: value, value })),
          ]}
          value={statusFilter}
        />
        <SelectField
          label="Priority"
          onChange={setPriorityFilter}
          options={[
            { label: "All priorities", value: "All" },
            ...taskPriorities.map((value) => ({ label: value, value })),
          ]}
          value={priorityFilter}
        />
        <SelectField
          label="Related event"
          onChange={setEventFilter}
          options={[
            { label: "All events", value: "All" },
            { label: "General tasks", value: "" },
            ...data.events.map((event) => ({ label: event.name, value: event.id })),
          ]}
          value={eventFilter}
        />
        <SelectField
          label="Due date"
          onChange={setOverdueOnly}
          options={[
            { label: "Any due date", value: "All" },
            { label: "Overdue only", value: "Overdue" },
          ]}
          value={overdueOnly}
        />
      </FilterSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentLabel: {
    color: tokens.colors.textSecondary,
  },
  segmentLabelSelected: {
    color: tokens.colors.brand,
  },
  segmentOption: {
    alignItems: "center",
    borderRadius: Number.parseInt(tokens.radius.control, 10),
    flex: 1,
    justifyContent: "center",
    minHeight: tokens.touchTarget,
    paddingHorizontal: Number.parseInt(tokens.spacing.sm, 10),
  },
  segmentOptionSelected: {
    backgroundColor: tokens.colors.surfaceRaised,
    shadowColor: tokens.colors.textPrimary,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  segmentedControl: {
    backgroundColor: tokens.colors.surfaceSubtle,
    borderRadius: Number.parseInt(tokens.radius.control, 10),
    flexDirection: "row",
    padding: Number.parseInt(tokens.spacing["2xs"], 10),
  },
});
