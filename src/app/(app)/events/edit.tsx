import { useLocalSearchParams } from "expo-router";
import { AppText, LoadingState, Screen } from "@/components/ui";
import { EventForm, useWorkspace } from "@/features/workspace";
export default function EditEventRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const event = data.events.find((item) => item.id === id);
  return event ? (
    <EventForm event={event} />
  ) : (
    <Screen>
      <AppText>Event not found.</AppText>
    </Screen>
  );
}
