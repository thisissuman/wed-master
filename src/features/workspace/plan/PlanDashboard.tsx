import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { Check, Plus, Sparkles } from "lucide-react-native";
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated from "react-native-reanimated";

import {
  Button,
  AppText,
  ErrorState,
  FilterSheet,
  LoadingState,
  MotionPressable,
  Screen,
} from "@/components/ui";
import { tokens } from "@/theme";
import { todayDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { stateEnteringTransition } from "@/theme/motion";

import { useCreatedItemHighlight } from "../created-item-highlight";
import {
  emptyTaskFilters,
  filterTasks,
  taskFilterCount,
  taskProgressByEvent,
  taskSummary,
  type TaskFilterState,
} from "../selectors";
import {
  taskPriorities,
  taskStatuses,
  type StarterEventKey,
  type Task,
  type WeddingEvent,
} from "../types";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { createSuggestedEvents, missingSuggestedEvents } from "../seed";
import { SuggestedEventsSheet } from "../SuggestedEventsSheet";
import { PlanEventView } from "./PlanEventView";
import { PlanTaskView, type PlanTaskViewHandle } from "./PlanTaskView";
import type { PlanView } from "./PlanShared";

export type { EventTimelineCardProps } from "./PlanEventView";
export type { TaskSummary } from "./PlanTaskView";

const priorityOrder: Record<Task["priority"], number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
const undatedTaskSortValue = "9999-12-31";

function taskStatusFilter(value: string): TaskFilterState["status"] {
  if (
    value === "Not Started" ||
    value === "In Progress" ||
    value === "Completed" ||
    value === "Cancelled"
  ) {
    return value;
  }
  return "All";
}

function taskPriorityFilter(value: string): TaskFilterState["priority"] {
  if (
    value === "Low" ||
    value === "Medium" ||
    value === "High" ||
    value === "Critical" ||
    value === "Urgent"
  ) {
    return value;
  }
  return "All";
}

const viewFromParam = (view: string | string[] | undefined): PlanView => {
  const value = Array.isArray(view) ? view[0] : view;
  return value === "tasks" ? "tasks" : "events";
};

function FilterChoiceGroup({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <View className="gap-xs">
      <AppText variant="label">{label}</AppText>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-xs">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <MotionPressable
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              android_ripple={{ color: tokens.colors.primarySoft }}
              className={`min-h-12 flex-row items-center gap-2xs rounded-control border px-md ${
                selected
                  ? "border-primary bg-primary"
                  : "border-borderStrong bg-elevatedSurface active:bg-surfaceMuted"
              }`}
              key={option.value}
              onPress={() => onChange(option.value)}
              pressedScale={0.97}
            >
              {selected ? (
                <Check color={tokens.colors.onPrimary} size={tokens.iconSize.sm} />
              ) : null}
              <AppText tone={selected ? "onPrimary" : undefined} variant="label">
                {option.label}
              </AppText>
            </MotionPressable>
          );
        })}
      </View>
    </View>
  );
}

export function PlanDashboard() {
  const params = useLocalSearchParams<{ view?: string | string[] }>();
  const isScreenFocused = useIsFocused();
  const routeViewParam = Array.isArray(params.view) ? params.view[0] : params.view;
  const requestedView = viewFromParam(routeViewParam);
  const lastRouteViewParam = useRef(routeViewParam);
  const [activeView, setActiveView] = useState<PlanView>(() => requestedView);
  const [today] = useState(() => todayDateOnly());
  const [filters, setFilters] = useState<TaskFilterState>(() => emptyTaskFilters());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestedSelection, setSuggestedSelection] = useState<StarterEventKey[]>([]);
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const createdHighlight = useCreatedItemHighlight((state) => state.current);
  const clearCreatedHighlight = useCreatedItemHighlight((state) => state.clear);
  const markCreatedItem = useCreatedItemHighlight((state) => state.mark);
  const taskListRef = useRef<PlanTaskViewHandle>(null);

  useEffect(() => {
    if (lastRouteViewParam.current === routeViewParam) return;
    lastRouteViewParam.current = routeViewParam;
    setActiveView(requestedView);
  }, [requestedView, routeViewParam]);

  const data = workspace.data;
  const events = useMemo(
    () =>
      [...(data?.events ?? [])].sort(
        (left, right) => left.date.localeCompare(right.date) || left.sortOrder - right.sortOrder,
      ),
    [data?.events],
  );
  const tasks = useMemo(
    () =>
      filterTasks(data?.tasks ?? [], filters, today).sort((left, right) => {
        const completionDifference =
          Number(left.status === "Completed") - Number(right.status === "Completed");
        if (completionDifference) return completionDifference;
        const dueDateDifference = (left.dueDate ?? undatedTaskSortValue).localeCompare(
          right.dueDate ?? undatedTaskSortValue,
        );
        if (dueDateDifference) return dueDateDifference;
        return priorityOrder[left.priority] - priorityOrder[right.priority];
      }),
    [data?.tasks, filters, today],
  );
  const progressByEvent = useMemo(() => taskProgressByEvent(data?.tasks ?? []), [data?.tasks]);
  const eventNameById = useMemo(
    () => new Map((data?.events ?? []).map((event) => [event.id, event.name])),
    [data?.events],
  );
  const eventNameForId = useCallback(
    (id?: string) => (id ? eventNameById.get(id) : undefined),
    [eventNameById],
  );
  const summary = useMemo(() => taskSummary(data?.tasks ?? [], today), [data?.tasks, today]);
  const availableSuggestions = useMemo(
    () => missingSuggestedEvents(data?.events ?? []),
    [data?.events],
  );

  const changeView = useCallback(
    (view: PlanView) => {
      if (view === activeView) return;
      setActiveView(view);
    },
    [activeView],
  );
  const setCustomFilter = useCallback((next: Partial<TaskFilterState>) => {
    setFilters((current) => ({ ...current, ...next }));
  }, []);
  const clearFilters = useCallback(() => setFilters(emptyTaskFilters()), []);
  const toggleTask = useCallback(
    (task: Task) => {
      if (mutation.isPending) return;
      const nextStatus = task.status === "Completed" ? "Not Started" : "Completed";
      mutation.mutate(
        async (repositories) => {
          const snapshot = await repositories.tasks.updateTask({
            ...task,
            status: nextStatus,
          });
          taskListRef.current?.prepareForLayoutAnimation();
          return snapshot;
        },
        {
          onSuccess: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      );
    },
    [mutation],
  );
  const progressForEvent = useCallback(
    (eventId: string) => progressByEvent.get(eventId) ?? { completed: 0, total: 0 },
    [progressByEvent],
  );
  const taskPress = useCallback((task: Task) => router.navigate(`/tasks/${task.id}`), []);
  const eventPress = useCallback(
    (event: WeddingEvent) => router.navigate(`/events/${event.id}`),
    [],
  );
  const editEvent = useCallback(
    (event: WeddingEvent) =>
      router.navigate({ pathname: "/events/edit", params: { id: event.id } }),
    [],
  );
  const openFilters = useCallback(() => setFiltersOpen(true), []);
  const openSuggestions = useCallback(() => {
    setSuggestedSelection([]);
    setSuggestionsOpen(true);
  }, []);
  const addSuggestedEvents = useCallback(async () => {
    if (!data || !suggestedSelection.length) return;
    const created = createSuggestedEvents(data.wedding.date, suggestedSelection, data.events);
    if (!created.length) {
      setSuggestionsOpen(false);
      return;
    }
    await mutation.mutateAsync((repositories) =>
      repositories.workspace.replaceSnapshot({
        ...data,
        events: [...data.events, ...created],
      }),
    );
    setSuggestionsOpen(false);
    setSuggestedSelection([]);
    markCreatedItem(
      "event",
      created.map((event) => event.id),
    );
  }, [data, markCreatedItem, mutation, suggestedSelection]);

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open your plan"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening your wedding plan" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Animated.View className="flex-1" entering={stateEnteringTransition} key={activeView}>
        {activeView === "tasks" ? (
          <PlanTaskView
            advancedFilterCount={taskFilterCount(filters)}
            eventNameById={eventNameForId}
            filters={filters}
            hasAnyTasks={workspace.data.tasks.length > 0}
            mutationError={mutation.isError ? toUserMessage(mutation.error) : undefined}
            mutationPending={mutation.isPending}
            onClearFilters={clearFilters}
            onFiltersOpen={openFilters}
            onTaskPress={taskPress}
            onTaskToggle={toggleTask}
            onViewChange={changeView}
            ref={taskListRef}
            summary={summary}
            tasks={tasks}
            today={today}
            createdHighlight={
              isScreenFocused && createdHighlight?.kind === "task" ? createdHighlight : undefined
            }
            onCreatedHighlightFinished={clearCreatedHighlight}
          />
        ) : (
          <PlanEventView
            events={events}
            onEdit={editEvent}
            onEventPress={eventPress}
            onViewChange={changeView}
            progressForEvent={progressForEvent}
            weddingDate={workspace.data.wedding.date}
            createdHighlight={
              isScreenFocused && createdHighlight?.kind === "event" ? createdHighlight : undefined
            }
            onCreatedHighlightFinished={clearCreatedHighlight}
          />
        )}
      </Animated.View>

      <View className="border-t border-borderSubtle bg-elevatedSurface p-md shadow-floating">
        <View className="flex-row gap-sm">
          {activeView === "events" && availableSuggestions.length ? (
            <Button
              className="flex-1"
              icon={Sparkles}
              label="Suggestions"
              onPress={openSuggestions}
              variant="secondary"
            />
          ) : null}
          <Button
            className="flex-1"
            icon={Plus}
            label={activeView === "events" ? "Add event" : "Add task"}
            onPress={() => router.navigate(activeView === "events" ? "/events/new" : "/tasks/new")}
            variant="primary"
          />
        </View>
      </View>

      <SuggestedEventsSheet
        availableEvents={availableSuggestions}
        onChange={setSuggestedSelection}
        onClose={() => setSuggestionsOpen(false)}
        onConfirm={() => void addSuggestedEvents()}
        pending={mutation.isPending}
        selectedKeys={suggestedSelection}
        visible={suggestionsOpen}
      />

      <FilterSheet
        onClear={clearFilters}
        onClose={() => setFiltersOpen(false)}
        title="Filter tasks"
        visible={filtersOpen}
      >
        <FilterChoiceGroup
          label="Status"
          onChange={(status) => setCustomFilter({ status: taskStatusFilter(status) })}
          options={[
            { label: "All statuses", value: "All" },
            ...taskStatuses.map((value) => ({ label: value, value })),
          ]}
          value={filters.status}
        />
        <FilterChoiceGroup
          label="Priority"
          onChange={(priority) => setCustomFilter({ priority: taskPriorityFilter(priority) })}
          options={[
            { label: "All priorities", value: "All" },
            { label: "High or critical", value: "Urgent" },
            ...taskPriorities.map((value) => ({ label: value, value })),
          ]}
          value={filters.priority}
        />
        <FilterChoiceGroup
          label="Related event"
          onChange={(eventId) => setCustomFilter({ eventId })}
          options={[
            { label: "All events", value: "All" },
            { label: "General tasks", value: "" },
            ...events.map((event) => ({ label: event.name, value: event.id })),
          ]}
          value={filters.eventId}
        />
        <FilterChoiceGroup
          label="Due date"
          onChange={(value) => {
            if (value === "Overdue") {
              setCustomFilter({ dueWindow: "All", overdueOnly: true });
            } else if (value === "This Week") {
              setCustomFilter({ dueWindow: "This Week", overdueOnly: false });
            } else {
              setCustomFilter({ dueWindow: "All", overdueOnly: false });
            }
          }}
          options={[
            { label: "Any due date", value: "All" },
            { label: "Due this week", value: "This Week" },
            { label: "Overdue only", value: "Overdue" },
          ]}
          value={filters.overdueOnly ? "Overdue" : filters.dueWindow}
        />
      </FilterSheet>
    </Screen>
  );
}
