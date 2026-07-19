import { forwardRef, type ReactElement, useImperativeHandle, useRef } from "react";
import { ScrollView, View, type ViewProps } from "react-native";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import {
  CalendarDays,
  CircleAlert,
  CircleCheckBig,
  Flag,
  SlidersHorizontal,
} from "lucide-react-native";
import Animated from "react-native-reanimated";

import { AppText, EmptyState, FilterChip } from "@/components/ui";
import { tokens } from "@/theme";
import { stateLayoutTransition } from "@/theme/motion";

import { type TaskFilterState } from "../selectors";
import { TaskCompletionRow } from "../TaskCompletionRow";
import type { Task } from "../types";
import { PlanHeader, type PlanView } from "./PlanShared";

export type TaskSummary = { completed: number; overdue: number; today: number };
type TaskPreset = "all" | "anchor" | "urgent" | "week" | null;

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const itemGap = Number.parseInt(tokens.spacing.sm, 10);
const listFooterClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["2xl"], 10) * 2;

function SummaryItem({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactElement;
  label: string;
  tone: "primary" | "danger";
  value: number;
}) {
  return (
    <View className="flex-1 items-center gap-xs py-xs">
      <View
        className={
          tone === "danger" ? "rounded-full bg-dangerSoft p-sm" : "rounded-full bg-primarySoft p-sm"
        }
      >
        {icon}
      </View>
      <View className="items-center">
        <AppText variant="caption">{label}</AppText>
        <AppText tone={tone} variant="title">
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function TaskSummaryCard({ summary }: { summary: TaskSummary }) {
  return (
    <View className="flex-row items-center rounded-card border border-borderSubtle bg-elevatedSurface p-sm">
      <SummaryItem
        icon={<CalendarDays color={tokens.colors.primary} size={tokens.iconSize.md} />}
        label="Today"
        tone="primary"
        value={summary.today}
      />
      <View className="h-16 w-px bg-borderSubtle" />
      <SummaryItem
        icon={<CircleAlert color={tokens.colors.danger} size={tokens.iconSize.md} />}
        label="Overdue"
        tone="danger"
        value={summary.overdue}
      />
      <View className="h-16 w-px bg-borderSubtle" />
      <SummaryItem
        icon={<CircleCheckBig color={tokens.colors.primary} size={tokens.iconSize.md} />}
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
  activePreset: TaskPreset;
  advancedFilterCount: number;
  anchorEvent?: { id: string; name: string };
  eventNameById: (id?: string) => string | undefined;
  filters: TaskFilterState;
  hasAnyTasks: boolean;
  mutationError?: string;
  mutationPending: boolean;
  onFiltersOpen: () => void;
  onPreset: (preset: Exclude<TaskPreset, null>) => void;
  onTaskPress: (task: Task) => void;
  onTaskToggle: (task: Task) => void;
  onViewChange: (view: PlanView) => void;
  summary: TaskSummary;
  tasks: Task[];
  today: string;
};

export const PlanTaskView = forwardRef<PlanTaskViewHandle, PlanTaskViewProps>(function PlanTaskView(
  {
    activePreset,
    advancedFilterCount,
    anchorEvent,
    eventNameById,
    filters,
    hasAnyTasks,
    mutationError,
    mutationPending,
    onFiltersOpen,
    onPreset,
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
    <View className="gap-xl pb-lg">
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
      <ScrollView
        contentContainerClassName="gap-xs pr-md"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <FilterChip label="All" onPress={() => onPreset("all")} selected={activePreset === "all"} />
        <FilterChip
          icon={CalendarDays}
          label="This week"
          onPress={() => onPreset("week")}
          selected={activePreset === "week"}
        />
        {anchorEvent ? (
          <FilterChip
            label={anchorEvent.name}
            onPress={() => onPreset("anchor")}
            selected={activePreset === "anchor"}
          />
        ) : null}
        <FilterChip
          icon={Flag}
          label="High priority"
          onPress={() => onPreset("urgent")}
          selected={activePreset === "urgent"}
        />
        <FilterChip
          count={activePreset === null ? advancedFilterCount : undefined}
          icon={SlidersHorizontal}
          label="Filters"
          onPress={onFiltersOpen}
          selected={activePreset === null && advancedFilterCount > 0}
        />
      </ScrollView>
      <AppText variant="caption">
        {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        {filters.dueWindow === "This Week" ? " due this week" : ""}
      </AppText>
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
          description={
            hasAnyTasks
              ? "Clear or change the filters to see more tasks."
              : "Add the first task when you are ready to start planning."
          }
          imageSource={
            hasAnyTasks ? undefined : require("../../../../assets/images/mangalya/empty-tasks.jpg")
          }
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
