import { useRef, useState } from "react";
import { View } from "react-native";
import { Plus } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import {
  Button,
  ErrorState,
  FilterSheet,
  LoadingState,
  Screen,
  SelectField,
} from "@/components/ui";
import { todayDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";

import {
  emptyTaskFilters,
  filterTasks,
  taskFilterCount,
  taskProgress,
  taskSummary,
  weddingDateEvent,
  type TaskFilterState,
} from "../selectors";
import { taskPriorities, taskStatuses, type Task, type WeddingEvent } from "../types";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { PlanEventView } from "./PlanEventView";
import { PlanTaskView, type PlanTaskViewHandle } from "./PlanTaskView";
import type { PlanView } from "./PlanShared";

export type { EventTimelineCardProps } from "./PlanEventView";
export type { TaskSummary } from "./PlanTaskView";

type TaskPreset = "all" | "anchor" | "urgent" | "week" | null;

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

export function PlanDashboard() {
  const params = useLocalSearchParams<{ view?: string | string[] }>();
  const activeView = viewFromParam(params.view);
  const [today] = useState(() => todayDateOnly());
  const [filters, setFilters] = useState<TaskFilterState>(() => emptyTaskFilters());
  const [activePreset, setActivePreset] = useState<TaskPreset>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const taskListRef = useRef<PlanTaskViewHandle>(null);

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

  const data = workspace.data;
  const anchorEvent = weddingDateEvent(data.events, data.wedding.date);
  const events = [...data.events].sort(
    (left, right) => left.date.localeCompare(right.date) || left.sortOrder - right.sortOrder,
  );
  const tasks = filterTasks(data.tasks, filters, today).sort((left, right) => {
    const completionDifference =
      Number(left.status === "Completed") - Number(right.status === "Completed");
    if (completionDifference) return completionDifference;
    const dueDateDifference = (left.dueDate ?? undatedTaskSortValue).localeCompare(
      right.dueDate ?? undatedTaskSortValue,
    );
    if (dueDateDifference) return dueDateDifference;
    return priorityOrder[left.priority] - priorityOrder[right.priority];
  });

  const changeView = (view: PlanView) => router.setParams({ view });
  const setCustomFilter = (next: Partial<TaskFilterState>) => {
    setFilters((current) => ({ ...current, ...next }));
    setActivePreset(null);
  };
  const applyPreset = (preset: Exclude<TaskPreset, null>) => {
    if (preset === "all") setFilters(emptyTaskFilters());
    if (preset === "week") {
      setFilters({ ...emptyTaskFilters(), dueWindow: "This Week" });
    }
    if (preset === "anchor" && anchorEvent) {
      setFilters({ ...emptyTaskFilters(), eventId: anchorEvent.id });
    }
    if (preset === "urgent") {
      setFilters({ ...emptyTaskFilters(), priority: "Urgent" });
    }
    setActivePreset(preset);
  };
  const toggleTask = (task: Task) => {
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
  };
  const progressForEvent = (eventId: string) =>
    taskProgress(data.tasks.filter((task) => task.eventId === eventId));

  return (
    <Screen>
      {activeView === "tasks" ? (
        <PlanTaskView
          activePreset={activePreset}
          advancedFilterCount={taskFilterCount(filters)}
          anchorEvent={anchorEvent}
          eventNameById={(id) => data.events.find((event) => event.id === id)?.name}
          filters={filters}
          hasAnyTasks={data.tasks.length > 0}
          mutationError={mutation.isError ? toUserMessage(mutation.error) : undefined}
          mutationPending={mutation.isPending}
          onFiltersOpen={() => setFiltersOpen(true)}
          onPreset={applyPreset}
          onTaskPress={(task) => router.push(`/tasks/${task.id}`)}
          onTaskToggle={toggleTask}
          onViewChange={changeView}
          ref={taskListRef}
          summary={taskSummary(data.tasks, today)}
          tasks={tasks}
          today={today}
        />
      ) : (
        <PlanEventView
          events={events}
          onEdit={(event: WeddingEvent) =>
            router.push({ pathname: "/events/edit", params: { id: event.id } })
          }
          onEventPress={(event) => router.push(`/events/${event.id}`)}
          onViewChange={changeView}
          progressForEvent={progressForEvent}
          weddingDate={data.wedding.date}
        />
      )}

      <View className="border-t border-borderSubtle bg-canvas p-md">
        <Button
          icon={Plus}
          label={activeView === "events" ? "Add event" : "Add task"}
          onPress={() => router.push(activeView === "events" ? "/events/new" : "/tasks/new")}
          variant="primary"
        />
      </View>

      <FilterSheet
        onClear={() => {
          setFilters(emptyTaskFilters());
          setActivePreset("all");
        }}
        onClose={() => setFiltersOpen(false)}
        title="Filter tasks"
        visible={filtersOpen}
      >
        <SelectField
          label="Status"
          onChange={(status) => setCustomFilter({ status: taskStatusFilter(status) })}
          options={[
            { label: "All statuses", value: "All" },
            ...taskStatuses.map((value) => ({ label: value, value })),
          ]}
          value={filters.status}
        />
        <SelectField
          label="Priority"
          onChange={(priority) => setCustomFilter({ priority: taskPriorityFilter(priority) })}
          options={[
            { label: "All priorities", value: "All" },
            { label: "High or critical", value: "Urgent" },
            ...taskPriorities.map((value) => ({ label: value, value })),
          ]}
          value={filters.priority}
        />
        <SelectField
          label="Related event"
          onChange={(eventId) => setCustomFilter({ eventId })}
          options={[
            { label: "All events", value: "All" },
            { label: "General tasks", value: "" },
            ...events.map((event) => ({ label: event.name, value: event.id })),
          ]}
          value={filters.eventId}
        />
        <SelectField
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
