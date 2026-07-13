import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import {
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  LoadingState,
  Screen,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import { useWorkspace, useWorkspaceMutation } from "@/features/workspace";
import { DetailHeader, formatDate } from "@/features/workspace/ui";

export default function TaskDetail() {
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

  const task = data.tasks.find((item) => item.id === id);
  if (!task) {
    return (
      <Screen className="p-md">
        <AppText>Task not found.</AppText>
      </Screen>
    );
  }

  const relatedEvent = data.events.find((event) => event.id === task.eventId);
  const completed = task.status === "Completed";

  const deleteTask = async () => {
    await mutation.mutateAsync((repositories) => repositories.tasks.deleteTask(task.id));
    router.replace("/plan");
  };

  const toggleTask = () =>
    mutation.mutate((repositories) =>
      repositories.tasks.updateTask({
        ...task,
        status: completed ? "Not Started" : "Completed",
      }),
    );

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <DetailHeader eyebrow={task.status} title={task.title} />
        <Card className="gap-md" variant="subtle">
          <View className="flex-row items-center justify-between gap-sm">
            <AppText variant="label">Priority</AppText>
            <StatusBadge label={`${task.priority} priority`} tone="neutral" />
          </View>
          <View className="gap-2xs border-t border-border pt-md">
            <AppText variant="caption">Related event</AppText>
            <AppText>{relatedEvent?.name ?? "General task"}</AppText>
          </View>
          {task.dueDate ? (
            <View className="gap-2xs">
              <AppText variant="caption">Due date</AppText>
              <AppText>{formatDate(task.dueDate)}</AppText>
            </View>
          ) : null}
          {task.responsiblePerson ? (
            <View className="gap-2xs">
              <AppText variant="caption">Responsible person</AppText>
              <AppText>{task.responsiblePerson}</AppText>
            </View>
          ) : null}
        </Card>

        {task.notes ? (
          <View className="gap-xs">
            <SectionHeader title="Notes" />
            <AppText>{task.notes}</AppText>
          </View>
        ) : null}

        <View className="gap-xs pt-sm">
          <Button
            label={completed ? "Reopen task" : "Mark complete"}
            onPress={toggleTask}
            variant={completed ? "secondary" : "primary"}
          />
          <Button
            label="Edit task"
            onPress={() => router.push({ pathname: "/tasks/edit", params: { id: task.id } })}
            variant="secondary"
          />
          <Button label="Delete task" onPress={() => setDeleteOpen(true)} variant="dangerGhost" />
        </View>
      </ScrollView>
      <ConfirmationDialog
        confirmLabel="Delete task"
        description="This task and its completion history will be removed from the local plan."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteTask()}
        pending={mutation.isPending}
        title="Delete this task?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
