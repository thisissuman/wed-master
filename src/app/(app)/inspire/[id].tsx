import { useLocalSearchParams } from "expo-router";

import { InspirationDetail } from "@/features/inspire";

export default function InspirationDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <InspirationDetail inspirationId={id} />;
}
