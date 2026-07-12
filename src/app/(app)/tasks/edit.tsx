import { useLocalSearchParams } from "expo-router";
import { AppText, LoadingState, Screen } from "@/components/ui";
import { TaskForm } from "@/features/workspace/TaskForm";
import { useWorkspace } from "@/features/workspace";
export default function EditTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const task = data.tasks.find((item) => item.id === id);
  return task ? (
    <TaskForm task={task} />
  ) : (
    <Screen>
      <AppText>Task not found.</AppText>
    </Screen>
  );
}
