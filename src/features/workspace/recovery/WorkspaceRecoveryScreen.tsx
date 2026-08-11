import { router } from "expo-router";
import { Download, FileWarning, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { AppText, Button, Card, ConfirmationDialog, Screen } from "@/components/ui";
import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";

import {
  clearWorkspaceLocalFiles,
  createWorkspaceRecoveryFile,
  pickWorkspaceBackup,
  shareWorkspaceFile,
} from "../files/workspace-files";
import type { WorkspaceCorruptionError } from "../local-repositories";
import { useDeleteWorkspaceMutation, useWorkspaceMutation } from "../provider";

export function WorkspaceRecoveryScreen({ error }: { error: WorkspaceCorruptionError }) {
  const mutation = useWorkspaceMutation();
  const deleteMutation = useDeleteWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const exportRecoveryCopy = async () => {
    setExporting(true);
    try {
      const uri = createWorkspaceRecoveryFile(error.recoveryText);
      await shareWorkspaceFile(uri);
    } catch (exportError) {
      Alert.alert("Could not export recovery copy", toUserMessage(exportError));
    } finally {
      setExporting(false);
    }
  };

  const importBackup = async () => {
    setImporting(true);
    try {
      const snapshot = await pickWorkspaceBackup();
      if (!snapshot) return;
      await mutation.mutateAsync((repositories) =>
        repositories.workspace.replaceSnapshot(snapshot),
      );
      clearWorkspaceLocalFiles();
      showFeedback({ message: "Backup restored" });
    } catch (importError) {
      Alert.alert("Could not restore backup", toUserMessage(importError));
    } finally {
      setImporting(false);
    }
  };

  const replaceUnreadableData = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        clearWorkspaceLocalFiles();
        setResetOpen(false);
        router.replace("/(onboarding)");
      },
      onError: (deleteError) => {
        Alert.alert("Could not delete unreadable data", toUserMessage(deleteError));
      },
    });
  };

  return (
    <Screen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerClassName="flex-grow justify-center gap-xl p-lg">
        <View className="items-center gap-md">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-warningSoft">
            <FileWarning color={tokens.colors.warning} size={tokens.iconSize.lg} />
          </View>
          <View className="items-center gap-xs">
            <AppText className="text-center" variant="title">
              Local data needs recovery
            </AppText>
            <AppText className="text-center" tone="muted">
              Mangalya stopped before loading data that failed its safety checks. Nothing has been
              overwritten.
            </AppText>
          </View>
        </View>

        <Card className="gap-sm">
          <Button
            icon={Download}
            label="Export recovery copy"
            loading={exporting}
            onPress={() => void exportRecoveryCopy()}
            variant="secondary"
          />
          <AppText tone="muted" variant="caption">
            Save the original local JSON before trying another recovery action.
          </AppText>
        </Card>

        <View className="gap-sm">
          <Button
            label="Import a valid Mangalya backup"
            loading={importing || mutation.isPending}
            onPress={() => void importBackup()}
          />
          <Button
            icon={Trash2}
            label="Delete unreadable data"
            onPress={() => setResetOpen(true)}
            variant="destructive"
          />
        </View>
      </ScrollView>

      <ConfirmationDialog
        confirmLabel="Delete local data"
        description="This permanently removes the unreadable local snapshot so you can set up a new private workspace. Export a recovery copy first if you may need the original file."
        onCancel={() => setResetOpen(false)}
        onConfirm={replaceUnreadableData}
        pending={mutation.isPending || deleteMutation.isPending}
        title="Delete unreadable local data?"
        visible={resetOpen}
      />
    </Screen>
  );
}
