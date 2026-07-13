import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircle2, ChevronLeft, Circle, MapPin } from "lucide-react-native";
import { router } from "expo-router";

import {
  AppText,
  Button,
  Card,
  IconButton,
  ListRow,
  ProgressBar,
  StatusBadge,
} from "@/components/ui";
import { formatDateOnly, formatShortDateOnly } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import { tokens } from "@/theme";

import { isOverdue } from "./selectors";
import type { Expense, Task, WeddingEvent } from "./types";

export const formatDate = formatDateOnly;

export function PageHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View className="gap-2xs">
      {eyebrow ? (
        <AppText className="text-brand" variant="label">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="title">{title}</AppText>
    </View>
  );
}

export function DetailHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View className="flex-row items-start gap-xs">
      <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={() => router.back()} />
      <View className="flex-1 gap-2xs pt-xs">
        {eyebrow ? <AppText variant="caption">{eyebrow}</AppText> : null}
        <AppText variant="title">{title}</AppText>
      </View>
    </View>
  );
}

export function EventTimelineRow({
  event,
  onPress,
  taskProgress,
}: {
  event: WeddingEvent;
  onPress: () => void;
  taskProgress: { completed: number; total: number };
}) {
  const progressLabel =
    taskProgress.total === 0
      ? "No tasks linked"
      : `${taskProgress.completed} of ${taskProgress.total} tasks done`;

  return (
    <View className="flex-row gap-sm">
      <View className="items-center pt-xl">
        <View className="h-2xs w-2xs rounded-full bg-brand" />
      </View>
      <Pressable
        accessibilityLabel={`Open event: ${event.name}`}
        accessibilityRole="button"
        android_ripple={{ color: tokens.colors.surfaceSubtle }}
        className="flex-1 border-b border-border py-md active:bg-surfaceSubtle"
        onPress={onPress}
      >
        <View className="gap-2xs">
          <AppText variant="heading">{event.name}</AppText>
          <AppText variant="caption">
            {formatDateOnly(event.date)}
            {event.location ? ` · ${event.location}` : ""}
          </AppText>
          <AppText className="text-textSecondary" variant="caption">
            {progressLabel}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}

const taskBadge = (task: Task, overdue: boolean) => {
  if (task.status === "Completed") return { label: "Done", tone: "success" as const };
  if (overdue) return { label: "Overdue", tone: "danger" as const };
  if (task.priority === "High" || task.priority === "Critical") {
    return { label: `${task.priority} priority`, tone: "neutral" as const };
  }
  return {
    label: task.status === "In Progress" ? "In progress" : "Not started",
    tone: "neutral" as const,
  };
};

export function TaskListItem({
  eventName,
  onPress,
  onToggle,
  task,
  today,
}: {
  eventName?: string;
  onPress: () => void;
  onToggle: () => void;
  task: Task;
  today?: string;
}) {
  const completed = task.status === "Completed";
  const overdue = !completed && isOverdue(task.dueDate, today);
  const badge = taskBadge(task, overdue);
  const dueLabel = task.dueDate ? `Due ${formatShortDateOnly(task.dueDate)}` : undefined;
  const description = [eventName, dueLabel].filter(Boolean).join(" · ");

  return (
    <View className="flex-row items-center gap-xs border-b border-border">
      <TouchableOpacity
        accessibilityLabel={`${completed ? "Reopen" : "Mark complete"}: ${task.title}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        activeOpacity={0.72}
        onPress={onToggle}
        style={styles.taskToggle}
      >
        {completed ? (
          <CheckCircle2 color={tokens.colors.success} size={tokens.iconSize.md} />
        ) : (
          <Circle color={tokens.colors.textSecondary} size={tokens.iconSize.md} />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={`Open task: ${task.title}`}
        accessibilityRole="button"
        activeOpacity={0.78}
        onPress={onPress}
        style={styles.taskRowButton}
      >
        <View className="flex-row items-start gap-sm">
          <View className="flex-1 gap-2xs">
            <AppText className={completed ? "text-textSecondary" : ""} variant="label">
              {task.title}
            </AppText>
            {description ? <AppText variant="caption">{description}</AppText> : null}
          </View>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const paymentBadge = (expense: Expense) => {
  if (expense.paymentStatus === "Paid") return { label: "Paid", tone: "success" as const };
  if (expense.paymentStatus === "Partially Paid") {
    return { label: "Part paid", tone: "warning" as const };
  }
  return { label: "Payment due", tone: "warning" as const };
};

export function ExpenseListItem({
  categoryName,
  expense,
  onPress,
}: {
  categoryName: string;
  expense: Expense;
  onPress: () => void;
}) {
  const badge = paymentBadge(expense);
  const dueLabel = expense.dueDate ? `Due ${formatShortDateOnly(expense.dueDate)}` : undefined;
  const description = [categoryName, dueLabel].filter(Boolean).join(" · ");

  return (
    <ListRow
      accessibilityLabel={`Open expense: ${expense.title}`}
      description={description}
      onPress={onPress}
      title={expense.title}
      trailing={
        <View className="items-end gap-2xs">
          <AppText variant="label">{formatInr(expense.actualPaise)}</AppText>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </View>
      }
    />
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
      <AppText className={emphasis ? "text-textPrimary" : "text-textSecondary"} variant="body">
        {label}
      </AppText>
      <AppText variant={emphasis ? "heading" : "body"}>{formatInr(value)}</AppText>
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 gap-2xs">
      <AppText variant="caption">{label}</AppText>
      <AppText variant="heading">{formatInr(value)}</AppText>
    </View>
  );
}

export function HomeBudgetSnapshot({
  estimatedPaise,
  actualPaise,
  outstandingPaise,
}: {
  actualPaise: number;
  estimatedPaise: number;
  outstandingPaise: number;
}) {
  const isOverBudget = estimatedPaise > 0 && actualPaise > estimatedPaise;
  const remainingPaise = Math.max(0, estimatedPaise - actualPaise);
  const progress = estimatedPaise > 0 ? (actualPaise / estimatedPaise) * 100 : 0;

  return (
    <Card className="gap-lg">
      <View className="gap-2xs">
        <AppText variant="caption">Estimated budget</AppText>
        <AppText variant="display">{formatInr(estimatedPaise)}</AppText>
      </View>
      <View className="flex-row gap-lg">
        <SummaryMetric label="Spent" value={actualPaise} />
        <SummaryMetric
          label={isOverBudget ? "Over budget" : outstandingPaise > 0 ? "Outstanding" : "Remaining"}
          value={isOverBudget ? actualPaise - estimatedPaise : outstandingPaise || remainingPaise}
        />
      </View>
      <View className="gap-2xs">
        <ProgressBar
          accessibilityLabel="Budget used"
          tone={isOverBudget ? "danger" : "brand"}
          value={progress}
        />
        <AppText variant="caption">
          {estimatedPaise > 0
            ? `${Math.round(Math.min(100, progress))}% of the planned budget used`
            : "Add an estimate to track budget progress"}
        </AppText>
      </View>
    </Card>
  );
}

export function FinancialSummary({
  actualPaise,
  estimatedPaise,
  outstandingPaise,
  paidPaise,
}: {
  actualPaise: number;
  estimatedPaise: number;
  outstandingPaise: number;
  paidPaise: number;
}) {
  return (
    <Card className="gap-lg">
      <View className="flex-row gap-lg">
        <SummaryMetric label="Planned" value={estimatedPaise} />
        <SummaryMetric label="Spent" value={actualPaise} />
      </View>
      <View className="flex-row gap-lg border-t border-border pt-lg">
        <SummaryMetric label="Paid" value={paidPaise} />
        <SummaryMetric label="Outstanding" value={outstandingPaise} />
      </View>
    </Card>
  );
}

export function CategorySummaryRow({
  actualPaise,
  estimatedPaise,
  name,
}: {
  actualPaise: number;
  estimatedPaise: number;
  name: string;
}) {
  const overBudget = estimatedPaise > 0 && actualPaise > estimatedPaise;
  const description =
    estimatedPaise > 0
      ? `${formatInr(actualPaise)} spent of ${formatInr(estimatedPaise)} planned`
      : `${formatInr(actualPaise)} spent`;

  return (
    <ListRow
      description={description}
      title={name}
      trailing={overBudget ? <StatusBadge label="Over budget" tone="danger" /> : undefined}
    />
  );
}

type FormShellProps = {
  children: ReactNode;
  description: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  title: string;
};

export function FormShell({
  children,
  description,
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel,
  title,
}: FormShellProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <ScrollView contentContainerClassName="gap-xl p-md pb-xl" keyboardShouldPersistTaps="handled">
        <View className="gap-2xs">
          <AppText variant="title">{title}</AppText>
          <AppText variant="caption">{description}</AppText>
        </View>
        {children}
      </ScrollView>
      <View className="gap-xs border-t border-border bg-surface p-md">
        <Button
          disabled={isSubmitting}
          label={submitLabel}
          loading={isSubmitting}
          onPress={onSubmit}
        />
        <Button disabled={isSubmitting} label="Cancel" onPress={onCancel} variant="ghost" />
      </View>
    </KeyboardAvoidingView>
  );
}

export function LocationLine({ location }: { location?: string }) {
  if (!location) return null;

  return (
    <View className="flex-row items-center gap-2xs">
      <MapPin color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
      <AppText variant="body">{location}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  taskRowButton: {
    flex: 1,
    justifyContent: "center",
    minHeight: tokens.touchTarget,
    paddingVertical: Number.parseInt(tokens.spacing.md, 10),
  },
  taskToggle: {
    alignItems: "center",
    borderRadius: Number.parseInt(tokens.radius.control, 10),
    justifyContent: "center",
    minHeight: tokens.touchTarget,
    minWidth: tokens.touchTarget,
  },
});
