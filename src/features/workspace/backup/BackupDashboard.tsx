import { Download, FileArchive, FileSpreadsheet, History, Import } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { AppText, ConfirmationDialog, ErrorState, LoadingState, Screen } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";

import {
  clearWorkspaceLocalFiles,
  createExpensesCsv,
  createWorkspaceBackupFile,
  pickWorkspaceBackup,
  removeWorkspaceExport,
  shareWorkspaceFile,
} from "../files/workspace-files";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import type { BackupHistoryEntry, WorkspaceSnapshot } from "../types";

type BackupAction = {
  description: string;
  icon: typeof Download;
  label: string;
  run: () => Promise<void>;
  tone?: "accent" | "primary";
};

function ActionRow({ action, disabled }: { action: BackupAction; disabled: boolean }) {
  const Icon = action.icon;
  const accent = action.tone === "accent";
  return (
    <Pressable
      accessibilityLabel={action.label}
      accessibilityRole="button"
      accessibilityState={{ busy: disabled, disabled }}
      className="min-h-16 flex-row items-center gap-sm rounded-control border border-borderSubtle bg-elevatedSurface px-sm py-xs active:bg-surfaceMuted"
      disabled={disabled}
      onPress={() => void action.run()}
    >
      <View
        className={
          accent
            ? "h-10 w-10 items-center justify-center rounded-control bg-accentSoft"
            : "h-10 w-10 items-center justify-center rounded-control bg-primarySoft"
        }
      >
        <Icon
          color={accent ? tokens.colors.accent : tokens.colors.primary}
          size={tokens.iconSize.md}
        />
      </View>
      <View className="min-w-0 flex-1">
        <AppText variant="heading">{action.label}</AppText>
        <AppText tone="muted" variant="caption">
          {action.description}
        </AppText>
      </View>
      <AppText tone="muted">›</AppText>
    </Pressable>
  );
}

export function BackupDashboard() {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [busy, setBusy] = useState<string>();
  const [pendingImport, setPendingImport] = useState<WorkspaceSnapshot>();

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open backup tools"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening backup tools" />
      </Screen>
    );
  }

  const data = workspace.data;
  const addHistory = async (entry: BackupHistoryEntry) => {
    await mutation.mutateAsync((repositories) => repositories.backup.addHistory(entry));
  };
  const run = async (label: string, operation: () => Promise<BackupHistoryEntry>) => {
    setBusy(label);
    try {
      const entry = await operation();
      try {
        await addHistory(entry);
      } catch (error) {
        removeWorkspaceExport(entry.uri);
        throw error;
      }
      await shareWorkspaceFile(entry.uri);
    } catch (error) {
      Alert.alert(`${label} unavailable`, toUserMessage(error));
    } finally {
      setBusy(undefined);
    }
  };
  const importBackup = async () => {
    setBusy("Import backup");
    try {
      const snapshot = await pickWorkspaceBackup();
      if (snapshot) setPendingImport(snapshot);
    } catch (error) {
      Alert.alert("Could not import backup", toUserMessage(error));
    } finally {
      setBusy(undefined);
    }
  };
  const confirmImport = () => {
    if (!pendingImport) return;
    mutation.mutate((repositories) => repositories.workspace.replaceSnapshot(pendingImport), {
      onSuccess: () => {
        clearWorkspaceLocalFiles();
        setPendingImport(undefined);
        Alert.alert("Backup imported", "Your structured workspace data has been restored.");
      },
      onError: (error) => {
        Alert.alert("Could not replace workspace", toUserMessage(error));
      },
    });
  };

  const actions: BackupAction[] = [
    {
      icon: FileArchive,
      label: "Export data backup",
      description: "Create a structured backup without local photos or attachment files",
      run: () => run("Export data backup", async () => createWorkspaceBackupFile(data)),
    },
    {
      icon: Import,
      label: "Import backup",
      description: "Validate and restore a previous Mangalya data backup",
      run: importBackup,
    },
    {
      icon: FileSpreadsheet,
      label: "Export expenses CSV",
      description: "Export expenses with INR decimal amounts",
      run: () => run("Export expenses CSV", async () => createExpensesCsv(data)),
      tone: "accent",
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-lg p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <MoreScreenHeader title="Backup & export" />
        <View className="gap-xs">
          {actions.map((action) => (
            <ActionRow
              action={action}
              disabled={Boolean(busy) || mutation.isPending}
              key={action.label}
            />
          ))}
        </View>
        <View className="rounded-card border border-primary bg-primarySoft p-md">
          <AppText tone="danger" variant="label">
            Data-only backup
          </AppText>
          <AppText tone="muted" variant="caption">
            Wedding cover photos, receipts, and task attachment files are not included. Imported
            backups restore structured records only.
          </AppText>
        </View>
        <View className="gap-xs">
          <AppText tone="primary" variant="heading">
            Backup history
          </AppText>
          {data.backupHistory.length ? (
            data.backupHistory.map((entry) => (
              <View
                className="flex-row items-center gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-md"
                key={entry.id}
              >
                <History color={tokens.colors.primary} size={tokens.iconSize.md} />
                <View className="min-w-0 flex-1">
                  <AppText numberOfLines={1} variant="label">
                    {entry.fileName}
                  </AppText>
                  <AppText tone="muted" variant="caption">
                    {new Date(entry.createdAt).toLocaleString()} ·{" "}
                    {(entry.sizeBytes / 1024).toFixed(1)} KB
                  </AppText>
                </View>
              </View>
            ))
          ) : (
            <AppText tone="muted">No successful exports yet.</AppText>
          )}
        </View>
      </ScrollView>
      <ConfirmationDialog
        confirmLabel="Replace workspace"
        description="This will replace all current structured workspace data. Attachment files are not restored from data-only backups."
        onCancel={() => setPendingImport(undefined)}
        onConfirm={confirmImport}
        pending={mutation.isPending}
        title="Import this backup?"
        visible={Boolean(pendingImport)}
      />
    </Screen>
  );
}
