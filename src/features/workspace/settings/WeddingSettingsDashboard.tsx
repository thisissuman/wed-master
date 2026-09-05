import { router } from "expo-router";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import ChartNoAxesCombined from "lucide-react-native/icons/chart-no-axes-combined";
import Check from "lucide-react-native/icons/check";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import RefreshCcw from "lucide-react-native/icons/refresh-ccw";
import Trash2 from "lucide-react-native/icons/trash-2";
import Users from "lucide-react-native/icons/users";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import {
  AppBottomSheet,
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  DateField,
  ErrorState,
  LoadingState,
  MotionPressable,
  Screen,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { runNonCriticalNativeEffect } from "@/lib/native-effects";
import { useSingleFlightSubmission } from "@/lib/forms/useSingleFlightSubmission";
import { sentryEnabled } from "@/lib/observability/sentry";
import { isLargeText } from "@/lib/responsive";
import { motionDurations, tokens, useAppTheme, useAppThemeStore, type AppThemeId } from "@/theme";
import { inspirationQueryKeys, useInspirationRepository } from "@/features/inspire/provider";
import { installDemoInspirationPack } from "@/features/inspire/demo-seed";
import { clearInspirationMedia } from "@/features/inspire/media";

import {
  clearWeddingCoverPhotos,
  clearWorkspaceAttachments,
  clearWorkspaceExports,
} from "../files/workspace-files";
import { settingsFormSchema, type SettingsFormValues } from "../forms";
import {
  weddingCardArtworkAspectRatio,
  weddingCardThemeOptions,
  type WeddingCardTheme,
} from "../home/wedding-card-themes";
import { WeddingAvatarMonogram } from "../home";
import { cleanupSummary, coordinateLocalLifecycle } from "../lifecycle/local-lifecycle";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useDeleteWorkspaceMutation, useWorkspace, useWorkspaceMutation } from "../provider";
import type { Wedding, WorkspaceSnapshot } from "../types";
import { keepsakeMessageMaxLength } from "../wedding-profile";

type SettingRowProps = {
  disabled?: boolean;
  destructive?: boolean;
  icon: typeof Users;
  label: string;
  onPress: () => void;
  value: string;
};

function SettingRow({
  disabled = false,
  destructive,
  icon: Icon,
  label,
  onPress,
  value,
}: SettingRowProps) {
  const theme = useAppTheme();

  return (
    <MotionPressable
      accessibilityHint={value}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`min-h-20 flex-row items-center gap-sm border-b border-borderSubtle py-sm last:border-b-0 ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.99}
    >
      <View
        className={
          destructive
            ? "h-12 w-12 items-center justify-center rounded-full bg-dangerSoft"
            : "h-12 w-12 items-center justify-center rounded-full bg-primarySoft"
        }
      >
        <Icon
          color={destructive ? theme.colors.danger : theme.colors.primary}
          size={tokens.iconSize.md}
        />
      </View>
      <View className="min-w-0 flex-1">
        <AppText tone={destructive ? "danger" : "primary"} variant="heading">
          {label}
        </AppText>
        <AppText tone="muted" variant="caption">
          {value}
        </AppText>
      </View>
      <ChevronRight
        color={destructive ? theme.colors.danger : theme.colors.textSecondary}
        size={tokens.iconSize.sm}
      />
    </MotionPressable>
  );
}

function WeddingCardThemeChoice({
  disabled,
  fullWidth,
  name,
  onPress,
  selected,
  theme,
}: {
  disabled: boolean;
  fullWidth: boolean;
  name: string;
  onPress: (themeId: AppThemeId) => void;
  selected: boolean;
  theme: WeddingCardTheme;
}) {
  const appTheme = useAppTheme();

  return (
    <MotionPressable
      accessibilityHint={theme.description}
      accessibilityLabel={theme.label}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      className={`gap-sm rounded-card bg-elevatedSurface p-xs ${
        selected ? "border-2 border-primary" : "border border-borderSubtle"
      } disabled:opacity-60`}
      disabled={disabled}
      onPress={() => {
        if (!selected) onPress(theme.id);
      }}
      pressedScale={0.98}
      style={fullWidth ? { width: "100%" } : { flex: 1 }}
      testID={`wedding-card-theme-${theme.id}`}
    >
      <View
        className="overflow-hidden rounded-control bg-surface"
        style={{ aspectRatio: weddingCardArtworkAspectRatio, width: "100%" }}
      >
        <Image
          accessible={false}
          accessibilityElementsHidden
          contentFit="fill"
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          source={theme.artwork}
          style={StyleSheet.absoluteFill}
          transition={motionDurations.state}
        />
        <View
          accessibilityElementsHidden
          className="items-center justify-center overflow-hidden rounded-full"
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{
            aspectRatio: 1,
            borderRadius: Number.parseInt(tokens.radius.pill, 10),
            left: "7.3%",
            position: "absolute",
            top: "16.6%",
            width: "27.2%",
          }}
        >
          <WeddingAvatarMonogram name={name} size={42} theme={theme} />
        </View>
      </View>
      <View className="flex-row items-center gap-xs">
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText numberOfLines={1} variant="label">
            {theme.label}
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="caption">
            {theme.description}
          </AppText>
        </View>
        <View
          accessibilityElementsHidden
          className={`h-7 w-7 items-center justify-center rounded-full ${
            selected ? "bg-primary" : "border border-borderStrong bg-elevatedSurface"
          }`}
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
        >
          {selected ? (
            <Check color={appTheme.colors.onPrimary} size={tokens.iconSize.sm} strokeWidth={2.4} />
          ) : null}
        </View>
      </View>
    </MotionPressable>
  );
}

export function WeddingSettingsDashboard() {
  const { fontScale, width } = useWindowDimensions();
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const deleteMutation = useDeleteWorkspaceMutation();
  const inspirationRepository = useInspirationRepository();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [resettingDemo, setResettingDemo] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const stackActions = isLargeText(fontScale);
  const stackThemeChoices = stackActions || width < tokens.layout.sideBySideControlsMinWidth;
  const themeId = useAppThemeStore((state) => state.themeId);
  const themeHasHydrated = useAppThemeStore((state) => state.hasHydrated);
  const themeIsHydrating = useAppThemeStore((state) => state.isHydrating);
  const themeIsSaving = useAppThemeStore((state) => state.isSaving);
  const themeErrorMessage = useAppThemeStore((state) => state.errorMessage);
  const selectTheme = useAppThemeStore((state) => state.selectTheme);
  const showDemoReset = Constants.expoConfig?.extra?.appVariant === "development";
  const appVariant = String(Constants.expoConfig?.extra?.appVariant ?? "development");
  const appVersion = Constants.expoConfig?.version ?? "Unknown";
  const buildNumber =
    process.env.EXPO_OS === "ios"
      ? (Constants.expoConfig?.ios?.buildNumber ?? "Unknown")
      : String(Constants.expoConfig?.android?.versionCode ?? "Unknown");
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      date: "",
      location: "",
      type: "",
      keepsakeMessage: "",
    },
  });

  const wedding = workspace.data?.wedding;
  const saveValues = useSingleFlightSubmission(async (values: SettingsFormValues) => {
    if (!wedding) return;
    const next: Wedding = {
      ...wedding,
      name: values.name,
      date: values.date as Wedding["date"],
      location: values.location,
      type: values.type,
      keepsakeMessage: values.keepsakeMessage || undefined,
    };
    try {
      await mutation.mutateAsync((repositories) => repositories.wedding.updateWedding(next));
    } catch {
      return;
    }
    setEditOpen(false);
  });
  const save = handleSubmit(saveValues);

  if (workspace.isLoading || !wedding) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open settings"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening settings" />
      </Screen>
    );
  }

  const openEditor = () => {
    reset({
      name: wedding.name,
      date: wedding.date,
      location: wedding.location,
      type: wedding.type,
      keepsakeMessage: wedding.keepsakeMessage ?? "",
    });
    setEditOpen(true);
  };
  const closeEditor = () => {
    if (mutation.isPending) return;
    if (!isDirty) {
      setEditOpen(false);
      return;
    }
    Alert.alert("Discard unsaved changes?", "Your wedding setting changes have not been saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => setEditOpen(false) },
    ]);
  };
  const field = (name: "location" | "name" | "type", label: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field: input }) => (
        <TextField
          autoCapitalize="words"
          autoComplete="off"
          autoFocus={name === "name"}
          error={errors[name]?.message}
          label={label}
          onBlur={input.onBlur}
          onChangeText={input.onChange}
          value={input.value}
        />
      )}
    />
  );
  const chooseTheme = async (nextThemeId: AppThemeId) => {
    try {
      await selectTheme(nextThemeId);
      runNonCriticalNativeEffect(() => Haptics.selectionAsync());
    } catch {
      Alert.alert(
        "Theme unchanged",
        "Mangalya could not save that application theme. Please try again.",
      );
    }
  };
  const deleteAllLocalData = async () => {
    if (lifecycleBusy) return;
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
      setDeleteOpen(false);
      setDeleteConfirmation("");
      router.replace("/(onboarding)");
      if (outcome.value.residualKeys.length || outcome.cleanupFailures.length) {
        const details = outcome.cleanupFailures.length
          ? ` Cleanup remains for: ${cleanupSummary(outcome.cleanupFailures)}.`
          : "";
        Alert.alert(
          "Workspace deleted",
          `The workspace deletion is saved. Mangalya will retry remaining local cleanup safely.${details}`,
        );
      }
    } catch (error) {
      Alert.alert("Could not delete local data", toUserMessage(error));
    } finally {
      setLifecycleBusy(false);
    }
  };
  const resetDemoData = async () => {
    if (lifecycleBusy) return;
    setLifecycleBusy(true);
    setResettingDemo(true);
    try {
      let committedSnapshot: WorkspaceSnapshot;
      const outcome = await coordinateLocalLifecycle(async () => {
        committedSnapshot = await mutation.mutateAsync((repositories) =>
          repositories.workspace.resetDemo(),
        );
        return committedSnapshot;
      }, [
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
        {
          area: "demo-inspiration",
          run: async () => {
            await installDemoInspirationPack(
              inspirationRepository,
              committedSnapshot.wedding.id,
              committedSnapshot.events,
            );
          },
        },
      ]);
      queryClient.removeQueries({ queryKey: inspirationQueryKeys.all });
      setResetOpen(false);
      if (outcome.cleanupFailures.length) {
        Alert.alert(
          "Demo data restored",
          `The demo workspace was restored. Cleanup remains for: ${cleanupSummary(outcome.cleanupFailures)}.`,
        );
      }
    } catch (error) {
      Alert.alert("Could not reset demo data", toUserMessage(error));
    } finally {
      setResettingDemo(false);
      setLifecycleBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-xl p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <MoreScreenHeader title="Settings" />
        <SectionHeader title="Wedding details" />
        <Card className="px-lg py-xs">
          <SettingRow
            icon={CalendarDays}
            label="Wedding details"
            onPress={openEditor}
            value="Name, date, tradition and keepsake message"
          />
        </Card>
        <View className="gap-sm">
          <SectionHeader title="Application theme" />
          <AppText tone="muted">
            Changes colours across Mangalya, including your live wedding card on Home.
          </AppText>
          <View className={stackThemeChoices ? "gap-sm" : "flex-row gap-sm"}>
            {weddingCardThemeOptions.map((theme) => (
              <WeddingCardThemeChoice
                disabled={!themeHasHydrated || themeIsHydrating || themeIsSaving}
                fullWidth={stackThemeChoices}
                key={theme.id}
                name={wedding.name}
                onPress={(nextThemeId) => void chooseTheme(nextThemeId)}
                selected={theme.id === themeId}
                theme={theme}
              />
            ))}
          </View>
          {themeErrorMessage ? (
            <AppText accessibilityRole="alert" tone="danger" variant="caption">
              {themeErrorMessage}
            </AppText>
          ) : null}
        </View>
        <SectionHeader title="Money" />
        <Card className="px-lg py-xs">
          <SettingRow
            icon={ChartNoAxesCombined}
            label="Budget & expenses"
            onPress={() => router.navigate("/budget/overview")}
            value="Target, trends, dates and category insights"
          />
        </Card>
        <View className="gap-sm">
          <SectionHeader title="Data & Privacy" />
          <AppText tone="muted">
            Mangalya is designed for a trusted, screen-locked personal device. Workspace data and
            managed photos stay local and are not protected by application-level encryption.
          </AppText>
          <Card className="gap-sm">
            <View className="gap-2xs">
              <AppText variant="label">Local storage</AppText>
              <AppText tone="muted" variant="caption">
                Data is stored unencrypted inside the app sandbox. Exported files are plaintext
                after they are shared outside Mangalya.
              </AppText>
            </View>
            <View className="gap-2xs">
              <AppText variant="label">Data-only backup exclusions</AppText>
              <AppText tone="muted" variant="caption">
                Inspire records and photos, wedding and event covers, receipts, and attachments are
                not included.
              </AppText>
            </View>
            <View className="gap-2xs">
              <AppText variant="label">Crash reporting</AppText>
              <AppText tone="muted" variant="caption">
                {sentryEnabled
                  ? "Enabled for redacted error reports only; tracing is disabled."
                  : "Off for this self-test build because reporting credentials are not configured."}
              </AppText>
            </View>
            <View className="gap-2xs">
              <AppText variant="label">Build identity</AppText>
              <AppText tone="muted" variant="caption">
                {appVariant} · {appVersion} ({buildNumber})
              </AppText>
            </View>
          </Card>
        </View>
        <Card className="px-lg py-xs">
          {showDemoReset ? (
            <SettingRow
              destructive
              disabled={lifecycleBusy}
              icon={RefreshCcw}
              label="Reset demo data"
              onPress={() => setResetOpen(true)}
              value="Restore editable planner content and the demo inspiration board"
            />
          ) : null}
          <SettingRow
            destructive
            disabled={lifecycleBusy}
            icon={Trash2}
            label="Delete local data"
            onPress={() => {
              if (lifecycleBusy) return;
              setDeleteConfirmation("");
              setDeleteOpen(true);
            }}
            value="Permanently remove this device's workspace and Inspire photos"
          />
        </Card>
      </ScrollView>

      <AppBottomSheet
        closeLabel="Close settings editor"
        footer={
          <Button
            label="Save settings"
            loading={isSubmitting || mutation.isPending}
            onPress={save}
          />
        }
        onClose={closeEditor}
        title="Edit wedding details"
        visible={editOpen}
      >
        <View accessibilityViewIsModal className="gap-md" testID="settings-editor-sheet">
          {field("name", "Couple or wedding name")}
          <Controller
            control={control}
            name="date"
            render={({ field: input }) => (
              <DateField
                error={errors.date?.message}
                label="Wedding date"
                onChange={input.onChange}
                value={input.value}
              />
            )}
          />
          {field("location", "City or location")}
          {field("type", "Wedding style or tradition")}
          <Controller
            control={control}
            name="keepsakeMessage"
            render={({ field: input }) => (
              <TextField
                autoCapitalize="sentences"
                autoComplete="off"
                error={errors.keepsakeMessage?.message}
                helperText={`Shown when the Home card flips · ${keepsakeMessageMaxLength} characters maximum`}
                label="Keepsake message"
                maxLength={keepsakeMessageMaxLength}
                multiline
                onBlur={input.onBlur}
                onChangeText={input.onChange}
                optional
                placeholder="A short keepsake message"
                value={input.value}
              />
            )}
          />
          {mutation.error ? (
            <AppText accessibilityRole="alert" tone="danger" variant="caption">
              {toUserMessage(mutation.error)}
            </AppText>
          ) : null}
        </View>
      </AppBottomSheet>
      <AppBottomSheet
        closeLabel="Cancel local data deletion"
        description="This permanently removes the workspace, Inspire records and photos, cover photos, attachments, and exports from this device. Type DELETE to confirm."
        footer={
          <View
            className="gap-sm"
            style={{ flexDirection: stackActions ? "column" : "row" }}
            testID="settings-delete-actions"
          >
            <Button
              className={stackActions ? "w-full" : "flex-1"}
              disabled={deleteMutation.isPending || lifecycleBusy}
              label="Cancel"
              onPress={() => setDeleteOpen(false)}
              variant="secondary"
            />
            <Button
              className={stackActions ? "w-full" : "flex-1"}
              disabled={deleteConfirmation !== "DELETE" || lifecycleBusy}
              label="Delete data"
              loading={deleteMutation.isPending || lifecycleBusy}
              onPress={() => void deleteAllLocalData()}
              variant="destructive"
            />
          </View>
        }
        onClose={() => {
          if (!deleteMutation.isPending && !lifecycleBusy) {
            setDeleteOpen(false);
          }
        }}
        presentation="dialog"
        scrollable={false}
        title="Delete all local data?"
        visible={deleteOpen}
      >
        <View accessibilityViewIsModal className="gap-md" testID="settings-delete-dialog">
          <TextField
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            label="Confirmation"
            onChangeText={setDeleteConfirmation}
            placeholder="DELETE"
            value={deleteConfirmation}
          />
          {deleteMutation.error ? (
            <AppText accessibilityLiveRegion="polite" tone="danger" variant="caption">
              {toUserMessage(deleteMutation.error)}
            </AppText>
          ) : null}
        </View>
      </AppBottomSheet>
      {showDemoReset ? (
        <ConfirmationDialog
          confirmLabel="Reset demo data"
          description="All current records, Inspire photos, cover photos, and local attachment files will be replaced by the editable Mangalya demo workspace and inspiration pack."
          onCancel={() => setResetOpen(false)}
          onConfirm={() => void resetDemoData()}
          pending={mutation.isPending || resettingDemo || lifecycleBusy}
          title="Restore demo data?"
          visible={resetOpen}
        />
      ) : null}
    </Screen>
  );
}
