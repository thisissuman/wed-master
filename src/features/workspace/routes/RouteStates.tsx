import { router, type Href } from "expo-router";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { goBackOr } from "@/lib/navigation";

export function RouteLoading({ label }: { label: string }) {
  return (
    <Screen>
      <LoadingState label={label} />
    </Screen>
  );
}

export function RouteLoadError({
  error,
  fallback,
  onRetry,
  title,
}: {
  error: unknown;
  fallback: Href;
  onRetry: () => void;
  title: string;
}) {
  return (
    <Screen className="justify-center p-md">
      <ErrorState
        actionLabel="Go back"
        message={toUserMessage(error)}
        onAction={() => goBackOr(fallback)}
        onRetry={onRetry}
        title={title}
      />
    </Screen>
  );
}

export function RouteNotFound({ entity, fallback }: { entity: string; fallback: Href }) {
  return (
    <Screen className="justify-center p-md">
      <ErrorState
        actionLabel="Go back"
        message={`This ${entity.toLowerCase()} may have been deleted or the link is no longer valid.`}
        onAction={() => router.replace(fallback)}
        title={`${entity} not found`}
      />
    </Screen>
  );
}
