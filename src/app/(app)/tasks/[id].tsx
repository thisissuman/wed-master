import { Alert, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppText, Button, Card, LoadingState, Screen } from "@/components/ui";
import { useWorkspace, useWorkspaceMutation } from "@/features/workspace";
import { formatDate } from "@/features/workspace/ui";
export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const task = data.tasks.find((item) => item.id === id);
  if (!task)
    return (
      <Screen>
        <AppText>Task not found.</AppText>
      </Screen>
    );
  const remove = () =>
    Alert.alert("Delete task?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await mutation.mutateAsync((repositories) => repositories.tasks.deleteTask(task.id));
          router.replace("/(app)/(tabs)/plan");
        },
      },
    ]);
  const toggle = () =>
    mutation.mutate((repositories) =>
      repositories.tasks.updateTask({
        ...task,
        status: task.status === "Completed" ? "Not Started" : "Completed",
      }),
    );
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-lg p-md">
        <View className="gap-2xs">
          <AppText variant="title">{task.title}</AppText>
          <AppText variant="caption">
            {task.priority} priority · {task.status}
          </AppText>
        </View>
        <Card className="gap-2xs">
          <AppText variant="heading">Details</AppText>
          <AppText>
            {data.events.find((event) => event.id === task.eventId)?.name ?? "General task"}
          </AppText>
          {task.dueDate ? <AppText>Due {formatDate(task.dueDate)}</AppText> : null}
          {task.responsiblePerson ? <AppText>Owner: {task.responsiblePerson}</AppText> : null}
        </Card>
        {task.notes ? (
          <Card>
            <AppText variant="heading">Notes</AppText>
            <AppText>{task.notes}</AppText>
          </Card>
        ) : null}
        <Button
          label={task.status === "Completed" ? "Reopen task" : "Mark complete"}
          onPress={toggle}
        />
        <Button
          label="Edit task"
          onPress={() => router.push({ pathname: "/tasks/edit", params: { id: task.id } } as never)}
          variant="secondary"
        />
        <Button label="Delete task" onPress={remove} variant="destructive" />
      </ScrollView>
    </Screen>
  );
}
