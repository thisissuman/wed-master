import { useLocalSearchParams } from "expo-router";

import { AppText, LoadingState, Screen } from "@/components/ui";
import { HouseholdForm, useWorkspace } from "@/features/workspace";

export default function HouseholdFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data } = useWorkspace();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const household = id ? data.households.find((item) => item.id === id) : undefined;
  if (id && !household)
    return (
      <Screen className="p-md">
        <AppText>Household not found.</AppText>
      </Screen>
    );
  return <HouseholdForm household={household} />;
}
