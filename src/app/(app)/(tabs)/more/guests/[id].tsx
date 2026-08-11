import { useLocalSearchParams } from "expo-router";

import { HouseholdDetail } from "@/features/workspace";

export default function HouseholdDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HouseholdDetail householdId={id} />;
}
