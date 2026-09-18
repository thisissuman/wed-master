import { expenseAmountLabel } from "../expense-amount";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { router, useIsFocused } from "expo-router";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import ChartNoAxesCombined from "lucide-react-native/icons/chart-no-axes-combined";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Pencil from "lucide-react-native/icons/pencil";
import ReceiptIndianRupee from "lucide-react-native/icons/receipt-indian-rupee";
import Target from "lucide-react-native/icons/target";
import type { LucideIcon } from "lucide-react-native";
import { memo, useMemo, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppBottomSheet,
  AppText,
  Button,
  Card,
  CreatedItemPulse,
  EmptyState,
  ErrorState,
  FloatingActionButton,
  IconButton,
  LoadingState,
  MotionPressable,
  PageHeader,
  Screen,
  SegmentedControl,
  TextField,
} from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { useTodayDateOnly } from "@/lib/dates/useTodayDateOnly";
import { toUserMessage } from "@/lib/errors";
import { useSingleFlightSubmission } from "@/lib/forms/useSingleFlightSubmission";
import { formatInr, formatInrCompact } from "@/lib/money";
import { isLargeText } from "@/lib/responsive";
import { tokens, useAppTheme } from "@/theme";

import { fromPaise, toPaise } from "../forms";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import {
  categorySpending,
  homeBudgetSummary,
  selectDailySpending,
  selectExpenseDateGroups,
  selectRecentExpenses,
  selectSpendingTrend,
  type CategorySpending,
  type SpendingTrendPoint,
  type SpendingTrendRange,
} from "../selectors";
import type { BudgetCategory, Expense } from "../types";
import { DetailHeader } from "../ui";
import { useCreatedItemHighlight } from "../created-item-highlight";
import { ExpenseCategoryIcon, useExpenseCategoryPresentation } from "./ExpenseCategoryIcon";
import { SpendingTrendChart } from "./SpendingTrendChart";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const itemGap = Number.parseInt(tokens.spacing.sm, 10);
const fabInset = Number.parseInt(tokens.spacing.md, 10);
const listBottomPadding = tokens.touchTarget + Number.parseInt(tokens.spacing["4xl"], 10);

const trendRangeOptions: { label: string; value: SpendingTrendRange }[] = [
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "All time", value: "all" },
];

const trendRangeLabels: Record<SpendingTrendRange, string> = {
  "30d": "the last 30 days",
  "90d": "the last 90 days",
  all: "all time",
};

function MoneyMetric({
  accessibilityValue,
  divider,
  label,
  stacked,
  tone = "default",
  value,
}: {
  accessibilityValue: string;
  divider: boolean;
  label: string;
  stacked: boolean;
  tone?: "danger" | "default" | "primary";
  value: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${accessibilityValue}`}
      className={`min-w-0 ${
        stacked
          ? `min-h-4xl flex-row items-center justify-between gap-sm py-xs ${
              divider ? "border-b border-nightBorder" : ""
            }`
          : `flex-1 gap-2xs px-xs ${divider ? "border-r border-nightBorder" : ""}`
      }`}
    >
      <AppText tone="onNightMuted" variant="caption">
        {label}
      </AppText>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={{ fontVariant: ["tabular-nums"] }}
        tone={tone === "danger" ? "nightAccent" : tone === "primary" ? "nightAccent" : "onNight"}
        variant="heading"
      >
        {value}
      </AppText>
    </View>
  );
}

function BudgetPosition({
  actionIcon: ActionIcon,
  actionLabel,
  onAction,
  summary,
}: {
  actionIcon?: LucideIcon;
  actionLabel?: string;
  onAction: () => void;
  summary: ReturnType<typeof homeBudgetSummary>;
}) {
  const theme = useAppTheme();
  const hasTarget = summary.targetPaise !== undefined;
  const overBudget = summary.overBudgetPaise > 0;
  const remainingLabel = overBudget ? "Over by" : "Remaining";
  const remainingValue = overBudget
    ? formatInrCompact(summary.overBudgetPaise)
    : summary.remainingPaise === undefined
      ? "—"
      : formatInrCompact(summary.remainingPaise);
  const { fontScale } = useWindowDimensions();
  const stacked = isLargeText(fontScale);
  const ResolvedActionIcon = ActionIcon ?? (hasTarget ? Pencil : Target);
  const resolvedActionLabel = actionLabel ?? (hasTarget ? "Edit target" : "Set target");
  const leadValue = overBudget
    ? `${formatInr(summary.overBudgetPaise)} over target`
    : hasTarget
      ? `${formatInr(summary.remainingPaise ?? 0)} remaining`
      : "Set a shared spending target";

  return (
    <View className="overflow-hidden rounded-hero bg-nightSurface" testID="budget-summary">
      <LinearGradient
        colors={[
          theme.gradients.weddingNight[0],
          theme.gradients.weddingNight[1],
          theme.gradients.weddingNight[2],
        ]}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={{ bottom: 0, left: 0, opacity: 0.94, position: "absolute", right: 0, top: 0 }}
      />
      <View className="flex-row items-start gap-sm px-md pb-sm pt-md">
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText tone="onNightMuted" variant="caption">
            Budget position
          </AppText>
          <AppText
            numberOfLines={2}
            style={{ fontVariant: ["tabular-nums"] }}
            tone="onNight"
            variant="heading"
          >
            {leadValue}
          </AppText>
        </View>
        <IconButton
          accessibilityLabel={resolvedActionLabel}
          icon={ResolvedActionIcon}
          onPress={onAction}
          variant="night"
        />
      </View>
      <View
        className="gap-xs border-t border-nightBorder bg-nightSoft p-sm"
        style={{
          flexDirection: stacked ? "column" : "row",
        }}
        testID="budget-summary-layout"
      >
        <MoneyMetric
          accessibilityValue={hasTarget ? formatInr(summary.targetPaise ?? 0) : "Not set"}
          divider
          label="Target"
          stacked={stacked}
          value={hasTarget ? formatInrCompact(summary.targetPaise ?? 0) : "Not set"}
        />
        <MoneyMetric
          accessibilityValue={formatInr(summary.spentPaise)}
          divider
          label="Net spent"
          stacked={stacked}
          tone="primary"
          value={formatInrCompact(summary.spentPaise)}
        />
        <MoneyMetric
          accessibilityValue={
            overBudget
              ? formatInr(summary.overBudgetPaise)
              : summary.remainingPaise === undefined
                ? "Not available"
                : formatInr(summary.remainingPaise)
          }
          divider={false}
          label={remainingLabel}
          stacked={stacked}
          tone={overBudget ? "danger" : "primary"}
          value={remainingValue}
        />
      </View>
    </View>
  );
}

function InsightRow({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. ${detail}`}
      className="min-h-20 flex-row items-center gap-sm border-b border-borderSubtle py-sm last:border-b-0"
    >
      <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
        <Icon color={theme.colors.primary} size={tokens.iconSize.md} />
      </View>
      <View className="min-w-0 flex-1 gap-2xs">
        <AppText tone="muted" variant="caption">
          {label}
        </AppText>
        <AppText numberOfLines={2} style={{ fontVariant: ["tabular-nums"] }} variant="heading">
          {value}
        </AppText>
        <AppText tone="muted" variant="caption">
          {detail}
        </AppText>
      </View>
    </View>
  );
}

function AllTimeInsights({
  breakdown,
  latestExpense,
  peak,
}: {
  breakdown: CategorySpending[];
  latestExpense?: Expense;
  peak?: SpendingTrendPoint;
}) {
  const expenseCategoryPresentation = useExpenseCategoryPresentation();
  const topCategory = breakdown[0];
  const topPresentation = topCategory
    ? expenseCategoryPresentation[topCategory.iconKey]
    : undefined;

  return (
    <View className="gap-md">
      <View className="gap-2xs">
        <AppText accessibilityRole="header" variant="heading">
          All-time insights
        </AppText>
        <AppText tone="muted" variant="caption">
          The strongest signals from every recorded expense
        </AppText>
      </View>
      <Card className="px-lg py-xs">
        <InsightRow
          detail={
            topCategory
              ? `${Math.round(topCategory.percentage)}% of total spending`
              : "Add an expense to see category insights"
          }
          icon={ChartNoAxesCombined}
          label="Where spending is highest"
          value={
            topCategory && topPresentation
              ? `${topPresentation.label} · ${formatInr(topCategory.actualPaise)}`
              : "No spending yet"
          }
        />
        <InsightRow
          detail={
            peak
              ? `${peak.expenseCount} ${peak.expenseCount === 1 ? "expense" : "expenses"}`
              : "No dated expenses yet"
          }
          icon={CalendarDays}
          label="Highest spending date"
          value={
            peak
              ? `${formatDateOnly(peak.startDate)} · ${formatInr(peak.actualPaise)}`
              : "No spending date yet"
          }
        />
        <InsightRow
          detail={
            latestExpense
              ? `${expenseAmountLabel(latestExpense)} most recently added`
              : "Add an expense to start the timeline"
          }
          icon={ReceiptIndianRupee}
          label="Latest expense date"
          value={latestExpense?.date ? formatDateOnly(latestExpense.date) : "No expense date yet"}
        />
      </Card>
    </View>
  );
}

function BudgetTargetEditor({
  currentTarget,
  onClose,
  visible,
}: {
  currentTarget?: number;
  onClose: () => void;
  visible: boolean;
}) {
  const { fontScale } = useWindowDimensions();
  const mutation = useWorkspaceMutation();
  const workspace = useWorkspace();
  const [value, setValue] = useState(() => fromPaise(currentTarget));
  const [error, setError] = useState<string>();
  const stackActions = isLargeText(fontScale);

  const close = () => {
    if (mutation.isPending) return;
    setError(undefined);
    onClose();
  };
  const save = useSingleFlightSubmission(async () => {
    const trimmed = value.trim();
    if (trimmed && !/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      setError("Enter a valid non-negative amount.");
      return;
    }
    if (trimmed && !Number.isSafeInteger(toPaise(trimmed))) {
      setError("Enter a smaller amount.");
      return;
    }
    const wedding = workspace.data?.wedding;
    if (!wedding) return;
    setError(undefined);
    try {
      await mutation.mutateAsync((repositories) =>
        repositories.wedding.updateWedding({
          ...wedding,
          budgetTargetPaise: trimmed && toPaise(trimmed) > 0 ? toPaise(trimmed) : undefined,
        }),
      );
    } catch {
      return;
    }
    onClose();
  });

  return (
    <AppBottomSheet
      closeLabel="Close budget target editor"
      description="Use the total amount your family wants to stay within."
      footer={
        <View
          className="gap-sm"
          style={{ flexDirection: stackActions ? "column" : "row" }}
          testID="budget-target-actions"
        >
          <Button
            className={stackActions ? "w-full" : "flex-1"}
            label="Cancel"
            onPress={close}
            variant="secondary"
          />
          <Button
            className={stackActions ? "w-full" : "flex-1"}
            label="Save target"
            loading={mutation.isPending}
            onPress={() => void save()}
          />
        </View>
      }
      icon={Target}
      onClose={close}
      title="Budget target"
      visible={visible}
    >
      <TextField
        autoFocus
        error={error}
        icon={Target}
        keyboardType="decimal-pad"
        label="Target amount (₹)"
        onChangeText={setValue}
        placeholder="Empty clears target"
        value={value}
      />
      {mutation.error ? (
        <AppText accessibilityRole="alert" tone="danger" variant="caption">
          {toUserMessage(mutation.error)}
        </AppText>
      ) : null}
    </AppBottomSheet>
  );
}

export type ExpenseCardProps = {
  category?: BudgetCategory;
  expense: Expense;
  onPress: () => void;
};

export const ExpenseCard = memo(function ExpenseCard({
  category,
  expense,
  onPress,
}: ExpenseCardProps) {
  const theme = useAppTheme();
  const amountRecorded = expense.actualPaise > 0;
  const { fontScale } = useWindowDimensions();
  const stacked = isLargeText(fontScale);
  const amountLabel = amountRecorded ? expenseAmountLabel(expense) : "Amount not recorded";
  const categoryLabel = category?.name ?? "Other";
  const dateLabel = expense.date
    ? `Expense date ${formatDateOnly(expense.date)}`
    : "No expense date";
  const attachmentLabel = expense.receipt ? "Attachment added" : "No attachment";
  const actionLabel = amountRecorded ? "Open expense" : "Edit expense amount";

  return (
    <MotionPressable
      accessibilityHint={amountRecorded ? "Opens expense details" : "Opens amount editing"}
      accessibilityLabel={`${actionLabel}: ${expense.title}. ${amountLabel}. ${categoryLabel}. ${dateLabel}. ${attachmentLabel}.`}
      accessibilityRole="button"
      android_ripple={{ color: theme.colors.surfaceMuted }}
      className="min-h-16 overflow-hidden rounded-control border border-borderSubtle bg-elevatedSurface active:bg-surfaceMuted"
      onPress={onPress}
      pressedScale={0.99}
    >
      <View className="flex-row items-center gap-sm px-sm py-xs">
        <ExpenseCategoryIcon iconKey={category?.iconKey ?? "other"} size="sm" />
        <View
          className="min-w-0 flex-1 gap-xs"
          style={{ flexDirection: stacked ? "column" : "row" }}
          testID={`expense-card-heading-${expense.id}`}
        >
          <View className="min-w-0 flex-1 gap-2xs">
            <AppText numberOfLines={2} variant="label">
              {expense.title}
            </AppText>
            <AppText numberOfLines={1} tone="muted" variant="metadata">
              {categoryLabel}
              {expense.receipt ? " · Receipt" : ""}
            </AppText>
          </View>
          <AppText
            className={stacked ? "self-start" : "shrink-0 text-right"}
            numberOfLines={stacked ? undefined : 1}
            style={{ fontVariant: ["tabular-nums"] }}
            tone={
              amountRecorded ? (expense.direction === "refund" ? "success" : "danger") : "warning"
            }
            variant="heading"
          >
            {amountLabel}
          </AppText>
        </View>
        <ChevronRight color={theme.colors.textSecondary} size={tokens.iconSize.sm} />
      </View>
    </MotionPressable>
  );
});

function CategoryBreakdown({ items }: { items: CategorySpending[] }) {
  const expenseCategoryPresentation = useExpenseCategoryPresentation();
  const { fontScale } = useWindowDimensions();
  const stacked = isLargeText(fontScale);

  return (
    <View className="gap-md">
      <View className="gap-2xs">
        <AppText accessibilityRole="header" variant="heading">
          Where money went
        </AppText>
        <AppText tone="muted" variant="caption">
          Spending before refunds, by category
        </AppText>
      </View>
      {items.length ? (
        <View className="gap-sm">
          {items.map((item) => {
            const presentation = expenseCategoryPresentation[item.iconKey];
            return (
              <View
                accessible
                accessibilityLabel={`${presentation.label}, ${formatInr(item.actualPaise)}, ${Math.round(item.percentage)}% of spending`}
                className="gap-xs rounded-card border border-borderSubtle bg-elevatedSurface p-md"
                key={item.iconKey}
              >
                <View
                  className="gap-sm"
                  style={{
                    alignItems: stacked ? "stretch" : "center",
                    flexDirection: stacked ? "column" : "row",
                  }}
                  testID={`category-breakdown-heading-${item.iconKey}`}
                >
                  <View className="min-w-0 flex-1 flex-row items-center gap-sm">
                    <ExpenseCategoryIcon iconKey={item.iconKey} size="sm" />
                    <AppText className="flex-1" variant="label">
                      {presentation.label}
                    </AppText>
                  </View>
                  <AppText
                    className={stacked ? "self-start" : "text-right"}
                    style={{ fontVariant: ["tabular-nums"] }}
                    variant="label"
                  >
                    {formatInr(item.actualPaise)}
                  </AppText>
                </View>
                <View className="h-xs overflow-hidden rounded-full bg-surfaceMuted">
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: presentation.color,
                      width: `${Math.max(4, item.percentage)}%`,
                    }}
                  />
                </View>
                <AppText tone="muted" variant="caption">
                  {Math.round(item.percentage)}% of total spending
                </AppText>
              </View>
            );
          })}
        </View>
      ) : (
        <AppText tone="muted">Add an expense to see the category breakdown.</AppText>
      )}
    </View>
  );
}

export function BudgetOverviewDashboard() {
  const workspace = useWorkspace();
  const [targetEditorOpen, setTargetEditorOpen] = useState(false);
  const [trendRange, setTrendRange] = useState<SpendingTrendRange>("30d");
  const today = useTodayDateOnly();

  const data = workspace.data;
  const recentExpenses = useMemo(
    () => selectRecentExpenses(data?.expenses ?? []),
    [data?.expenses],
  );
  const trendPoints = useMemo(
    () => selectSpendingTrend(data?.expenses ?? [], trendRange, today),
    [data?.expenses, today, trendRange],
  );
  const allTimeDailySpending = useMemo(
    () => selectDailySpending(data?.expenses ?? [], "all", today),
    [data?.expenses, today],
  );
  const analytics = useMemo(
    () =>
      data
        ? {
            breakdown: categorySpending(data),
            summary: homeBudgetSummary(data),
          }
        : undefined,
    [data],
  );
  const peakSpendingDate = useMemo(
    () =>
      allTimeDailySpending.reduce<SpendingTrendPoint | undefined>(
        (peak, point) =>
          !peak ||
          point.actualPaise > peak.actualPaise ||
          (point.actualPaise === peak.actualPaise && point.endDate > peak.endDate)
            ? point
            : peak,
        undefined,
      ),
    [allTimeDailySpending],
  );

  if (workspace.isLoading || !data || !analytics) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open your budget overview"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening your budget overview" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-xl p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <DetailHeader fallback="/budget" title="Budget & expenses" />
        <BudgetPosition onAction={() => setTargetEditorOpen(true)} summary={analytics.summary} />
        <View className="gap-md">
          <View className="gap-2xs">
            <AppText accessibilityRole="header" variant="heading">
              Spending trend
            </AppText>
            <AppText tone="muted" variant="caption">
              Spending before refunds over time
            </AppText>
          </View>
          <SegmentedControl
            accessibilityLabel="Spending range"
            onChange={setTrendRange}
            options={trendRangeOptions}
            value={trendRange}
          />
          <SpendingTrendChart
            key={trendRange}
            points={trendPoints}
            rangeLabel={trendRangeLabels[trendRange]}
          />
        </View>
        <AllTimeInsights
          breakdown={analytics.breakdown}
          latestExpense={recentExpenses[0]}
          peak={peakSpendingDate}
        />
        <CategoryBreakdown items={analytics.breakdown} />
        <Button
          label="View recent expenses"
          onPress={() => router.navigate("/budget")}
          variant="secondary"
        />
      </ScrollView>
      <BudgetTargetEditor
        currentTarget={data.wedding.budgetTargetPaise}
        key={`${data.wedding.budgetTargetPaise ?? "unset"}-${targetEditorOpen}`}
        onClose={() => setTargetEditorOpen(false)}
        visible={targetEditorOpen}
      />
    </Screen>
  );
}

export function ExpensesDashboard() {
  const insets = useSafeAreaInsets();
  const isScreenFocused = useIsFocused();
  const workspace = useWorkspace();
  const { fontScale } = useWindowDimensions();
  const largeText = isLargeText(fontScale);
  const data = workspace.data;
  const categoriesById = useMemo(
    () => new Map((data?.categories ?? []).map((category) => [category.id, category])),
    [data?.categories],
  );
  const expenseGroups = useMemo(
    () => selectExpenseDateGroups(data?.expenses ?? []),
    [data?.expenses],
  );
  const recentExpenses = useMemo(
    () => expenseGroups.flatMap((group) => group.expenses),
    [expenseGroups],
  );
  const expenseListEntries = useMemo(
    () =>
      expenseGroups.flatMap((group) => [
        {
          count: group.expenses.length,
          date: group.date,
          key: `date-${group.date ?? "undated"}`,
          type: "date" as const,
        },
        ...group.expenses.map((expense, index) => ({
          expense,
          key: expense.id,
          lastInGroup: index === group.expenses.length - 1,
          type: "expense" as const,
        })),
      ]),
    [expenseGroups],
  );
  const createdHighlight = useCreatedItemHighlight((state) => state.current);
  const clearCreatedHighlight = useCreatedItemHighlight((state) => state.clear);
  const budgetSummary = useMemo(() => (data ? homeBudgetSummary(data) : undefined), [data]);

  if (workspace.isLoading || !data || !budgetSummary) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open Money"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening Money" />
      </Screen>
    );
  }

  const header = (
    <View className="gap-lg pb-md">
      <PageHeader heartAccent title="Money" />
      <BudgetPosition
        actionIcon={ChartNoAxesCombined}
        actionLabel="Open budget overview"
        onAction={() => router.navigate("/budget/overview")}
        summary={budgetSummary}
      />
      <View
        className="gap-xs"
        style={{
          alignItems: largeText ? "flex-start" : "center",
          flexDirection: largeText ? "column" : "row",
          justifyContent: "space-between",
        }}
        testID="money-recent-heading-layout"
      >
        <AppText accessibilityRole="header" variant="heading">
          Recent expenses
        </AppText>
        <AppText
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
          style={{ fontVariant: ["tabular-nums"] }}
          testID="money-expense-count"
          tone="muted"
          variant="caption"
        >
          {recentExpenses.length} {recentExpenses.length === 1 ? "expense" : "expenses"}
        </AppText>
      </View>
    </View>
  );

  return (
    <Screen>
      <FlashList
        testID="money-expense-list"
        contentContainerStyle={{
          paddingBottom: listBottomPadding,
          paddingHorizontal: contentPadding,
          paddingTop: contentPadding,
        }}
        data={expenseListEntries}
        extraData={`${isScreenFocused}-${createdHighlight?.nonce ?? 0}`}
        getItemType={(item) => item.type}
        keyExtractor={(item) => item.key}
        ListEmptyComponent={<EmptyState title="No expenses yet" />}
        ListHeaderComponent={header}
        renderItem={({ item }) =>
          item.type === "date" ? (
            <View className="flex-row items-center justify-between gap-sm px-2xs pb-xs pt-sm">
              <AppText accessibilityRole="header" variant="label">
                {item.date ? formatDateOnly(item.date) : "Date not recorded"}
              </AppText>
              <AppText tone="muted" variant="metadata">
                {item.count} {item.count === 1 ? "expense" : "expenses"}
              </AppText>
            </View>
          ) : (
            <View style={{ paddingBottom: item.lastInGroup ? itemGap : 4 }}>
              <CreatedItemPulse
                active={Boolean(
                  isScreenFocused &&
                  createdHighlight?.kind === "expense" &&
                  createdHighlight.ids.includes(item.expense.id),
                )}
                onFinished={() => {
                  if (createdHighlight) clearCreatedHighlight(createdHighlight.nonce);
                }}
              >
                <ExpenseCard
                  category={categoriesById.get(item.expense.categoryId)}
                  expense={item.expense}
                  onPress={() =>
                    item.expense.actualPaise > 0
                      ? router.navigate(`/expenses/${item.expense.id}`)
                      : router.navigate({
                          pathname: "/expenses/edit",
                          params: { id: item.expense.id },
                        })
                  }
                />
              </CreatedItemPulse>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
      />
      <FloatingActionButton
        accessibilityHint="Opens the expense form"
        accessibilityLabel="Add expense"
        bottomInset={insets.bottom + fabInset}
        onPress={() => router.navigate("/expenses/new")}
        testID="money-add-expense-fab"
      />
    </Screen>
  );
}
