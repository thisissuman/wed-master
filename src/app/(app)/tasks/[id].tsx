import { useLocalSearchParams } from "expo-router";

import { TaskDetailDashboard } from "@/features/workspace";

export default function TaskDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TaskDetailDashboard taskId={id} />;
}
