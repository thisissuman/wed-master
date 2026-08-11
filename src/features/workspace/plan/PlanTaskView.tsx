import { forwardRef, type ReactElement, useImperativeHandle, useRef } from "react";
import { useWindowDimensions, View, type ViewProps } from "react-native";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import {
  CalendarDays,
  CircleAlert,
  CircleCheckBig,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react-native";
import Animated from "react-native-reanimated";

import { AppText, EmptyState, FilterChip } from "@/components/ui";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";
import { stateLayoutTransition } from "@/theme/motion";

import { type TaskFilterState } from "../selectors";
import { TaskCompletionRow } from "../TaskCompletionRow";
import type { Task } from "../types";
import { PlanHeader, type PlanView } from "./PlanShared";

export type TaskSummary = { completed: number; overdue: number; today: number };

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const itemGap = Number.parseInt(tokens.spacing.sm, 10);
const listFooterClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["2xl"], 10) * 2;

function SummaryItem({
  accessibilityLabel,
  icon,
  label,
  tone,
  value,
}: {
  accessibilityLabel: string;
  icon: ReactElement;
  label: string;
  tone: "primary" | "danger";
  value: number;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      accessible
      className="min-h-12 flex-1 flex-row items-center justify-center gap-2xs px-xs"
    >
      {icon}
      <AppText variant="caption">{label}</AppText>
      <AppText style={{ fontVariant: ["tabular-nums"] }} tone={tone} variant="label">
        {value}
      </AppText>
    </View>
  );
}

export function TaskSummaryCard({ summary }: { summary: TaskSummary }) {
  const { fontScale } = useWindowDimensions();
  const largeText = isLargeText(fontScale);

  if (largeText) {
    return (
      <View className="gap-2xs rounded-control bg-surfaceMuted p-xs">
        {[
          {
            icon: <CalendarDays color={tokens.colors.primary} size={tokens.iconSize.sm} />,
            label: "Today",
            tone: "primary" as const,
            value: summary.today,
          },
          {
            icon: <CircleAlert color={tokens.colors.danger} size={tokens.iconSize.sm} />,
            label: "Overdue",
            tone: "danger" as const,
            value: summary.overdue,
          },
          {
            icon: <CircleCheckBig color={tokens.colors.primary} size={tokens.iconSize.sm} />,
            label: "Completed",
            tone: "primary" as const,
            value: summary.completed,
          },
        ].map((item) => (
          <View
            accessibilityLabel={
              item.label === "Today"
                ? `${item.value} ${item.value === 1 ? "task" : "tasks"} due today`
                : `${item.value} ${item.label.toLowerCase()} ${item.value === 1 ? "task" : "tasks"}`
            }
            accessibilityRole="text"
            accessible
            className="min-h-10 flex-row items-center gap-xs px-sm"
            key={item.label}
          >
            {item.icon}
            <AppText className="flex-1" variant="caption">
              {item.label}
            </AppText>
            <AppText style={{ fontVariant: ["tabular-nums"] }} tone={item.tone} variant="label">
              {item.value}
            </AppText>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row items-center rounded-control bg-surfaceMuted px-xs">
      <SummaryItem
        accessibilityLabel={`${summary.today} ${summary.today === 1 ? "task" : "tasks"} due today`}
        icon={<CalendarDays color={tokens.colors.primary} size={tokens.iconSize.sm} />}
        label="Today"
        tone="primary"
        value={summary.today}
      />
      <View className="h-6 w-px bg-borderStrong" />
      <SummaryItem
        accessibilityLabel={`${summary.overdue} overdue ${summary.overdue === 1 ? "task" : "tasks"}`}
        icon={<CircleAlert color={tokens.colors.danger} size={tokens.iconSize.sm} />}
        label="Overdue"
        tone="danger"
        value={summary.overdue}
      />
      <View className="h-6 w-px bg-borderStrong" />
      <SummaryItem
        accessibilityLabel={`${summary.completed} completed ${summary.completed === 1 ? "task" : "tasks"}`}
        icon={<CircleCheckBig color={tokens.colors.primary} size={tokens.iconSize.sm} />}
        label="Completed"
        tone="primary"
        value={summary.completed}
      />
    </View>
  );
}

type AnimatedCellProps = ViewProps & { index?: number };

const AnimatedCellRenderer = forwardRef<View, AnimatedCellProps>(function AnimatedCellRenderer(
  { index: _index, ...viewProps },
  ref,
) {
  return <Animated.View {...viewProps} layout={stateLayoutTransition} ref={ref} />;
});

export type PlanTaskViewHandle = {
  prepareForLayoutAnimation: () => void;
};

type PlanTaskViewProps = {
  advancedFilterCount: number;
  eventNameById: (id?: string) => string | undefined;
  filters: TaskFilterState;
  hasAnyTasks: boolean;
  mutationError?: string;
  mutationPending: boolean;
  onClearFilters: () => void;
  onFiltersOpen: () => void;
  onTaskPress: (task: Task) => void;
  onTaskToggle: (task: Task) => void;
  onViewChange: (view: PlanView) => void;
  summary: TaskSummary;
  tasks: Task[];
  today: string;
};

export const PlanTaskView = forwardRef<PlanTaskViewHandle, PlanTaskViewProps>(function PlanTaskView(
  {
    advancedFilterCount,
    eventNameById,
    filters,
    hasAnyTasks,
    mutationError,
    mutationPending,
    onClearFilters,
    onFiltersOpen,
    onTaskPress,
    onTaskToggle,
    onViewChange,
    summary,
    tasks,
    today,
  },
  ref,
) {
  const listRef = useRef<FlashListRef<Task>>(null);

  useImperativeHandle(ref, () => ({
    prepareForLayoutAnimation: () => listRef.current?.prepareForLayoutAnimationRender(),
  }));

  const header = (
    <View className="gap-md pb-md">
      <PlanHeader activeView="tasks" onViewChange={onViewChange} />
      <TaskSummaryCard summary={summary} />
      {mutationError ? (
        <View
          accessibilityRole="alert"
          accessible
          className="gap-2xs rounded-control bg-dangerSoft p-md"
        >
          <AppText tone="danger" variant="label">
            Task update failed
          </AppText>
          <AppText tone="danger" variant="caption">
            {mutationError}
          </AppText>
          <AppText tone="danger" variant="caption">
            Try again or open the task to review it.
          </AppText>
        </View>
      ) : null}
      <View className="flex-row items-center justify-between gap-sm">
        <AppText
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
          className="min-w-0 flex-1"
          variant="caption"
        >
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          {filters.dueWindow === "This Week" ? " due this week" : ""}
        </AppText>
        <FilterChip
          count={advancedFilterCount || undefined}
          icon={SlidersHorizontal}
          label="Filters"
          onPress={onFiltersOpen}
          selected={advancedFilterCount > 0}
        />
      </View>
    </View>
  );

  return (
    <FlashList
      CellRendererComponent={AnimatedCellRenderer}
      contentContainerStyle={{
        paddingBottom: listFooterClearance,
        paddingHorizontal: contentPadding,
        paddingTop: contentPadding,
      }}
      data={tasks}
      extraData={`${mutationPending}-${today}`}
      ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
      keyExtractor={(task) => task.id}
      ListEmptyComponent={
        <EmptyState
          actionIcon={hasAnyTasks ? RotateCcw : undefined}
          actionLabel={hasAnyTasks ? "Clear filters" : undefined}
          description={hasAnyTasks ? "Change or clear the current filters." : undefined}
          onAction={hasAnyTasks ? onClearFilters : undefined}
          title={hasAnyTasks ? "No matching tasks" : "No tasks yet"}
        />
      }
      ListHeaderComponent={header}
      ref={listRef}
      renderItem={({ item }) => (
        <TaskCompletionRow
          disabled={mutationPending}
          eventName={eventNameById(item.eventId)}
          onPress={() => onTaskPress(item)}
          onToggle={() => onTaskToggle(item)}
          task={item}
          today={today}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
});
