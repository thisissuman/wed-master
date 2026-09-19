import { useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import CircleCheckBig from "lucide-react-native/icons/circle-check-big";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import ReceiptIndianRupee from "lucide-react-native/icons/receipt-indian-rupee";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MangalyaHeader } from "@/components/brand";
import {
  AppText,
  EmptyState,
  ErrorState,
  FloatingActionButton,
  LoadingState,
  MotionPressable,
  Screen,
} from "@/components/ui";
import { daysUntilDateOnly } from "@/lib/dates";
import { useTodayDateOnly } from "@/lib/dates/useTodayDateOnly";
import { toUserMessage } from "@/lib/errors";
import { runNonCriticalNativeEffect } from "@/lib/native-effects";
import { tokens, useAppTheme, useAppThemeStore } from "@/theme";

import {
  coverPhotoErrorMessage,
  pickWeddingCoverPhoto,
  removeWeddingCoverPhoto,
} from "./files/workspace-files";
import { HomeBudgetOverview, WeddingHero } from "./home";
import { useWorkspace, useWorkspaceMutation } from "./provider";
import { homeBudgetSummary, selectHomeNextActions, taskProgress } from "./selectors";
import { TaskCompletionRow } from "./TaskCompletionRow";
import { useTaskStatusAction } from "./useTaskStatusAction";

const keepsakeBackgroundBlur = Number.parseInt(tokens.spacing.xs, 10);
const homeFabInset = Number.parseInt(tokens.spacing.md, 10);
const homeBottomClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["4xl"], 10);

const localCoverErrorMessage = (error: unknown) =>
  (typeof coverPhotoErrorMessage === "function" ? coverPhotoErrorMessage(error) : undefined) ??
  toUserMessage(error);

function HomeSectionHeader({
  actionLabel,
  onAction,
  title,
}: {
  actionLabel?: string;
  onAction?: () => void;
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <View className="flex-row items-center justify-between gap-sm">
      <AppText accessibilityRole="header" className="flex-1" tone="brand" variant="heading">
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <MotionPressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          android_ripple={{ color: theme.colors.primarySoft }}
          className="min-h-4xl flex-row items-center justify-center gap-2xs rounded-control px-xs active:bg-primarySoft"
          onPress={onAction}
          pressedScale={0.98}
        >
          <AppText tone="primary" variant="label">
            {actionLabel}
          </AppText>
          <ChevronRight color={theme.colors.primary} size={tokens.iconSize.sm} />
        </MotionPressable>
      ) : null}
    </View>
  );
}

export function HomeDashboard() {
  const insets = useSafeAreaInsets();
  const today = useTodayDateOnly();
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [keepsakeFocused, setKeepsakeFocused] = useState(false);
  const workspace = useWorkspace();
  const photoMutation = useWorkspaceMutation();
  const taskStatusAction = useTaskStatusAction();
  const weddingCardThemeId = useAppThemeStore((state) => state.themeId);

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open your home"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening your wedding workspace" />
      </Screen>
    );
  }

  const data = workspace.data;
  const nextActions = selectHomeNextActions(data.tasks, today);
  const progress = taskProgress(data.tasks);
  const budget = homeBudgetSummary(data);
  const allTasksFinished =
    data.tasks.length > 0 &&
    data.tasks.every((task) => task.status === "Completed" || task.status === "Cancelled");
  const eventNameById = new Map(data.events.map((event) => [event.id, event.name]));

  async function handleCoverPhotoPress() {
    if (isPickingPhoto || photoMutation.isPending) return;
    setIsPickingPhoto(true);
    let newPhotoUri: string | undefined;

    try {
      const result = await pickWeddingCoverPhoto();
      if (result.status === "cancelled") return;
      if (result.status === "permission-denied") {
        const openSettings = () => {
          void Linking.openSettings().catch(() => {
            Alert.alert(
              "Could not open settings",
              "Open Mangalya in your device settings and allow photo access.",
            );
          });
        };
        if (result.canAskAgain) {
          Alert.alert(
            "Photo access needed",
            "Allow photo access to choose a wedding cover. Your current cover will stay unchanged.",
            [
              { style: "cancel", text: "Not now" },
              { onPress: openSettings, text: "Open settings" },
              { onPress: () => void handleCoverPhotoPress(), text: "Try again" },
            ],
          );
        } else {
          Alert.alert(
            "Photo access needed",
            "Photo access is disabled. Open device settings to choose a wedding cover.",
            [
              { style: "cancel", text: "Not now" },
              { onPress: openSettings, text: "Open settings" },
            ],
          );
        }
        return;
      }

      newPhotoUri = result.uri;
      const previousPhotoUri = data.wedding.coverPhotoUri;
      await photoMutation.mutateAsync((repositories) =>
        repositories.wedding.updateWedding({
          ...data.wedding,
          coverPhotoUri: newPhotoUri,
        }),
      );
      if (previousPhotoUri && previousPhotoUri !== newPhotoUri) {
        removeWeddingCoverPhoto(previousPhotoUri);
      }
      runNonCriticalNativeEffect(() => Haptics.selectionAsync());
    } catch (error) {
      if (newPhotoUri) removeWeddingCoverPhoto(newPhotoUri);
      Alert.alert(
        "Cover photo unchanged",
        `${localCoverErrorMessage(error)} Try another photo or try again.`,
      );
    } finally {
      setIsPickingPhoto(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-lg px-md pt-xs"
        contentContainerStyle={{ paddingBottom: homeBottomClearance }}
        showsVerticalScrollIndicator={false}
        style={keepsakeFocused ? { filter: [{ blur: keepsakeBackgroundBlur }] } : undefined}
        testID="home-scroll-view"
      >
        <MangalyaHeader />
        <WeddingHero
          completedTasks={progress.completed}
          coverPhotoUri={data.wedding.coverPhotoUri}
          daysUntilWedding={daysUntilDateOnly(data.wedding.date, today)}
          isPhotoPending={isPickingPhoto || photoMutation.isPending}
          keepsakeMessage={data.wedding.keepsakeMessage}
          name={data.wedding.name}
          onKeepsakeFocusChange={setKeepsakeFocused}
          onPhotoPress={() => void handleCoverPhotoPress()}
          totalTasks={progress.total}
          weddingCardThemeId={weddingCardThemeId}
          weddingDate={data.wedding.date}
        />

        <View className="gap-2xs">
          <HomeSectionHeader
            actionLabel="View all tasks"
            onAction={() => router.navigate({ pathname: "/plan", params: { view: "tasks" } })}
            title="Focus today"
          />
          {nextActions.length ? (
            <View className="gap-xs">
              {nextActions.map((task) => (
                <TaskCompletionRow
                  disabled={taskStatusAction.isPending}
                  eventName={eventNameById.get(task.eventId ?? "")}
                  key={task.id}
                  onPress={() => router.navigate(`/tasks/${task.id}`)}
                  onToggle={() => taskStatusAction.toggleTaskStatus(task)}
                  task={task}
                  today={today}
                  variant="compact"
                />
              ))}
            </View>
          ) : (
            <EmptyState
              actionLabel={data.tasks.length === 0 ? "Add your first task" : "View all tasks"}
              icon={CircleCheckBig}
              description={
                data.tasks.length === 0
                  ? "Start with one useful next step."
                  : "Your completed and cancelled tasks stay available in Plan."
              }
              onAction={() =>
                router.navigate(
                  data.tasks.length === 0
                    ? "/tasks/new"
                    : { pathname: "/plan", params: { view: "tasks" } },
                )
              }
              title={allTasksFinished ? "All tasks are wrapped up" : "No tasks yet"}
            />
          )}
        </View>

        <View className="gap-md">
          <HomeSectionHeader title="Budget overview" />
          <HomeBudgetOverview
            onPress={() => router.navigate("/budget/overview")}
            summary={budget}
          />
        </View>
      </ScrollView>
      <FloatingActionButton
        accessibilityHint="Opens the expense form"
        accessibilityLabel="Add expense"
        bottomInset={insets.bottom + homeFabInset}
        icon={ReceiptIndianRupee}
        onPress={() => router.navigate("/expenses/new")}
        testID="home-add-expense-fab"
      />
    </Screen>
  );
}
