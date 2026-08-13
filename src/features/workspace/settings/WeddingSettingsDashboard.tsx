import { router } from "expo-router";
import Constants from "expo-constants";
import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  RefreshCcw,
  Trash2,
  Users,
  X,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useReducedMotion } from "react-native-reanimated";

import {
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  DateField,
  ErrorState,
  IconButton,
  LoadingState,
  MotionPressable,
  Screen,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";

import { clearWorkspaceLocalFiles } from "../files/workspace-files";
import { settingsFormSchema, type SettingsFormValues } from "../forms";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useDeleteWorkspaceMutation, useWorkspace, useWorkspaceMutation } from "../provider";
import type { Wedding } from "../types";
import { defaultKeepsakeMessage, keepsakeMessageMaxLength } from "../wedding-profile";

type SettingRowProps = {
  destructive?: boolean;
  icon: typeof Users;
  label: string;
  onPress: () => void;
  value: string;
};

function SettingRow({ destructive, icon: Icon, label, onPress, value }: SettingRowProps) {
  return (
    <MotionPressable
      accessibilityHint={value}
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-h-20 flex-row items-center gap-sm border-b border-borderSubtle py-sm last:border-b-0"
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
          color={destructive ? tokens.colors.danger : tokens.colors.primary}
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
        color={destructive ? tokens.colors.danger : tokens.colors.textSecondary}
        size={tokens.iconSize.sm}
      />
    </MotionPressable>
  );
}

export function WeddingSettingsDashboard() {
  const reduceMotion = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const deleteMutation = useDeleteWorkspaceMutation();
  const submissionInFlight = useRef(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const stackActions = isLargeText(fontScale);
  const showDemoReset = Constants.expoConfig?.extra?.appVariant === "development";
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

  if (workspace.isLoading || !workspace.data) {
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

  const wedding = workspace.data.wedding;
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
  const save = () =>
    handleSubmit(async (values) => {
      if (submissionInFlight.current) return;
      submissionInFlight.current = true;
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
      } finally {
        submissionInFlight.current = false;
      }
      setEditOpen(false);
    })();

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
            Mangalya does not upload your workspace. You choose when to export a backup.
          </AppText>
        </View>
        <Card className="px-lg py-xs">
          {showDemoReset ? (
            <SettingRow
              destructive
              icon={RefreshCcw}
              label="Reset demo data"
              onPress={() => setResetOpen(true)}
              value="Clear local changes and restore editable demo content"
            />
          ) : null}
          <SettingRow
            destructive
            icon={Trash2}
            label="Delete local data"
            onPress={() => {
              setDeleteConfirmation("");
              setDeleteOpen(true);
            }}
            value="Permanently remove this device's workspace"
          />
        </Card>
      </ScrollView>

      <Modal
        animationType={reduceMotion ? "none" : "slide"}
        onRequestClose={closeEditor}
        transparent
        visible={editOpen}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-overlay"
        >
          <SafeAreaView
            accessibilityViewIsModal
            edges={["bottom"]}
            className="max-h-[90%] gap-md rounded-t-sheet bg-elevatedSurface p-lg shadow-elevated"
            testID="settings-editor-sheet"
          >
            <View className="flex-row items-center justify-between">
              <AppText accessibilityRole="header" tone="primary" variant="heading">
                Edit wedding details
              </AppText>
              <IconButton
                accessibilityLabel="Close settings editor"
                icon={X}
                onPress={closeEditor}
              />
            </View>
            <ScrollView
              className="shrink"
              contentContainerClassName="gap-md"
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
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
                    placeholder={defaultKeepsakeMessage}
                    value={input.value}
                  />
                )}
              />
              {mutation.error ? (
                <AppText accessibilityRole="alert" tone="danger" variant="caption">
                  {toUserMessage(mutation.error)}
                </AppText>
              ) : null}
            </ScrollView>
            <Button
              label="Save settings"
              loading={isSubmitting || mutation.isPending}
              onPress={save}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        animationType={reduceMotion ? "none" : "fade"}
        onRequestClose={() => {
          if (!deleteMutation.isPending) setDeleteOpen(false);
        }}
        transparent
        visible={deleteOpen}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-overlay"
        >
          <SafeAreaView className="flex-1 p-md" edges={["bottom"]}>
            <ScrollView
              contentContainerClassName="flex-grow justify-center"
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              <View
                accessibilityRole="alert"
                accessibilityViewIsModal
                className="w-full gap-lg rounded-sheet bg-elevatedSurface p-xl shadow-elevated"
                testID="settings-delete-dialog"
              >
                <View className="gap-xs">
                  <AppText accessibilityRole="header" variant="heading">
                    Delete all local data?
                  </AppText>
                  <AppText tone="muted">
                    This permanently removes the workspace, cover photos, attachments, and exports
                    from this device. Type DELETE to confirm.
                  </AppText>
                </View>
                <TextField
                  autoCapitalize="characters"
                  autoCorrect={false}
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
                <View
                  className="gap-sm"
                  style={{ flexDirection: stackActions ? "column" : "row" }}
                  testID="settings-delete-actions"
                >
                  <Button
                    className={stackActions ? "w-full" : "flex-1"}
                    disabled={deleteMutation.isPending}
                    label="Cancel"
                    onPress={() => setDeleteOpen(false)}
                    variant="secondary"
                  />
                  <Button
                    className={stackActions ? "w-full" : "flex-1"}
                    disabled={deleteConfirmation !== "DELETE"}
                    label="Delete data"
                    loading={deleteMutation.isPending}
                    onPress={() =>
                      deleteMutation.mutate(undefined, {
                        onSuccess: () => {
                          const filesCleared = clearWorkspaceLocalFiles();
                          setDeleteOpen(false);
                          router.replace("/(onboarding)");
                          if (!filesCleared) {
                            Alert.alert(
                              "Workspace deleted",
                              "The records were removed, but one or more local files could not be cleaned up.",
                            );
                          }
                        },
                      })
                    }
                    variant="destructive"
                  />
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
      {showDemoReset ? (
        <ConfirmationDialog
          confirmLabel="Reset demo data"
          description="All current records, cover photos, and local attachment files will be replaced by the editable Mangalya demo workspace."
          onCancel={() => setResetOpen(false)}
          onConfirm={() =>
            mutation.mutate((repositories) => repositories.workspace.resetDemo(), {
              onSuccess: () => {
                clearWorkspaceLocalFiles();
                setResetOpen(false);
              },
              onError: (error) => {
                Alert.alert("Could not reset demo data", toUserMessage(error));
              },
            })
          }
          pending={mutation.isPending}
          title="Restore demo data?"
          visible={resetOpen}
        />
      ) : null}
    </Screen>
  );
}
