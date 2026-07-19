import { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, MapPin, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { AppText, Button, Card, IconButton, ListRow, StatusBadge } from "@/components/ui";
import { formatDateOnly, formatShortDateOnly } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import { tokens } from "@/theme";

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
      <AppText tone={emphasis ? "primary" : "muted"} variant="body">
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
      <View className="flex-row gap-lg border-t border-borderSubtle pt-lg">
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
  submissionError?: string;
  title: string;
};

const formCanvasGradient = [
  tokens.gradients.formCanvas[0],
  tokens.gradients.formCanvas[1],
  tokens.gradients.formCanvas[2],
] as const;

function FormBackdrop() {
  return (
    <View
      accessibilityElementsHidden
      className="absolute inset-0"
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <LinearGradient
        colors={formCanvasGradient}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
      />
      <Svg
        accessible={false}
        height={180}
        style={{ opacity: 0.18, position: "absolute", right: -28, top: -12 }}
        viewBox="0 0 180 180"
        width={180}
      >
        <Path
          d="M174 8c-31 15-53 38-65 68-8 21-11 45-9 72M110 74c18-3 33 2 45 16M103 94c-20-2-36 5-48 20M125 52c3-17 12-31 28-40M97 119c18 3 32 13 41 30"
          fill="none"
          stroke={tokens.colors.primary}
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <Path
          d="M148 84c8-11 18-13 27-8-1 13-9 21-24 22M77 110c-12-8-23-7-31 2 5 13 16 18 31 12M122 46c-8-12-7-23 3-31 12 6 16 17 10 32M112 132c12 0 21 6 27 18-10 9-21 9-32 0"
          fill="none"
          stroke={tokens.colors.primary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Circle cx="105" cy="93" fill={tokens.colors.primarySoft} r="4" />
      </Svg>
    </View>
  );
}

export function FormShell({
  children,
  description,
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
      <FormBackdrop />
      <ScrollView
        contentContainerClassName="gap-lg p-md pb-2xl"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-xs flex-row items-start gap-xs pr-xl">
          <IconButton accessibilityLabel="Go back" icon={ChevronLeft} onPress={onCancel} />
          <View className="min-w-0 flex-1 gap-2xs pt-2xs">
            <AppText accessibilityRole="header" tone="primary" variant="formTitle">
              {title}
            </AppText>
            <AppText tone="muted">{description}</AppText>
            <View
              accessibilityElementsHidden
              className="mt-xs flex-row items-center gap-xs"
              importantForAccessibility="no-hide-descendants"
            >
              <View className="h-px w-12 bg-borderStrong" />
              <Sparkles color={tokens.colors.eventBotanical} size={tokens.iconSize.sm} />
              <View className="h-px w-8 bg-borderStrong" />
            </View>
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
        <Button
          disabled={isSubmitting}
          icon={Sparkles}
          label={submitLabel}
          loading={isSubmitting}
          onPress={onSubmit}
        />
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
