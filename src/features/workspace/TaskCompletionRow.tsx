import { memo, useEffect, useRef } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  Camera,
  Car,
  Check,
  ChevronRight,
  Gift,
  Landmark,
  ListChecks,
  Mail,
  UtensilsCrossed,
} from "lucide-react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { AppText, StatusBadge } from "@/components/ui";
import { formatDateOnly, formatShortDateOnly } from "@/lib/dates";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";
import {
  exitTransition,
  motionTiming,
  stateEnteringTransition,
  stateLayoutTransition,
} from "@/theme/motion";

import { isOverdue } from "./selectors";
import type { Task } from "./types";

const compactRowHeight = 84;
const detailedRowHeight = 88;
const spacing2xs = Number.parseInt(tokens.spacing["2xs"], 10);
const spacingXs = Number.parseInt(tokens.spacing.xs, 10);
const spacingSm = Number.parseInt(tokens.spacing.sm, 10);

const styles = StyleSheet.create({
  accentRail: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: spacing2xs,
  },
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
  metadata: {
    alignItems: "center",
    columnGap: spacing2xs,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing2xs,
  },
  metadataItem: {
    alignItems: "center",
    columnGap: spacing2xs,
    flexDirection: "row",
  },
  openButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    flexShrink: 0,
    minHeight: tokens.touchTarget,
  },
  openButtonLargeText: {
    alignSelf: "stretch",
    justifyContent: "space-between",
    paddingTop: spacingXs,
  },
  titleButton: {
    alignSelf: "stretch",
    minWidth: 0,
    paddingRight: spacingXs,
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
  const context = `${task.category ?? ""} ${task.title}`.toLowerCase();
  const iconProps = {
    color: tokens.colors.primary,
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
        className={`relative flex-row items-stretch overflow-hidden rounded-card border shadow-card ${
          variant === "compact"
            ? "border-translucentBorder bg-translucentSurface"
            : "border-borderSubtle bg-elevatedSurface"
        }`}
        style={styles.card}
      >
        <View
          accessibilityElementsHidden
          className="bg-primary"
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.accentRail}
        />
        <Pressable
          accessibilityLabel={`${completed ? "Reopen" : "Mark complete"}: ${task.title}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: completed, disabled }}
          android_ripple={{ color: tokens.colors.primarySoft }}
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
              <View className="h-8 w-8 items-center justify-center rounded-full bg-primary shadow-card">
                <Check
                  color={tokens.colors.onPrimary}
                  size={tokens.iconSize.sm}
                  strokeWidth={2.4}
                />
              </View>
            </Animated.View>
          </View>
        </Pressable>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={styles.iconColumn}
        >
          <View className="h-12 w-12 items-center justify-center rounded-control border border-translucentBorder bg-primarySoft shadow-card">
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
              <Pressable
                accessible={false}
                onPress={onPress}
                style={styles.titleButton}
                testID={`task-title-button-${task.id}`}
              >
                <AppText
                  accessible={false}
                  numberOfLines={2}
                  style={completed ? { textDecorationLine: "line-through" } : undefined}
                  variant="label"
                >
                  {task.title}
                </AppText>
              </Pressable>
              <View style={styles.metadata}>
                {eventName ? (
                  <View style={styles.metadataItem}>
                    <View className="h-2xs w-2xs rounded-full bg-borderStrong" />
                    <AppText tone="muted" variant="caption">
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
          <Pressable
            accessibilityHint={accessibilityHint}
            accessibilityLabel={`Open task: ${task.title}`}
            accessibilityRole="button"
            android_ripple={{ color: tokens.colors.primarySoft }}
            onPress={onPress}
            style={[styles.openButton, largeText ? styles.openButtonLargeText : undefined]}
          >
            <View style={styles.badgeContainer}>
              <StatusBadge label={visibleBadge.label} tone={visibleBadge.tone} />
            </View>
            <View style={styles.chevronContainer}>
              <ChevronRight
                color={tokens.colors.secondary}
                size={tokens.iconSize.sm}
                strokeWidth={1.9}
              />
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
});
