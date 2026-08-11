import { useLocalSearchParams } from "expo-router";

import { GiftForm, useWorkspace } from "@/features/workspace";
import {
  RouteLoadError,
  RouteLoading,
  RouteNotFound,
} from "@/features/workspace/routes/RouteStates";

export default function EditGiftRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workspace = useWorkspace();
  if (workspace.isError)
    return (
      <RouteLoadError
        error={workspace.error}
        fallback="/more/gifts"
        onRetry={() => void workspace.refetch()}
        title="We could not open this gift"
      />
    );
  if (!workspace.data) return <RouteLoading label="Opening gift" />;
  const gift = workspace.data.gifts.find((item) => item.id === id);
  return gift ? <GiftForm gift={gift} /> : <RouteNotFound entity="Gift" fallback="/more/gifts" />;
}
