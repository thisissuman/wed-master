import Download from "lucide-react-native/icons/download";
import FileArchive from "lucide-react-native/icons/file-archive";
import FileSpreadsheet from "lucide-react-native/icons/file-spreadsheet";
import History from "lucide-react-native/icons/history";
import Import from "lucide-react-native/icons/import";
import Share2 from "lucide-react-native/icons/share-2";
import Trash2 from "lucide-react-native/icons/trash-2";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import {
  AppText,
  Disclosure,
  ConfirmationDialog,
  ErrorState,
  LoadingState,
  Screen,
} from "@/components/ui";
import { clearInspirationMedia } from "@/features/inspire/media";
import { inspirationQueryKeys, useInspirationRepository } from "@/features/inspire/provider";
import { toUserMessage } from "@/lib/errors";
import { tokens, useAppTheme } from "@/theme";

import {
  clearWeddingCoverPhotos,
  clearWorkspaceAttachments,
  clearWorkspaceExports,
  createExpensesCsv,
  createWorkspaceBackupFile,
  pickWorkspaceBackup,
  removeWorkspaceExport,
  shareWorkspaceFile,
} from "../files/workspace-files";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { cleanupSummary, coordinateLocalLifecycle } from "../lifecycle/local-lifecycle";
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
  const theme = useAppTheme();
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
          color={accent ? theme.colors.accent : theme.colors.primary}
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
  const theme = useAppTheme();
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const inspirationRepository = useInspirationRepository();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string>();
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<WorkspaceSnapshot>();
  const [pendingDelete, setPendingDelete] = useState<BackupHistoryEntry | "all">();

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
  const run = async (label: string, operation: () => Promise<BackupHistoryEntry>) => {
    setBusy(label);
    let entry: BackupHistoryEntry | undefined;
    try {
      entry = await operation();
      let evictedEntries: BackupHistoryEntry[] = [];
      try {
        await mutation.mutateAsync(async (repositories) => {
          const result = await repositories.backup.addHistory(entry as BackupHistoryEntry);
          evictedEntries = result.removedEntries;
          return result.snapshot;
        });
      } catch (error) {
        removeWorkspaceExport(entry.uri);
        throw error;
      }
      const cleanupFailed = evictedEntries.some(({ uri }) => !removeWorkspaceExport(uri));
      try {
        await shareWorkspaceFile(entry.uri);
        if (cleanupFailed) {
          Alert.alert(
            "Export created",
            "The file was created and shared, but an older export could not be cleaned up. Mangalya will retry safely.",
          );
        }
      } catch (error) {
        Alert.alert(
          "Export created",
          `${toUserMessage(error)} The valid file remains in export history, where you can share it again.`,
        );
      }
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
  const confirmImport = async () => {
    if (!pendingImport || lifecycleBusy) return;
    setLifecycleBusy(true);
    try {
      const outcome = await coordinateLocalLifecycle(
        () =>
          mutation.mutateAsync((repositories) =>
            repositories.workspace.replaceSnapshot(pendingImport),
          ),
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
      setPendingImport(undefined);
      Alert.alert(
        "Backup imported",
        outcome.cleanupFailures.length
          ? `Your structured workspace data was restored. Inspire is not included in data-only backups. Cleanup remains for: ${cleanupSummary(outcome.cleanupFailures)}.`
          : "Your structured workspace data was restored. Inspire remains empty because it is not included in data-only backups.",
      );
    } catch (error) {
      Alert.alert("Could not replace workspace", toUserMessage(error));
    } finally {
      setLifecycleBusy(false);
    }
  };

  const reShare = async (entry: BackupHistoryEntry) => {
    setBusy(`Share ${entry.id}`);
    try {
      await shareWorkspaceFile(entry.uri);
    } catch (error) {
      Alert.alert("Could not share export", toUserMessage(error));
    } finally {
      setBusy(undefined);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || lifecycleBusy) return;
    setLifecycleBusy(true);
    const deletingAll = pendingDelete === "all";
    setBusy(deletingAll ? "Delete all exports" : `Delete ${pendingDelete.id}`);
    try {
      let removedEntries: BackupHistoryEntry[] = [];
      await mutation.mutateAsync(async (repositories) => {
        const result = deletingAll
          ? await repositories.backup.clearHistory()
          : await repositories.backup.removeHistory(pendingDelete.id);
        removedEntries = result.removedEntries;
        return result.snapshot;
      });
      const cleanupFailed = deletingAll
        ? !clearWorkspaceExports()
        : removedEntries.some(({ uri }) => !removeWorkspaceExport(uri));
      setPendingDelete(undefined);
      if (cleanupFailed) {
        Alert.alert(
          "History updated",
          "The history change was saved, but a local export file could not be removed. Mangalya will retry cleanup safely.",
        );
      }
    } catch (error) {
      Alert.alert("Could not update export history", toUserMessage(error));
    } finally {
      setBusy(undefined);
      setLifecycleBusy(false);
    }
  };

  const actions: BackupAction[] = [
    {
      icon: FileArchive,
      label: "Export data backup",
      description: "Save a copy of your plans",
      run: () => run("Export data backup", async () => createWorkspaceBackupFile(data)),
    },
    {
      icon: Import,
      label: "Import backup",
      description: "Replace your plans with a saved backup",
      run: importBackup,
    },
    {
      icon: FileSpreadsheet,
      label: "Export expenses CSV",
      description: "Open your money records in a spreadsheet",
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
              disabled={Boolean(busy) || mutation.isPending || lifecycleBusy}
              key={action.label}
            />
          ))}
        </View>
        <AppText tone="muted" variant="caption">
          Backups save your plans, but exclude Inspire, photos, receipts and attachments.
        </AppText>
        <Disclosure title="Backup history">
          {data.backupHistory.length ? (
            data.backupHistory.map((entry) => (
              <View
                className="flex-row items-center gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-md"
                key={entry.id}
              >
                <History color={theme.colors.primary} size={tokens.iconSize.md} />
                <View className="min-w-0 flex-1">
                  <AppText numberOfLines={1} variant="label">
                    {entry.fileName}
                  </AppText>
                  <AppText tone="muted" variant="caption">
                    {new Date(entry.createdAt).toLocaleString()} ·{" "}
                    {(entry.sizeBytes / 1024).toFixed(1)} KB
                  </AppText>
                </View>
                <Pressable
                  accessibilityLabel={`Share ${entry.fileName} again`}
                  accessibilityRole="button"
                  className="h-4xl w-4xl items-center justify-center rounded-control active:bg-surfaceMuted"
                  disabled={Boolean(busy) || mutation.isPending || lifecycleBusy}
                  onPress={() => void reShare(entry)}
                >
                  <Share2 color={theme.colors.primary} size={tokens.iconSize.md} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Delete ${entry.fileName}`}
                  accessibilityRole="button"
                  className="h-4xl w-4xl items-center justify-center rounded-control active:bg-dangerSoft"
                  disabled={Boolean(busy) || mutation.isPending || lifecycleBusy}
                  onPress={() => setPendingDelete(entry)}
                >
                  <Trash2 color={theme.colors.danger} size={tokens.iconSize.md} />
                </Pressable>
              </View>
            ))
          ) : (
            <AppText tone="muted">No successful exports yet.</AppText>
          )}
          {data.backupHistory.length ? (
            <Pressable
              accessibilityRole="button"
              className="min-h-4xl items-center justify-center rounded-control border border-danger px-md"
              disabled={Boolean(busy) || mutation.isPending || lifecycleBusy}
              onPress={() => setPendingDelete("all")}
            >
              <AppText tone="danger" variant="label">
                Delete all exports
              </AppText>
            </Pressable>
          ) : null}
        </Disclosure>
      </ScrollView>
      <ConfirmationDialog
        confirmLabel="Replace workspace"
        description="This replaces all current structured workspace data and permanently clears this device's Inspire records and photos. Inspire and attachment files cannot be restored from a data-only backup."
        onCancel={() => setPendingImport(undefined)}
        onConfirm={() => void confirmImport()}
        pending={mutation.isPending || lifecycleBusy}
        title="Import this backup?"
        visible={Boolean(pendingImport)}
      />
      <ConfirmationDialog
        confirmLabel={pendingDelete === "all" ? "Delete all" : "Delete export"}
        description={
          pendingDelete === "all"
            ? "This permanently removes every file in export history from this device. Shared copies outside Mangalya are unaffected."
            : "This permanently removes this export file from Mangalya. Shared copies outside the app are unaffected."
        }
        onCancel={() => setPendingDelete(undefined)}
        onConfirm={() => void confirmDelete()}
        pending={mutation.isPending || Boolean(busy) || lifecycleBusy}
        title={pendingDelete === "all" ? "Delete all exports?" : "Delete this export?"}
        visible={Boolean(pendingDelete)}
      />
    </Screen>
  );
}
