import { Redirect, Stack } from "expo-router";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import {
  WorkspaceCorruptionError,
  WorkspaceEmptyError,
} from "@/features/workspace/local-repositories";
import { useWorkspace } from "@/features/workspace/provider";
import { WorkspaceRecoveryScreen } from "@/features/workspace/recovery/WorkspaceRecoveryScreen";
import { WorkspaceCapacityError } from "@/lib/errors";
import { toUserMessage } from "@/lib/errors/to-user-message";

export default function OnboardingLayout() {
  const workspace = useWorkspace();

  if (workspace.isLoading) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <LoadingState label="Checking this device for an existing workspace" />
      </Screen>
    );
  }

  if (workspace.data) return <Redirect href="/(app)/(tabs)" />;

  if (
    workspace.error instanceof WorkspaceCorruptionError ||
    workspace.error instanceof WorkspaceCapacityError
  ) {
    return <WorkspaceRecoveryScreen error={workspace.error} />;
  }

  if (!(workspace.error instanceof WorkspaceEmptyError)) {
    return (
      <Screen className="justify-center p-md" edges={["top", "bottom", "left", "right"]}>
        <ErrorState
          message={toUserMessage(workspace.error)}
          onRetry={() => void workspace.refetch()}
          title="We could not check local setup"
        />
      </Screen>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
