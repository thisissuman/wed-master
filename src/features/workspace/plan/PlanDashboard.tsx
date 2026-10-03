import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Plus from "lucide-react-native/icons/plus";
import { router, useIsFocused, useLocalSearchParams } from "expo-router";

import { Button, ErrorState, LoadingState, Screen } from "@/components/ui";
import { useTodayDateOnly } from "@/lib/dates/useTodayDateOnly";
import { toUserMessage } from "@/lib/errors";

import { useCreatedItemHighlight } from "../created-item-highlight";
import {
  emptyTaskFilters,
  filterTasks,
  taskFilterCount,
  taskProgressByEvent,
  taskSummary,
  type TaskFilterState,
} from "../selectors";
import { type ISODate, type Task, type WeddingEvent } from "../types";
import { useWorkspace } from "../provider";
import { useTaskStatusAction } from "../useTaskStatusAction";
import { PlanEventView } from "./PlanEventView";
import { PlanTaskView } from "./PlanTaskView";
import { PlanHeader, type PlanView } from "./PlanShared";

export type { EventTimelineCardProps } from "./PlanEventView";
export type { TaskSummary } from "./PlanTaskView";

const priorityOrder: Record<Task["priority"], number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
const undatedTaskSortValue = "9999-12-31";

const viewFromParam = (view: string | string[] | undefined): PlanView => {
  const value = Array.isArray(view) ? view[0] : view;
  return value === "tasks" ? "tasks" : "events";
};

export function PlanDashboard() {
  const params = useLocalSearchParams<{ view?: string | string[] }>();
  const isScreenFocused = useIsFocused();
  const routeViewParam = Array.isArray(params.view) ? params.view[0] : params.view;
  const requestedView = viewFromParam(routeViewParam);
  const lastRouteViewParam = useRef(routeViewParam);
  const [activeView, setActiveView] = useState<PlanView>(() => requestedView);
  const today = useTodayDateOnly() as ISODate;
  const [filters, setFilters] = useState<TaskFilterState>(() => emptyTaskFilters());
  const [sortOrder, setSortOrder] = useState<"planned" | "recent">("planned");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const workspace = useWorkspace();
  const createdHighlight = useCreatedItemHighlight((state) => state.current);
  const clearCreatedHighlight = useCreatedItemHighlight((state) => state.clear);
  const taskStatusAction = useTaskStatusAction();

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
      filterTasks(data?.tasks ?? [], filters).sort((left, right) => {
        if (sortOrder === "recent") {
          const recentDifference = (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
          if (recentDifference) return recentDifference;
        }
        const completionDifference =
          Number(left.status === "Completed") - Number(right.status === "Completed");
        if (completionDifference) return completionDifference;
        const dueDateDifference = (left.dueDate ?? undatedTaskSortValue).localeCompare(
          right.dueDate ?? undatedTaskSortValue,
        );
        if (dueDateDifference) return dueDateDifference;
        return priorityOrder[left.priority] - priorityOrder[right.priority];
      }),
    [data?.tasks, filters, sortOrder],
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
    (task: Task) => taskStatusAction.toggleTaskStatus(task),
    [taskStatusAction],
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
      <View className="px-md pt-md">
        <PlanHeader activeView={activeView} onViewChange={changeView} />
      </View>
      <View className="flex-1">
        <View
          style={[StyleSheet.absoluteFill, { opacity: activeView === "tasks" ? 1 : 0 }]}
          pointerEvents={activeView === "tasks" ? "auto" : "none"}
          accessibilityElementsHidden={activeView !== "tasks"}
          importantForAccessibility={activeView === "tasks" ? "auto" : "no-hide-descendants"}
        >
          <PlanTaskView
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            advancedFilterCount={taskFilterCount(filters)}
            eventNameById={eventNameForId}
            filters={filters}
            filtersOpen={activeView === "tasks" && filtersOpen}
            hasAnyTasks={workspace.data.tasks.length > 0}
            mutationError={
              taskStatusAction.isError ? toUserMessage(taskStatusAction.error) : undefined
            }
            mutationPending={taskStatusAction.isPending}
            onClearFilters={clearFilters}
            onFiltersChange={setCustomFilter}
            onFiltersClose={() => setFiltersOpen(false)}
            onFiltersOpen={openFilters}
            onTaskPress={taskPress}
            onTaskToggle={toggleTask}
            summary={summary}
            tasks={tasks}
            today={today}
            createdHighlight={
              isScreenFocused && activeView === "tasks" && createdHighlight?.kind === "task"
                ? createdHighlight
                : undefined
            }
            onCreatedHighlightFinished={clearCreatedHighlight}
          />
        </View>
        <View
          style={[StyleSheet.absoluteFill, { opacity: activeView === "events" ? 1 : 0 }]}
          pointerEvents={activeView === "events" ? "auto" : "none"}
          accessibilityElementsHidden={activeView !== "events"}
          importantForAccessibility={activeView === "events" ? "auto" : "no-hide-descendants"}
        >
          <PlanEventView
            events={events}
            onEdit={editEvent}
            onEventPress={eventPress}
            progressForEvent={progressForEvent}
            weddingDate={workspace.data.wedding.date}
            createdHighlight={
              isScreenFocused && activeView === "events" && createdHighlight?.kind === "event"
                ? createdHighlight
                : undefined
            }
            onCreatedHighlightFinished={clearCreatedHighlight}
          />
        </View>
      </View>

      <View className="border-t border-borderSubtle bg-elevatedSurface p-md shadow-floating">
        <Button
          icon={Plus}
          label={activeView === "events" ? "Add event" : "Add task"}
          onPress={() => router.navigate(activeView === "events" ? "/events/new" : "/tasks/new")}
          variant="primary"
        />
      </View>
    </Screen>
  );
}
