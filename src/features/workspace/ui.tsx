import { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { ChevronLeft, MapPin } from "lucide-react-native";
import type { Href } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, IconButton, ListRow } from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import { tokens } from "@/theme";
import { goBackOr } from "@/lib/navigation";

import type { Expense, WeddingEvent } from "./types";

export const formatDate = formatDateOnly;

export function PageHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View className="gap-2xs">
      {eyebrow ? (
        <AppText tone="primary" variant="label">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="title">{title}</AppText>
    </View>
  );
}

export function DetailHeader({
  eyebrow,
  fallback = "/",
  title,
}: {
  eyebrow?: string;
  fallback?: Href;
  title: string;
}) {
  return (
    <View className="flex-row items-start gap-xs">
      <IconButton
        accessibilityLabel="Go back"
        icon={ChevronLeft}
        onPress={() => goBackOr(fallback)}
      />
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
        <View className="h-2xs w-2xs rounded-full bg-primary" />
      </View>
      <Pressable
        accessibilityLabel={`Open event: ${event.name}`}
        accessibilityRole="button"
        android_ripple={{ color: tokens.colors.surfaceMuted }}
        className="flex-1 border-b border-borderSubtle py-md active:bg-surfaceMuted"
        onPress={onPress}
      >
        <View className="gap-2xs">
          <AppText variant="heading">{event.name}</AppText>
          <AppText variant="caption">
            {formatDateOnly(event.date)}
            {event.location ? ` · ${event.location}` : ""}
          </AppText>
          <AppText tone="muted" variant="caption">
            {progressLabel}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}

export function ExpenseListItem({
  categoryName,
  expense,
  onPress,
}: {
  categoryName: string;
  expense: Expense;
  onPress: () => void;
}) {
  return (
    <ListRow
      accessibilityLabel={`Open expense: ${expense.title}`}
      description={categoryName}
      onPress={onPress}
      title={expense.title}
      trailing={
        <AppText tone={expense.actualPaise > 0 ? undefined : "warning"} variant="label">
          {expense.actualPaise > 0 ? formatInr(expense.actualPaise) : "Amount not recorded"}
        </AppText>
      }
    />
  );
}

type FormShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submissionError?: string;
  title: string;
};

export function FormShell({
  children,
  footer,
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel,
  submissionError,
  title,
}: FormShellProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="gap-lg p-md pb-2xl"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-xs flex-row items-center gap-xs pr-xl">
          <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={onCancel} />
          <View className="min-w-0 flex-1">
            <AppText accessibilityRole="header" tone="primary" variant="formTitle">
              {title}
            </AppText>
          </View>
        </View>
        {submissionError ? (
          <View accessibilityRole="alert" className="rounded-control bg-dangerSoft p-md">
            <AppText tone="danger" variant="caption">
              {submissionError}
            </AppText>
          </View>
        ) : null}
        {children}
      </ScrollView>
      <SafeAreaView
        edges={["bottom"]}
        className="gap-xs border-t border-translucentBorder bg-translucentSurface px-md pb-xs pt-sm shadow-floating"
      >
        {footer ?? (
          <Button
            disabled={isSubmitting}
            label={submitLabel}
            loading={isSubmitting}
            onPress={onSubmit}
          />
        )}
      </SafeAreaView>
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
