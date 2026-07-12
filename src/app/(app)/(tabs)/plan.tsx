import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { AppText, Button, EmptyState, LoadingState, Screen, SelectField } from "@/components/ui";
import { isOverdue, taskPriorities, taskStatuses, useWorkspace } from "@/features/workspace";
import { EventCard, PageHeader, TaskCard } from "@/features/workspace/ui";

export default function PlanScreen() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [eventFilter, setEventFilter] = useState("All");
  const [overdueOnly, setOverdueOnly] = useState("No");
  const { data, isLoading } = useWorkspace();
  if (isLoading || !data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const events = [...data.events].sort(
    (a, b) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder,
  );
  const tasks = [...data.tasks]
    .filter((task) => statusFilter === "All" || task.status === statusFilter)
    .filter((task) => priorityFilter === "All" || task.priority === priorityFilter)
    .filter((task) => eventFilter === "All" || task.eventId === eventFilter)
    .filter(
      (task) => overdueOnly === "No" || (task.status !== "Completed" && isOverdue(task.dueDate)),
    )
    .sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"));
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <PageHeader title="Plan" />
        <View className="gap-sm">
          <View className="flex-row items-center justify-between">
            <AppText variant="heading">Events</AppText>
            <Button label="Add event" onPress={() => router.push("/events/new")} />
          </View>
          {events.length ? (
            events.map((event) => (
              <EventCard
                event={event}
                key={event.id}
                onPress={() => router.push(`/events/${event.id}`)}
                taskCount={data.tasks.filter((task) => task.eventId === event.id).length}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add event"
              description="Create your first ceremony."
              onAction={() => router.push("/events/new")}
              title="No events yet"
            />
          )}
        </View>
        <View className="gap-sm">
          <View className="flex-row items-center justify-between">
            <AppText variant="heading">Tasks</AppText>
            <Button label="Add task" onPress={() => router.push("/tasks/new")} />
          </View>
          <View className="gap-sm">
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
              label="Event"
              onChange={setEventFilter}
              options={[
                { label: "All events", value: "All" },
                { label: "General tasks", value: "" },
                ...data.events.map((event) => ({ label: event.name, value: event.id })),
              ]}
              value={eventFilter}
            />
            <SelectField
              label="Overdue"
              onChange={setOverdueOnly}
              options={[
                { label: "All tasks", value: "No" },
                { label: "Overdue only", value: "Yes" },
              ]}
              value={overdueOnly}
            />
          </View>
          {tasks.length ? (
            tasks.map((task) => (
              <TaskCard
                eventName={data.events.find((event) => event.id === task.eventId)?.name}
                key={task.id}
                onPress={() => router.push(`/tasks/${task.id}`)}
                task={task}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add task"
              description="Break the plan into a first task."
              onAction={() => router.push("/tasks/new")}
              title="No tasks yet"
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
