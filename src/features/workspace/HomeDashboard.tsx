import { useState } from "react";
import { Alert, Linking, ScrollView, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  CalendarPlus,
  CircleCheckBig,
  CheckSquare2,
  ChevronRight,
  Plus,
  ReceiptIndianRupee,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";

import { MangalyaHeader } from "@/components/brand";
import {
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  MotionPressable,
  Screen,
} from "@/components/ui";
import { daysUntilDateOnly, todayDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";

import { pickWeddingCoverPhoto, removeWeddingCoverPhoto } from "./files/workspace-files";
import { HomeBudgetOverview, WeddingHero } from "./home";
import { useWorkspace, useWorkspaceMutation } from "./provider";
import { homeBudgetSummary, selectHomeNextActions, taskProgress } from "./selectors";
import { TaskCompletionRow } from "./TaskCompletionRow";
import type { Task } from "./types";

const homeArtworkHeight = 380;
const homeArtworkFadeHeight = 180;
const homeArtworkFadeColors = [tokens.gradients.screenTopFade[2], tokens.colors.canvas] as const;
const homeArtworkSource = require("../../../assets/images/mangalya/home-hearts-glow-v2.jpg");

type HomeAddRoute = "/events/new" | "/expenses/new" | "/more/guests/new" | "/tasks/new";

const homeQuickActions: { icon: LucideIcon; label: string; route: HomeAddRoute }[] = [
  { icon: CheckSquare2, label: "Add task", route: "/tasks/new" },
  { icon: ReceiptIndianRupee, label: "Add expense", route: "/expenses/new" },
  { icon: CalendarPlus, label: "Add event", route: "/events/new" },
  { icon: UserPlus, label: "Add guest", route: "/more/guests/new" },
];

const localCoverErrorMessage = (error: unknown) => {
  if (
    error instanceof Error &&
    /Cover photos must|Choose an image for the wedding cover/.test(error.message)
  ) {
    return error.message;
  }
  return toUserMessage(error);
};

function HomeBackdrop() {
  return (
    <View
      accessibilityElementsHidden
      className="absolute inset-0"
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <Image
        accessible={false}
        contentFit="cover"
        contentPosition="top"
        pointerEvents="none"
        source={homeArtworkSource}
        style={{ height: homeArtworkHeight, left: 0, position: "absolute", right: 0, top: 0 }}
        testID="home-hearts-background"
      />
      <LinearGradient
        colors={homeArtworkFadeColors}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={{
          height: homeArtworkFadeHeight,
          left: 0,
          position: "absolute",
          right: 0,
          top: homeArtworkHeight - homeArtworkFadeHeight,
        }}
      />
    </View>
  );
}

function HomeSectionHeader({
  actionLabel,
  onAction,
  title,
}: {
  actionLabel?: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-sm">
      <AppText accessibilityRole="header" className="flex-1" variant="title">
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <MotionPressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          android_ripple={{ color: tokens.colors.primarySoft }}
          className="min-h-12 flex-row items-center justify-center gap-2xs rounded-control px-xs active:bg-primarySoft"
          onPress={onAction}
          pressedScale={0.98}
        >
          <AppText tone="primary" variant="label">
            {actionLabel}
          </AppText>
          <ChevronRight color={tokens.colors.primary} size={tokens.iconSize.sm} />
        </MotionPressable>
      ) : null}
    </View>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <MotionPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.primarySoft }}
      className="min-h-24 min-w-0 flex-1 items-center justify-center gap-xs rounded-card border border-borderSubtle bg-translucentSurface px-2xs py-sm shadow-card active:bg-primarySoft"
      onPress={onPress}
      pressedScale={0.98}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primarySoft">
        <Icon color={tokens.colors.primary} size={tokens.iconSize.md} strokeWidth={1.7} />
      </View>
      <AppText className="text-center" numberOfLines={2} variant="caption">
        {label}
      </AppText>
    </MotionPressable>
  );
}

export function HomeDashboard() {
  const { fontScale } = useWindowDimensions();
  const [today] = useState(() => todayDateOnly());
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const workspace = useWorkspace();
  const taskMutation = useWorkspaceMutation();
  const photoMutation = useWorkspaceMutation();
  const largeText = isLargeText(fontScale);

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
  const eventNameById = new Map(data.events.map((event) => [event.id, event.name]));

  const toggleTask = (task: Task) => {
    if (taskMutation.isPending) return;
    taskMutation.mutate(
      (repositories) =>
        repositories.tasks.updateTask({
          ...task,
          status: "Completed",
        }),
      {
        onSuccess: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      },
    );
  };

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
      void Haptics.selectionAsync();
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

  const openAddRoute = (route: HomeAddRoute) => {
    router.navigate(route);
  };
  const quickActionRows = largeText
    ? [homeQuickActions.slice(0, 2), homeQuickActions.slice(2)]
    : [homeQuickActions];

  return (
    <Screen>
      <HomeBackdrop />
      <ScrollView
        contentContainerClassName="gap-lg px-md pt-xs"
        contentContainerStyle={{
          paddingBottom: tokens.touchTarget + Number.parseInt(tokens.spacing["4xl"], 10),
        }}
        showsVerticalScrollIndicator={false}
        testID="home-scroll-view"
      >
        <MangalyaHeader />
        <WeddingHero
          completedTasks={progress.completed}
          coverPhotoUri={data.wedding.coverPhotoUri}
          daysUntilWedding={daysUntilDateOnly(data.wedding.date, today)}
          isPhotoPending={isPickingPhoto || photoMutation.isPending}
          name={data.wedding.name}
          onPhotoPress={() => void handleCoverPhotoPress()}
          totalTasks={progress.total}
          weddingDate={data.wedding.date}
        />

        <View className="gap-sm">
          <HomeSectionHeader
            actionLabel="View all"
            onAction={() => router.navigate({ pathname: "/plan", params: { view: "tasks" } })}
            title="Focus today"
          />
          {taskMutation.isError ? (
            <View accessibilityRole="alert" className="gap-2xs rounded-control bg-dangerSoft p-md">
              <AppText tone="danger" variant="label">
                Task update failed
              </AppText>
              <AppText tone="danger" variant="caption">
                {toUserMessage(taskMutation.error)} Open the task to review it or try again.
              </AppText>
            </View>
          ) : null}
          {nextActions.length ? (
            <View className="gap-sm">
              {nextActions.map((task) => (
                <TaskCompletionRow
                  disabled={taskMutation.isPending}
                  eventName={eventNameById.get(task.eventId ?? "")}
                  key={task.id}
                  onPress={() => router.navigate(`/tasks/${task.id}`)}
                  onToggle={() => toggleTask(task)}
                  task={task}
                  today={today}
                  variant="compact"
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={CircleCheckBig}
              description="You’re all caught up for now."
              title="Nothing needs attention"
            />
          )}
        </View>

        <View className="gap-sm">
          <HomeSectionHeader title="Budget overview" />
          <HomeBudgetOverview
            onPress={() => router.navigate("/budget/overview")}
            summary={budget}
          />
        </View>

        <View className="gap-sm">
          <AppText accessibilityRole="header" variant="title">
            Quick actions
          </AppText>
          <View className="gap-xs" testID="home-quick-actions">
            {quickActionRows.map((row, rowIndex) => (
              <View
                className="flex-row gap-xs"
                key={row[0]?.label}
                testID={`home-quick-action-row-${rowIndex}`}
              >
                {row.map((action) => (
                  <QuickAction
                    icon={action.icon}
                    key={action.label}
                    label={action.label}
                    onPress={() => openAddRoute(action.route)}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View className="absolute bottom-lg right-md">
        <MotionPressable
          accessibilityHint="Opens the quick expense form"
          accessibilityLabel="Add expense"
          accessibilityRole="button"
          android_ripple={{ color: tokens.colors.primarySoft, radius: 28 }}
          className="h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-primary bg-primary shadow-elevated active:opacity-90"
          onPress={() => {
            void Haptics.selectionAsync();
            router.navigate("/expenses/new");
          }}
          pressedScale={0.96}
        >
          <Plus color={tokens.colors.onPrimary} size={tokens.iconSize.lg} strokeWidth={2.2} />
        </MotionPressable>
      </View>
    </Screen>
  );
}
