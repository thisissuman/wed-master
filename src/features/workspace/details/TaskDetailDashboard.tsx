import { router } from "expo-router";
import { CalendarDays, Check, ClipboardList, Tag, UserRound } from "lucide-react-native";
import { ScrollView, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";

import { useWorkspace, useWorkspaceMutation } from "../provider";
import type { Task } from "../types";
import { DetailHeader, formatDate } from "../ui";

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-sm border-b border-borderSubtle py-sm last:border-b-0">
      <View className="h-10 w-10 items-center justify-center rounded-control bg-primarySoft">
        <Icon color={tokens.colors.primary} size={tokens.iconSize.sm} />
      </View>
      <View className="min-w-0 flex-1 gap-2xs">
        <AppText tone="muted" variant="caption">
          {label}
        </AppText>
        <AppText tone="primary">{value}</AppText>
      </View>
    </View>
  );
}

export function TaskDetailDashboard({ taskId }: { taskId: string }) {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md" edges={["top", "right", "bottom", "left"]}>
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open this task"
          />
        </Screen>
      );
    }
    return (
      <Screen edges={["top", "right", "bottom", "left"]}>
        <LoadingState label="Opening task" />
      </Screen>
    );
  }

  const task = workspace.data.tasks.find((item) => item.id === taskId);
  if (!task) {
    return (
      <Screen className="justify-center p-md" edges={["top", "right", "bottom", "left"]}>
        <ErrorState message="This task may have been deleted." title="Task not found" />
      </Screen>
    );
  }

  const event = workspace.data.events.find((item) => item.id === task.eventId);
  const completed = task.status === "Completed";
  const updateTask = (next: Task) => {
    if (mutation.isPending) return;
    mutation.mutate((repositories) => repositories.tasks.updateTask(next));
  };

  return (
    <Screen edges={["top", "right", "bottom", "left"]}>
      <ScrollView
        contentContainerClassName="gap-lg p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <DetailHeader fallback="/plan" title="Task detail" />

        <View className="gap-sm rounded-card bg-primarySoft p-md">
          <View className="flex-row items-start gap-sm">
            <View className="h-12 w-12 items-center justify-center rounded-control bg-elevatedSurface">
              <ClipboardList color={tokens.colors.primary} size={tokens.iconSize.md} />
            </View>
            <View className="min-w-0 flex-1 gap-xs">
              <AppText tone="primary" variant="title">
                {task.title}
              </AppText>
              <View className="flex-row flex-wrap gap-xs">
                <StatusBadge
                  label={`${task.priority} priority`}
                  tone={
                    task.priority === "Critical"
                      ? "danger"
                      : task.priority === "High"
                        ? "warning"
                        : "neutral"
                  }
                />
                <StatusBadge label={task.status} tone={completed ? "success" : "neutral"} />
              </View>
            </View>
          </View>
          {task.description ? <AppText>{task.description}</AppText> : null}
        </View>

        <Card className="px-md py-2xs shadow-none">
          <MetaRow icon={CalendarDays} label="Linked event" value={event?.name ?? "General task"} />
          {task.dueDate ? (
            <MetaRow icon={CalendarDays} label="Due date" value={formatDate(task.dueDate)} />
          ) : null}
          {task.responsiblePerson ? (
            <MetaRow icon={UserRound} label="Assigned to" value={task.responsiblePerson} />
          ) : null}
          {task.category ? <MetaRow icon={Tag} label="Category" value={task.category} /> : null}
        </Card>

        {task.notes ? (
          <View className="gap-xs rounded-card bg-surfaceMuted p-md">
            <SectionHeader title="Notes" />
            <AppText>{task.notes}</AppText>
          </View>
        ) : null}

        <View className="flex-row gap-sm">
          <Button
            className="flex-1"
            icon={Check}
            label={completed ? "Reopen task" : "Mark complete"}
            loading={mutation.isPending}
            onPress={() => updateTask({ ...task, status: completed ? "Not Started" : "Completed" })}
          />
          <Button
            className="flex-1"
            label="Edit"
            onPress={() => router.navigate({ pathname: "/tasks/edit", params: { id: task.id } })}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
