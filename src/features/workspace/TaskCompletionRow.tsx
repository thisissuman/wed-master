import { memo, useEffect, useRef } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Camera from "lucide-react-native/icons/camera";
import Car from "lucide-react-native/icons/car";
import Check from "lucide-react-native/icons/check";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Gift from "lucide-react-native/icons/gift";
import Landmark from "lucide-react-native/icons/landmark";
import ListChecks from "lucide-react-native/icons/list-checks";
import Mail from "lucide-react-native/icons/mail";
import UtensilsCrossed from "lucide-react-native/icons/utensils-crossed";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { AppText, MotionPressable, OverflowMarqueeText, StatusBadge } from "@/components/ui";
import { formatDateOnly, formatShortDateOnly } from "@/lib/dates";
import { isLargeText } from "@/lib/responsive";
import { tokens, useAppTheme } from "@/theme";
import {
  exitTransition,
  motionTiming,
  stateEnteringTransition,
  stateLayoutTransition,
} from "@/theme/motion";

import { isOverdue } from "./selectors";
import type { Task } from "./types";

const compactRowHeight = 72;
const detailedRowHeight = 88;
const spacing2xs = Number.parseInt(tokens.spacing["2xs"], 10);
const spacingXs = Number.parseInt(tokens.spacing.xs, 10);
const spacingSm = Number.parseInt(tokens.spacing.sm, 10);

const styles = StyleSheet.create({
  badgeContainer: {
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "center",
  },
  card: {
    alignItems: "stretch",
    flexDirection: "row",
    minWidth: 0,
    overflow: "hidden",
  },
  checkboxButton: {
    alignItems: "center",
    alignSelf: "stretch",
    flexShrink: 0,
    justifyContent: "center",
    marginLeft: spacing2xs,
    width: tokens.touchTarget,
  },
  chevronContainer: {
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "center",
    width: tokens.iconSize.sm,
  },
  content: {
    rowGap: spacing2xs,
  },
  contentColumn: {
    alignSelf: "stretch",
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  detailArea: {
    alignItems: "center",
    alignSelf: "stretch",
    columnGap: spacing2xs,
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
    paddingBottom: spacingSm,
    paddingLeft: spacing2xs,
    paddingRight: spacingXs,
    paddingTop: spacingSm,
  },
  detailAreaLargeText: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  disabled: {
    opacity: 0.5,
  },
  iconColumn: {
    alignItems: "center",
    alignSelf: "stretch",
    flexShrink: 0,
    justifyContent: "center",
    width: tokens.touchTarget,
  },
  mainButton: {
    alignItems: "stretch",
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
    overflow: "hidden",
  },
  metadata: {
    alignItems: "center",
    columnGap: spacing2xs,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing2xs,
  },
  metadataCompact: {
    flexWrap: "nowrap",
    overflow: "hidden",
  },
  eventMetadataItem: {
    flexShrink: 1,
    minWidth: 0,
  },
  metadataItem: {
    alignItems: "center",
    columnGap: spacing2xs,
    flexDirection: "row",
  },
  trailing: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    flexShrink: 0,
  },
  trailingLargeText: {
    alignSelf: "stretch",
    justifyContent: "space-between",
    paddingTop: spacingXs,
  },
});

const priorityTone: Record<Task["priority"], "danger" | "success" | "warning"> = {
  Critical: "danger",
  High: "danger",
  Medium: "warning",
  Low: "success",
};

const taskBadge = (task: Task, overdue: boolean) => {
  if (task.status === "Completed") return { label: "Completed", tone: "success" as const };
  if (task.status === "Cancelled") return { label: "Cancelled", tone: "neutral" as const };
  if (overdue) return { label: "Overdue", tone: "danger" as const };
  return { label: task.priority, tone: priorityTone[task.priority] };
};

const taskDueLabel = (task: Task, today: string, overdue: boolean) => {
  if (!task.dueDate) return "No due date";
  if (overdue) return `Overdue · ${formatDateOnly(task.dueDate)}`;
  if (task.dueDate === today) return "Due today";
  return `Due ${formatDateOnly(task.dueDate)}`;
};

const visibleTaskDueLabel = (task: Task, today: string, overdue: boolean) => {
  if (!task.dueDate) return "No date";
  if (task.dueDate === today) return "Today";
  const date = formatShortDateOnly(task.dueDate);
  return overdue ? `Overdue · ${date}` : date;
};

function TaskCategoryIcon({ task }: { task: Task }) {
  const theme = useAppTheme();
  const context = `${task.category ?? ""} ${task.title}`.toLowerCase();
  const iconProps = {
    color: theme.colors.primary,
    size: tokens.iconSize.md,
    strokeWidth: 1.8,
  };

  if (/venue|mandap|location/.test(context)) return <Landmark {...iconProps} />;
  if (/photo|camera|artist/.test(context)) return <Camera {...iconProps} />;
  if (/gift/.test(context)) return <Gift {...iconProps} />;
  if (/food|cater|menu/.test(context)) return <UtensilsCrossed {...iconProps} />;
  if (/invite|invitation/.test(context)) return <Mail {...iconProps} />;
  if (/transport|travel|accommodation|pickup/.test(context)) return <Car {...iconProps} />;
  return <ListChecks {...iconProps} />;
}

export type TaskCompletionRowProps = {
  disabled?: boolean;
  eventName?: string;
  onPress: () => void;
  onToggle: () => void;
  task: Task;
  today: string;
  variant?: "compact" | "detailed";
};

export const TaskCompletionRow = memo(function TaskCompletionRow({
  disabled = false,
  eventName,
  onPress,
  onToggle,
  task,
  today,
  variant = "detailed",
}: TaskCompletionRowProps) {
  const theme = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const completed = task.status === "Completed";
  const overdue = !completed && task.status !== "Cancelled" && isOverdue(task.dueDate, today);
  const badge = taskBadge(task, overdue);
  const dueLabel = taskDueLabel(task, today, overdue);
  const compactBadge =
    completed || task.status === "Cancelled"
      ? badge
      : { label: task.priority, tone: priorityTone[task.priority] };
  const visibleBadge = variant === "compact" ? compactBadge : badge;
  const visibleDueLabel = visibleTaskDueLabel(task, today, overdue);
  const rowMinHeight = variant === "compact" ? compactRowHeight : detailedRowHeight;
  const completion = useSharedValue(completed ? 1 : 0);
  const previousTaskId = useRef(task.id);
  const largeText = isLargeText(fontScale);

  useEffect(() => {
    if (previousTaskId.current !== task.id) {
      previousTaskId.current = task.id;
      completion.set(completed ? 1 : 0);
      return;
    }
    completion.set(withTiming(completed ? 1 : 0, motionTiming.state));
  }, [completed, completion, task.id]);

  const openIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - completion.value,
    transform: [{ scale: 1 - completion.value * 0.16 }],
  }));
  const completedIconStyle = useAnimatedStyle(() => ({
    opacity: completion.value,
    transform: [{ scale: 0.72 + completion.value * 0.28 }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - completion.value * 0.18,
  }));

  const accessibilityHint = [
    eventName ? `Event: ${eventName}` : undefined,
    dueLabel,
    `Priority: ${task.priority}`,
    `Status: ${badge.label}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Animated.View
      entering={variant === "compact" ? stateEnteringTransition : undefined}
      exiting={variant === "compact" ? exitTransition : undefined}
      layout={stateLayoutTransition}
    >
      <View
        className={`relative flex-row items-stretch overflow-hidden rounded-card border ${
          variant === "compact"
            ? "border-transparent bg-surfaceMuted"
            : "border-borderSubtle bg-elevatedSurface"
        }`}
        style={styles.card}
      >
        <Pressable
          accessibilityLabel={`${completed ? "Reopen" : "Mark complete"}: ${task.title}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed, disabled }}
          android_ripple={{ color: theme.colors.primarySoft }}
          disabled={disabled}
          onPress={onToggle}
          style={[
            styles.checkboxButton,
            { minHeight: rowMinHeight },
            disabled ? styles.disabled : undefined,
          ]}
        >
          <View className="h-8 w-8 items-center justify-center">
            <Animated.View style={[{ position: "absolute" }, openIconStyle]}>
              <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-elevatedSurface">
                <View className="h-6 w-6 rounded-full border border-primarySoft" />
              </View>
            </Animated.View>
            <Animated.View style={[{ position: "absolute" }, completedIconStyle]}>
              <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Check color={theme.colors.onPrimary} size={tokens.iconSize.sm} strokeWidth={2.4} />
              </View>
            </Animated.View>
          </View>
        </Pressable>
        <MotionPressable
          accessibilityHint={accessibilityHint}
          accessibilityLabel={`Open task: ${task.title}`}
          accessibilityRole="button"
          android_ripple={{ color: theme.colors.primarySoft }}
          onPress={onPress}
          pressedScale={0.995}
          style={[styles.mainButton, { minHeight: rowMinHeight }]}
          testID={`task-open-button-${task.id}`}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={styles.iconColumn}
          >
            <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
              <TaskCategoryIcon task={task} />
            </View>
          </View>
          <View
            style={[
              styles.detailArea,
              { minHeight: rowMinHeight },
              largeText ? styles.detailAreaLargeText : undefined,
            ]}
            testID="task-detail-area"
          >
            <View style={styles.contentColumn}>
              <Animated.View style={[styles.content, contentStyle]}>
                <OverflowMarqueeText
                  accessible={false}
                  fadeColor={
                    variant === "compact" ? theme.colors.surfaceMuted : theme.colors.elevatedSurface
                  }
                  style={completed ? { textDecorationLine: "line-through" } : undefined}
                  text={task.title}
                  variant="label"
                />
                <View
                  style={[
                    styles.metadata,
                    variant === "compact" ? styles.metadataCompact : undefined,
                  ]}
                >
                  {eventName ? (
                    <View style={[styles.metadataItem, styles.eventMetadataItem]}>
                      <View className="h-2xs w-2xs rounded-full bg-borderStrong" />
                      <AppText numberOfLines={1} tone="muted" variant="caption">
                        {eventName}
                      </AppText>
                    </View>
                  ) : null}
                  {eventName ? (
                    <View style={styles.metadataItem}>
                      <View className="h-2xs w-2xs rounded-full bg-borderStrong" />
                      <AppText tone={overdue ? "danger" : "primary"} variant="caption">
                        {visibleDueLabel}
                      </AppText>
                    </View>
                  ) : (
                    <AppText tone={overdue ? "danger" : "primary"} variant="caption">
                      {visibleDueLabel}
                    </AppText>
                  )}
                </View>
              </Animated.View>
            </View>
            <View style={[styles.trailing, largeText ? styles.trailingLargeText : undefined]}>
              <View style={styles.badgeContainer}>
                <StatusBadge label={visibleBadge.label} tone={visibleBadge.tone} />
              </View>
              <View style={styles.chevronContainer}>
                <ChevronRight
                  color={theme.colors.secondary}
                  size={tokens.iconSize.sm}
                  strokeWidth={1.9}
                />
              </View>
            </View>
          </View>
        </MotionPressable>
      </View>
    </Animated.View>
  );
});
