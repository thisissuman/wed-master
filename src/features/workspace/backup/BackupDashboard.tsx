import { Image } from "expo-image";
import {
  Download,
  FileArchive,
  FileSpreadsheet,
  History,
  Import,
  Share2,
  ShieldCheck,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { AppText, ConfirmationDialog, ErrorState, LoadingState, Screen } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";

import {
  clearWorkspaceLocalFiles,
  createExpensesCsv,
  createGuestsCsv,
  createTasksCsv,
  createWorkspaceBackupFile,
  pickWorkspaceBackup,
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
      className="min-h-20 flex-row items-center gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-sm shadow-card"
      disabled={disabled}
      onPress={() => void action.run()}
    >
      <View
        className={
          accent
            ? "h-12 w-12 items-center justify-center rounded-full bg-accentSoft"
            : "h-12 w-12 items-center justify-center rounded-full bg-primarySoft"
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
      await addHistory(entry);
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
  const shareLatest = async () => {
    const latest = data.backupHistory.find((entry) => entry.kind === "backup");
    if (!latest) {
      await run("Share backup", async () => createWorkspaceBackupFile(data));
      return;
    }
    setBusy("Share backup");
    try {
      await shareWorkspaceFile(latest.uri);
    } catch (error) {
      Alert.alert("Could not share backup", toUserMessage(error));
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
      icon: Share2,
      label: "Share backup",
      description: "Share the most recently generated data-backup file",
      run: shareLatest,
    },
    {
      icon: FileSpreadsheet,
      label: "Export expenses CSV",
      description: "Export expenses with INR decimal amounts",
      run: () => run("Export expenses CSV", async () => createExpensesCsv(data)),
      tone: "accent",
    },
    {
      icon: FileSpreadsheet,
      label: "Export tasks CSV",
      description: "Export tasks, status, priority, and event links",
      run: () => run("Export tasks CSV", async () => createTasksCsv(data)),
      tone: "accent",
    },
    {
      icon: FileSpreadsheet,
      label: "Export guests CSV",
      description: "Export households, guests, and RSVP details",
      run: () => run("Export guests CSV", async () => createGuestsCsv(data)),
      tone: "accent",
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-xl p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <MoreScreenHeader title="Backup & export" weddingName={data.wedding.name} />
        <AppText tone="muted">Protect your wedding data and share it safely</AppText>
        <View className="min-h-56 overflow-hidden rounded-card bg-primary p-lg shadow-card">
          <Image
            accessible={false}
            contentFit="cover"
            pointerEvents="none"
            source={require("../../../../assets/images/mangalya/mangalya-mandap.jpg")}
            style={{
              bottom: 0,
              opacity: 0.55,
              position: "absolute",
              right: 0,
              top: 0,
              width: "58%",
            }}
          />
          <View className="w-[58%] gap-sm">
            <ShieldCheck color={tokens.colors.accent} size={42} />
            <AppText tone="onPrimary" variant="title">
              Your data stays local on this device
            </AppText>
            <AppText tone="onPrimary" variant="caption">
              Mangalya does not upload this workspace to a server.
            </AppText>
          </View>
        </View>
        <View className="gap-xs">
          <AppText tone="primary" variant="heading">
            Backup & export options
          </AppText>
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
