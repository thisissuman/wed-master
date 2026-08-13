import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, ScrollView, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  DateField,
  ImagePickerField,
  Screen,
  TextField,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";

import { pickWeddingCoverPhoto, removeWeddingCoverPhoto } from "../files/workspace-files";
import { setupFormSchema, toPaise, type SetupFormValues } from "../forms";
import { useCreateWorkspaceMutation } from "../provider";
import { createEmptyWorkspace, suggestedEventDefinitions } from "../seed";
import { SuggestedEventsSheet } from "../SuggestedEventsSheet";
import type { ISODate, StarterEventKey } from "../types";

const setupCoverErrorMessage = (error: unknown) =>
  error instanceof Error &&
  /Cover photos must|Choose an image for the wedding cover/.test(error.message)
    ? error.message
    : toUserMessage(error);

export function LocalSetupScreen() {
  const mutation = useCreateWorkspaceMutation();
  const pendingCoverPhotoRef = useRef<string | undefined>(undefined);
  const submissionInFlightRef = useRef(false);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string>();
  const [coverPhotoError, setCoverPhotoError] = useState<string>();
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [starterEventSelection, setStarterEventSelection] = useState<StarterEventKey[]>([
    "wedding",
  ]);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      name: "",
      date: "",
      budgetTarget: "",
    },
    mode: "onTouched",
  });

  useEffect(
    () => () => {
      if (pendingCoverPhotoRef.current) {
        removeWeddingCoverPhoto(pendingCoverPhotoRef.current);
      }
    },
    [],
  );

  const saveValues = async (values: SetupFormValues) => {
    if (submissionInFlightRef.current) return;
    submissionInFlightRef.current = true;
    try {
      await mutation.mutateAsync(
        createEmptyWorkspace(
          {
            name: values.name,
            date: values.date as ISODate,
            location: "To be decided",
            type: "Not specified",
            budgetTargetPaise: values.budgetTarget ? toPaise(values.budgetTarget) : undefined,
            coverPhotoUri: coverPhotoUri || undefined,
          },
          starterEventSelection,
        ),
      );
    } catch {
      return;
    } finally {
      submissionInFlightRef.current = false;
    }
    pendingCoverPhotoRef.current = undefined;
    router.replace("/(app)/(tabs)");
  };
  const save = () => void handleSubmit(saveValues)();

  const openPhotoSettings = () => {
    void Linking.openSettings().catch(() => {
      Alert.alert(
        "Could not open settings",
        "Open Mangalya in your device settings and allow photo access.",
      );
    });
  };

  const pickCoverPhoto = async () => {
    if (isPickingPhoto || mutation.isPending) return;
    setCoverPhotoError(undefined);
    setIsPickingPhoto(true);
    try {
      const result = await pickWeddingCoverPhoto();
      if (result.status === "cancelled") return;
      if (result.status === "permission-denied") {
        Alert.alert(
          "Photo access needed",
          result.canAskAgain
            ? "Allow photo access to choose a wedding photo, or continue without one."
            : "Photo access is disabled. You can continue without a photo or enable it in settings.",
          [
            { style: "cancel", text: "Continue without photo" },
            { onPress: openPhotoSettings, text: "Open settings" },
            ...(result.canAskAgain
              ? [{ onPress: () => void pickCoverPhoto(), text: "Try again" }]
              : []),
          ],
        );
        return;
      }
      if (pendingCoverPhotoRef.current) {
        removeWeddingCoverPhoto(pendingCoverPhotoRef.current);
      }
      pendingCoverPhotoRef.current = result.uri;
      setCoverPhotoUri(result.uri);
    } catch (error) {
      setCoverPhotoError(setupCoverErrorMessage(error));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const removeCoverPhoto = () => {
    if (pendingCoverPhotoRef.current) {
      removeWeddingCoverPhoto(pendingCoverPhotoRef.current);
      pendingCoverPhotoRef.current = undefined;
    }
    setCoverPhotoUri(undefined);
    setCoverPhotoError(undefined);
  };

  return (
    <Screen edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow gap-lg p-lg pb-2xl"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-xs pt-lg">
            <AppText tone="primary" variant="label">
              PRIVATE WORKSPACE
            </AppText>
            <AppText variant="display">Set up Mangalya</AppText>
            <AppText tone="muted">
              Start with the essentials. Mangalya keeps this workspace on your device; you choose
              when to export a backup.
            </AppText>
          </View>

          <View className="gap-md">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <TextField
                  autoCapitalize="words"
                  autoComplete="off"
                  error={errors.name?.message}
                  label="Couple names"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="e.g. Asha & Dev"
                  required
                  returnKeyType="done"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateField
                  error={errors.date?.message}
                  label="Wedding date"
                  onChange={field.onChange}
                  required
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="budgetTarget"
              render={({ field }) => (
                <TextField
                  autoCapitalize="none"
                  error={errors.budgetTarget?.message}
                  keyboardType="decimal-pad"
                  label="Budget target in ₹"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  optional
                  placeholder="You can add this later"
                  returnKeyType="done"
                  value={field.value}
                />
              )}
            />
            <ImagePickerField
              error={coverPhotoError}
              label="Wedding photo"
              loading={isPickingPhoto}
              onPick={() => void pickCoverPhoto()}
              onRemove={removeCoverPhoto}
              optional
              uri={coverPhotoUri}
            />
            <Card className="gap-sm bg-surfaceMuted shadow-none">
              <View className="gap-2xs">
                <AppText variant="label">Suggested events</AppText>
                <AppText tone="muted" variant="caption">
                  {starterEventSelection.length
                    ? `${starterEventSelection.length} selected · dates can be changed later`
                    : "No suggested events selected"}
                </AppText>
              </View>
              <Button
                label="Choose events"
                onPress={() => setEventsOpen(true)}
                variant="secondary"
              />
            </Card>
          </View>

          {mutation.error ? (
            <AppText accessibilityLiveRegion="polite" tone="danger" variant="caption">
              {toUserMessage(mutation.error)}
            </AppText>
          ) : null}
          <Button
            disabled={isPickingPhoto}
            label="Create private workspace"
            loading={isSubmitting || mutation.isPending}
            onPress={save}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <SuggestedEventsSheet
        availableEvents={suggestedEventDefinitions}
        confirmLabel="Use selected events"
        onChange={setStarterEventSelection}
        onClose={() => setEventsOpen(false)}
        onConfirm={() => setEventsOpen(false)}
        selectedKeys={starterEventSelection}
        visible={eventsOpen}
      />
    </Screen>
  );
}
