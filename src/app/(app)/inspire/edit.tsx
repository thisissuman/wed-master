import { useLocalSearchParams } from "expo-router";

import { InspirationForm } from "@/features/inspire";

export default function EditInspirationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <InspirationForm inspirationId={id} />;
}
