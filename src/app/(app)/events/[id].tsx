import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import {
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  EmptyState,
  LoadingState,
  ProgressBar,
  Screen,
  SectionHeader,
} from "@/components/ui";
import { formatTimeOfDay } from "@/lib/dates";
import { useWorkspace, useWorkspaceMutation, type Task } from "@/features/workspace";
import { DetailHeader, formatDate, LocationLine, TaskListItem } from "@/features/workspace/ui";

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();

  if (!data) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  const event = data.events.find((item) => item.id === id);
  if (!event) {
    return (
      <Screen className="p-md">
        <AppText>Event not found.</AppText>
      </Screen>
    );
  }

  const tasks = data.tasks.filter((task) => task.eventId === event.id);
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const progress = tasks.length ? (completedTasks / tasks.length) * 100 : 0;

  const deleteEvent = async () => {
    await mutation.mutateAsync((repositories) => repositories.events.deleteEvent(event.id));
    router.replace("/plan");
  };

  const toggleTask = (task: Task) => {
    mutation.mutate((repositories) =>
      repositories.tasks.updateTask({
        ...task,
        status: task.status === "Completed" ? "Not Started" : "Completed",
      }),
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <DetailHeader eyebrow={formatDate(event.date)} title={event.name} />
        <View className="gap-xs">
          {event.time ? <AppText>{formatTimeOfDay(event.time)}</AppText> : null}
          <LocationLine location={event.location} />
        </View>

        <Card className="gap-sm" variant="subtle">
          <View className="flex-row items-center justify-between gap-sm">
            <AppText variant="label">Task progress</AppText>
            <AppText variant="caption">
              {completedTasks} of {tasks.length} done
            </AppText>
          </View>
          <ProgressBar accessibilityLabel="Related task progress" value={progress} />
        </Card>

        {event.notes ? (
          <View className="gap-xs">
            <SectionHeader title="Notes" />
            <AppText>{event.notes}</AppText>
          </View>
        ) : null}

        <View className="gap-xs">
          <SectionHeader title="Related tasks" />
          {tasks.length ? (
            tasks.map((task) => (
              <TaskListItem
                key={task.id}
                onPress={() => router.push(`/tasks/${task.id}`)}
                onToggle={() => toggleTask(task)}
                task={task}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add task"
              description="Link a task here when this event needs preparation."
              onAction={() => router.push("/tasks/new")}
              title="No related tasks"
            />
          )}
        </View>

        <View className="gap-xs pt-sm">
          <Button
            label="Edit event"
            onPress={() => router.push({ pathname: "/events/edit", params: { id: event.id } })}
          />
          <Button label="Delete event" onPress={() => setDeleteOpen(true)} variant="dangerGhost" />
        </View>
      </ScrollView>
      <ConfirmationDialog
        confirmLabel="Delete event"
        description="Related tasks will remain in the plan as general tasks."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteEvent()}
        pending={mutation.isPending}
        title="Delete this event?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
