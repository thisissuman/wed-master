import { router } from "expo-router";
import {
  CalendarDays,
  ChevronRight,
  IndianRupee,
  MapPin,
  RefreshCcw,
  Sparkles,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
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
  LoadingState,
  Screen,
  TextField,
} from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { formatInr } from "@/lib/money";
import { tokens } from "@/theme";

import { clearWorkspaceLocalFiles } from "../files/workspace-files";
import { fromPaise, settingsFormSchema, toPaise, type SettingsFormValues } from "../forms";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import type { Wedding } from "../types";

type SettingRowProps = {
  destructive?: boolean;
  icon: typeof Users;
  label: string;
  onPress: () => void;
  value: string;
};

function SettingRow({ destructive, icon: Icon, label, onPress, value }: SettingRowProps) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
      className="min-h-20 flex-row items-center gap-sm border-b border-borderSubtle py-sm last:border-b-0"
      onPress={onPress}
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
    </Pressable>
  );
}

export function WeddingSettingsDashboard() {
  const reduceMotion = useReducedMotion();
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: "",
      date: "",
      location: "",
      type: "",
      guestEstimate: "0",
      budgetTarget: "",
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
      guestEstimate: String(wedding.guestEstimate ?? 0),
      budgetTarget: fromPaise(wedding.budgetTargetPaise),
    });
    setEditOpen(true);
  };
  const save = handleSubmit(async (values) => {
    const next: Wedding = {
      ...wedding,
      name: values.name,
      date: values.date as Wedding["date"],
      location: values.location,
      type: values.type,
      guestEstimate: Number(values.guestEstimate),
      budgetTargetPaise: values.budgetTarget ? toPaise(values.budgetTarget) : undefined,
    };
    await mutation.mutateAsync((repositories) => repositories.wedding.updateWedding(next));
    setEditOpen(false);
  });

  const field = (
    name: "budgetTarget" | "guestEstimate" | "location" | "name" | "type",
    label: string,
    keyboardType?: "decimal-pad" | "number-pad",
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: input }) => (
        <TextField
          error={errors[name]?.message}
          keyboardType={keyboardType}
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
        <MoreScreenHeader title="Wedding settings" weddingName={wedding.name} />
        <AppText tone="muted">Manage your wedding details and preferences</AppText>
        <Card className="px-lg py-xs">
          <SettingRow
            icon={Users}
            label="Couple or wedding name"
            onPress={openEditor}
            value={wedding.name}
          />
          <SettingRow
            icon={CalendarDays}
            label="Wedding date"
            onPress={openEditor}
            value={formatDateOnly(wedding.date)}
          />
          <SettingRow icon={MapPin} label="City" onPress={openEditor} value={wedding.location} />
          <SettingRow
            icon={Sparkles}
            label="Wedding style or tradition"
            onPress={openEditor}
            value={wedding.type}
          />
          <SettingRow
            icon={Users}
            label="Guest estimate"
            onPress={openEditor}
            value={`${wedding.guestEstimate ?? 0} guests`}
          />
          <SettingRow
            icon={IndianRupee}
            label="Currency"
            onPress={() =>
              Alert.alert("Currency", "Mangalya currently stores all money in INR integer paise.")
            }
            value="INR (Indian Rupee)"
          />
          <SettingRow
            icon={CalendarDays}
            label="Event management"
            onPress={() => router.push({ pathname: "/plan", params: { view: "events" } })}
            value={`${workspace.data.events.length} events planned`}
          />
          <SettingRow
            icon={WalletCards}
            label="Budget target"
            onPress={openEditor}
            value={
              wedding.budgetTargetPaise !== undefined
                ? formatInr(wedding.budgetTargetPaise)
                : "Not set"
            }
          />
        </Card>
        <Card className="px-lg py-xs">
          <SettingRow
            destructive
            icon={RefreshCcw}
            label="Reset demo data"
            onPress={() => setResetOpen(true)}
            value="Clear local changes and restore editable demo content"
          />
          <SettingRow
            destructive
            icon={Trash2}
            label="Delete local data"
            onPress={() =>
              Alert.alert(
                "Not available yet",
                "Full local-data deletion is intentionally deferred until onboarding can safely create a new workspace. No data was changed.",
              )
            }
            value="Deferred until onboarding is functional"
          />
        </Card>
      </ScrollView>

      <Modal
        animationType={reduceMotion ? "none" : "slide"}
        onRequestClose={() => setEditOpen(false)}
        transparent
        visible={editOpen}
      >
        <View className="flex-1 justify-end bg-overlay">
          <View className="max-h-[90%] gap-md rounded-t-sheet bg-elevatedSurface p-lg shadow-elevated">
            <View className="flex-row items-center justify-between">
              <AppText tone="primary" variant="heading">
                Edit wedding details
              </AppText>
              <Pressable
                accessibilityLabel="Close settings editor"
                className="min-h-12 min-w-12 items-center justify-center"
                onPress={() => setEditOpen(false)}
              >
                <X color={tokens.colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView contentContainerClassName="gap-md" keyboardShouldPersistTaps="handled">
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
              {field("guestEstimate", "Guest estimate", "number-pad")}
              {field("budgetTarget", "Budget target (₹)", "decimal-pad")}
              {mutation.error ? (
                <AppText tone="danger" variant="caption">
                  {toUserMessage(mutation.error)}
                </AppText>
              ) : null}
              <Button
                label="Save settings"
                loading={isSubmitting || mutation.isPending}
                onPress={save}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    </Screen>
  );
}
