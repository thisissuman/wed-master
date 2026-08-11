import { useLocalSearchParams } from "expo-router";

import { TaskForm } from "@/features/workspace";

export default function NewTaskRoute() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  return <TaskForm initialEventId={eventId} />;
}
