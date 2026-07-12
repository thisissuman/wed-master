import { View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { router } from "expo-router";

import { AppText, Card, IconButton, StatusBadge } from "@/components/ui";
import { formatInr } from "@/lib/money";
import type { Task, WeddingEvent } from "./types";

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );
export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <View className="mb-lg flex-row items-end justify-between gap-sm">
      <View className="flex-1 gap-2xs">
        {eyebrow ? (
          <AppText className="text-brand" variant="label">
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title">{title}</AppText>
      </View>
      {action ? (
        <IconButton
          accessibilityLabel={action.label}
          icon={ArrowRight}
          onPress={() => router.push(action.href as never)}
        />
      ) : null}
    </View>
  );
}
export function EventCard({
  event,
  taskCount,
  onPress,
}: {
  event: WeddingEvent;
  taskCount: number;
  onPress: () => void;
}) {
  return (
    <Card className="gap-sm" onTouchEnd={onPress}>
      <View className="flex-row items-start justify-between gap-sm">
        <View className="flex-1 gap-2xs">
          <AppText variant="heading">{event.name}</AppText>
          <AppText variant="caption">
            {formatDate(event.date)}
            {event.time ? ` · ${event.time}` : ""}
          </AppText>
          <AppText variant="caption">{event.location || "Location to be decided"}</AppText>
        </View>
        <StatusBadge
          label={`${taskCount} task${taskCount === 1 ? "" : "s"}`}
          tone={taskCount ? "info" : "success"}
        />
      </View>
    </Card>
  );
}
export function TaskCard({
  task,
  eventName,
  onPress,
}: {
  task: Task;
  eventName?: string;
  onPress: () => void;
}) {
  const tone =
    task.status === "Completed"
      ? "success"
      : task.priority === "Critical"
        ? "danger"
        : task.priority === "High"
          ? "warning"
          : ("info" as const);
  return (
    <Card className="gap-sm" onTouchEnd={onPress}>
      <View className="flex-row justify-between gap-sm">
        <View className="flex-1 gap-2xs">
          <AppText variant="heading">{task.title}</AppText>
          <AppText variant="caption">
            {eventName ?? "General"}
            {task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ""}
          </AppText>
        </View>
        <StatusBadge label={task.status === "Completed" ? "Done" : task.priority} tone={tone} />
      </View>
    </Card>
  );
}
export function MoneyLine({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-sm">
      <AppText
        className={emphasis ? "text-textPrimary" : "text-textSecondary"}
        variant={emphasis ? "label" : "body"}
      >
        {label}
      </AppText>
      <AppText variant={emphasis ? "heading" : "body"}>{formatInr(value)}</AppText>
    </View>
  );
}
