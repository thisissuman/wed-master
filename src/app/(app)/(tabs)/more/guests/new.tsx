import { useLocalSearchParams } from "expo-router";

import { HouseholdForm, useWorkspace } from "@/features/workspace";
import {
  RouteLoadError,
  RouteLoading,
  RouteNotFound,
} from "@/features/workspace/routes/RouteStates";

export default function HouseholdFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const workspace = useWorkspace();
  if (workspace.isError)
    return (
      <RouteLoadError
        error={workspace.error}
        fallback="/more/guests"
        onRetry={() => void workspace.refetch()}
        title="We could not open this household"
      />
    );
  if (!workspace.data) return <RouteLoading label="Opening household" />;
  const household = id ? workspace.data.households.find((item) => item.id === id) : undefined;
  if (id && !household) return <RouteNotFound entity="Household" fallback="/more/guests" />;
  return <HouseholdForm household={household} />;
}
