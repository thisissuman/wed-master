import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { AppText, Button, EmptyState, LoadingState, Screen } from "@/components/ui";
import { useWorkspace } from "@/features/workspace";
import { EventCard, PageHeader, TaskCard } from "@/features/workspace/ui";

export default function PlanScreen() {
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
    .filter((task) => task.status !== "Cancelled")
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
