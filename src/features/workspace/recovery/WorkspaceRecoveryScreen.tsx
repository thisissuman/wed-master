import { router } from "expo-router";
import Download from "lucide-react-native/icons/download";
import FileWarning from "lucide-react-native/icons/file-exclamation-point";
import Trash2 from "lucide-react-native/icons/trash-2";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { AppText, Button, Card, ConfirmationDialog, Screen } from "@/components/ui";
import { clearInspirationMedia } from "@/features/inspire/media";
import { inspirationQueryKeys, useInspirationRepository } from "@/features/inspire/provider";
import { toUserMessage, WorkspaceCapacityError } from "@/lib/errors";
import { tokens, useAppTheme } from "@/theme";

import {
  clearWeddingCoverPhotos,
  clearWorkspaceAttachments,
  clearWorkspaceExports,
  createWorkspaceRecoveryFile,
  pickWorkspaceBackup,
  shareWorkspaceFile,
} from "../files/workspace-files";
import type { WorkspaceCorruptionError } from "../local-repositories";
import { cleanupSummary, coordinateLocalLifecycle } from "../lifecycle/local-lifecycle";
import { useDeleteWorkspaceMutation, useWorkspaceMutation } from "../provider";

export function WorkspaceRecoveryScreen({
  error,
}: {
  error: WorkspaceCapacityError | WorkspaceCorruptionError;
}) {
  const theme = useAppTheme();
  const mutation = useWorkspaceMutation();
  const deleteMutation = useDeleteWorkspaceMutation();
  const inspirationRepository = useInspirationRepository();
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const recoveryText = "recoveryText" in error ? error.recoveryText : undefined;
  const capacityBlocked = error instanceof WorkspaceCapacityError;
  const controlsBusy = lifecycleBusy || exporting || importing;

  const exportRecoveryCopy = async () => {
    if (!recoveryText) return;
    setExporting(true);
    try {
      const uri = createWorkspaceRecoveryFile(recoveryText);
      await shareWorkspaceFile(uri);
    } catch (exportError) {
      Alert.alert("Could not export recovery copy", toUserMessage(exportError));
    } finally {
      setExporting(false);
    }
  };

  const importBackup = async () => {
    if (controlsBusy) return;
    setLifecycleBusy(true);
    setImporting(true);
    try {
      const snapshot = await pickWorkspaceBackup();
      if (!snapshot) return;
      const outcome = await coordinateLocalLifecycle(
        () =>
          mutation.mutateAsync((repositories) => repositories.workspace.replaceSnapshot(snapshot)),
        [
          {
            area: "inspire-records",
            run: async () => {
              await inspirationRepository.clear();
            },
          },
          { area: "inspire-media", run: clearInspirationMedia },
          { area: "workspace-attachments", run: clearWorkspaceAttachments },
          { area: "workspace-covers", run: clearWeddingCoverPhotos },
          { area: "workspace-exports", run: clearWorkspaceExports },
        ],
      );
      queryClient.removeQueries({ queryKey: inspirationQueryKeys.all });
      router.replace("/(app)/(tabs)");
      Alert.alert(
        "Backup restored",
        outcome.cleanupFailures.length
          ? `The workspace was restored. Cleanup remains for: ${cleanupSummary(outcome.cleanupFailures)}.`
          : "The workspace was restored. Inspire remains empty because it is excluded from data-only backups.",
      );
    } catch (importError) {
      Alert.alert("Could not restore backup", toUserMessage(importError));
    } finally {
      setImporting(false);
      setLifecycleBusy(false);
    }
  };

  const replaceUnreadableData = async () => {
    if (controlsBusy) return;
    setLifecycleBusy(true);
    try {
      const outcome = await coordinateLocalLifecycle(
        () => deleteMutation.mutateAsync(),
        [
          {
            area: "inspire-records",
            run: async () => {
              await inspirationRepository.clear();
            },
          },
          { area: "inspire-media", run: clearInspirationMedia },
          { area: "workspace-attachments", run: clearWorkspaceAttachments },
          { area: "workspace-covers", run: clearWeddingCoverPhotos },
          { area: "workspace-exports", run: clearWorkspaceExports },
        ],
      );
      queryClient.removeQueries({ queryKey: inspirationQueryKeys.all });
      setResetOpen(false);
      router.replace("/(onboarding)");
      if (outcome.value.residualKeys.length || outcome.cleanupFailures.length) {
        Alert.alert(
          "Local data deleted",
          `The deletion is saved. Mangalya will retry remaining cleanup safely${
            outcome.cleanupFailures.length ? ` for: ${cleanupSummary(outcome.cleanupFailures)}` : ""
          }.`,
        );
      }
    } catch (deleteError) {
      Alert.alert("Could not delete unreadable data", toUserMessage(deleteError));
    } finally {
      setLifecycleBusy(false);
    }
  };

  return (
    <Screen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerClassName="flex-grow justify-center gap-xl p-lg">
        <View className="items-center gap-md">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-warningSoft">
            <FileWarning color={theme.colors.warning} size={tokens.iconSize.lg} />
          </View>
          <View className="items-center gap-xs">
            <AppText className="text-center" variant="title">
              {capacityBlocked ? "Local workspace needs space" : "Local data needs recovery"}
            </AppText>
            <AppText className="text-center" tone="muted">
              {capacityBlocked
                ? "Mangalya stopped before changing a workspace that reached its safe local-storage limit. Your last saved data remains unchanged."
                : "Mangalya stopped before loading data that failed its safety checks. Nothing has been overwritten."}
            </AppText>
          </View>
        </View>

        {recoveryText ? (
          <Card className="gap-sm">
            <Button
              icon={Download}
              disabled={controlsBusy}
              label="Export recovery copy"
              loading={exporting}
              onPress={() => void exportRecoveryCopy()}
              variant="secondary"
            />
            <AppText tone="muted" variant="caption">
              Save the original local JSON before trying another recovery action.
            </AppText>
          </Card>
        ) : null}

        <View className="gap-sm">
          <Button
            disabled={controlsBusy}
            label="Import a valid Mangalya backup"
            loading={importing || mutation.isPending || lifecycleBusy}
            onPress={() => void importBackup()}
          />
          <Button
            disabled={controlsBusy}
            icon={Trash2}
            label="Delete unreadable data"
            onPress={() => setResetOpen(true)}
            variant="destructive"
          />
        </View>
      </ScrollView>

      <ConfirmationDialog
        confirmLabel="Delete local data"
        description="This permanently removes the unreadable local snapshot, Inspire records and photos, and other local files so you can set up a new private workspace. Export a recovery copy first if you may need the original file."
        onCancel={() => setResetOpen(false)}
        onConfirm={() => void replaceUnreadableData()}
        pending={mutation.isPending || deleteMutation.isPending || lifecycleBusy}
        title="Delete unreadable local data?"
        visible={resetOpen}
      />
    </Screen>
  );
}
