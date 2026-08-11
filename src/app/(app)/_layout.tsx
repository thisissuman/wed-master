import { Redirect, Stack } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";

import { ErrorState, LoadingState, Screen } from "@/components/ui";
import {
  WorkspaceCorruptionError,
  WorkspaceEmptyError,
} from "@/features/workspace/local-repositories";
import { useWorkspace } from "@/features/workspace/provider";
import { WorkspaceRecoveryScreen } from "@/features/workspace/recovery/WorkspaceRecoveryScreen";
import { toUserMessage } from "@/lib/errors";
import { expenseCreationNavigationOptions } from "@/lib/navigation";
import { tokens } from "@/theme";

export default function AppLayout() {
  const reduceMotion = useReducedMotion();
  const workspace = useWorkspace();
  const detailAnimation = reduceMotion ? "none" : "default";
  const modalAnimation = reduceMotion ? "none" : "slide_from_bottom";

  if (workspace.isLoading) {
    return (
      <Screen edges={["top", "bottom", "left", "right"]}>
        <LoadingState label="Opening your private workspace" />
      </Screen>
    );
  }

  if (workspace.error instanceof WorkspaceEmptyError) {
    return <Redirect href="/(onboarding)" />;
  }

  if (workspace.error instanceof WorkspaceCorruptionError) {
    return <WorkspaceRecoveryScreen error={workspace.error} />;
  }

  if (workspace.isError || !workspace.data) {
    return (
      <Screen className="justify-center p-md" edges={["top", "bottom", "left", "right"]}>
        <ErrorState
          message={toUserMessage(workspace.error)}
          onRetry={() => void workspace.refetch()}
          title="We could not open Mangalya"
        />
      </Screen>
    );
  }

  return (
    <Stack
      screenOptions={{
        animation: detailAnimation,
        contentStyle: { backgroundColor: tokens.colors.canvas },
        headerShown: false,
        statusBarStyle: "dark",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="budget/overview" />
      <Stack.Screen name="events/[id]" />
      <Stack.Screen
        name="events/new"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen
        name="events/edit"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen name="tasks/[id]" />
      <Stack.Screen
        name="tasks/new"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen
        name="tasks/edit"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen name="expenses/[id]" />
      <Stack.Screen name="expenses/new" options={expenseCreationNavigationOptions(reduceMotion)} />
      <Stack.Screen
        name="expenses/edit"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
    </Stack>
  );
}
