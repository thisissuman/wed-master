import { useLocalSearchParams } from "expo-router";
import { EventForm, useWorkspace } from "@/features/workspace";
import {
  RouteLoadError,
  RouteLoading,
  RouteNotFound,
} from "@/features/workspace/routes/RouteStates";
export default function EditEventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workspace = useWorkspace();
  if (workspace.isError)
    return (
      <RouteLoadError
        error={workspace.error}
        fallback="/plan"
        onRetry={() => void workspace.refetch()}
        title="We could not open this event"
      />
    );
  if (!workspace.data) return <RouteLoading label="Opening event" />;
  const event = workspace.data.events.find((item) => item.id === id);
  return event ? <EventForm event={event} /> : <RouteNotFound entity="Event" fallback="/plan" />;
}
