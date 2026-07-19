import { useLocalSearchParams } from "expo-router";

import { EventDetailDashboard } from "@/features/workspace";

export default function EventDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EventDetailDashboard eventId={id} />;
}
