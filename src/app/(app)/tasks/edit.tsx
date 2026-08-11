import { useLocalSearchParams } from "expo-router";
import { TaskForm, useWorkspace } from "@/features/workspace";
import {
  RouteLoadError,
  RouteLoading,
  RouteNotFound,
} from "@/features/workspace/routes/RouteStates";
export default function EditTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workspace = useWorkspace();
  if (workspace.isError)
    return (
      <RouteLoadError
        error={workspace.error}
        fallback="/plan"
        onRetry={() => void workspace.refetch()}
        title="We could not open this task"
      />
    );
  if (!workspace.data) return <RouteLoading label="Opening task" />;
  const task = workspace.data.tasks.find((item) => item.id === id);
  return task ? <TaskForm task={task} /> : <RouteNotFound entity="Task" fallback="/plan" />;
}
