import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  Pencil,
  Plus,
  ReceiptIndianRupee,
  Target,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { memo, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";

import { MangalyaHeader } from "@/components/brand";
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  MotionPressable,
  Screen,
  SegmentedControl,
  TextField,
} from "@/components/ui";
import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { formatDateOnly, todayDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { formatInr, formatInrCompact } from "@/lib/money";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";

import { fromPaise, toPaise } from "../forms";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import {
  categorySpending,
  homeBudgetSummary,
  selectDailySpending,
  selectRecentExpenses,
  selectSpendingTrend,
  type CategorySpending,
  type SpendingTrendPoint,
  type SpendingTrendRange,
} from "../selectors";
import type { BudgetCategory, Expense } from "../types";
import { DetailHeader } from "../ui";
import { ExpenseCategoryIcon, expenseCategoryPresentation } from "./ExpenseCategoryIcon";
import { SpendingTrendChart } from "./SpendingTrendChart";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const itemGap = Number.parseInt(tokens.spacing.sm, 10);
const listFooterClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["2xl"], 10) * 2;

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
          ? `min-h-12 flex-row items-center justify-between gap-sm py-xs ${
              divider ? "border-b border-borderSubtle" : ""
            }`
          : `flex-1 gap-2xs px-xs ${divider ? "border-r border-borderSubtle" : ""}`
      }`}
    >
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={{ fontVariant: ["tabular-nums"] }}
        tone={tone === "default" ? undefined : tone}
        variant="heading"
      >
        {value}
      </AppText>
    </View>
  );
}

function BudgetPosition({
  onEditTarget,
  summary,
}: {
  onEditTarget: () => void;
  summary: ReturnType<typeof homeBudgetSummary>;
}) {
  const hasTarget = summary.targetPaise !== undefined;
  const overBudget = summary.overBudgetPaise > 0;
  const remainingLabel = overBudget ? "Over by" : "Pending";
  const remainingValue = overBudget
    ? formatInrCompact(summary.overBudgetPaise)
    : summary.remainingPaise === undefined
      ? "—"
      : formatInrCompact(summary.remainingPaise);
  const { fontScale } = useWindowDimensions();
  const stacked = isLargeText(fontScale);

  return (
    <View
      className="rounded-card border border-borderSubtle bg-elevatedSurface p-sm shadow-card"
      testID="budget-summary"
    >
      <View
        className="gap-xs"
        style={{
          flexDirection: stacked ? "column" : "row",
        }}
        testID="budget-summary-layout"
      >
        <View
          className="min-w-0 flex-1"
          style={{ flexDirection: stacked ? "column" : "row" }}
          testID="budget-summary-metrics"
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
            label="Spent"
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
        <IconButton
          accessibilityLabel={hasTarget ? "Edit target" : "Set target"}
          className={stacked ? "self-end" : "self-center"}
          icon={hasTarget ? Pencil : Target}
          onPress={onEditTarget}
          variant="subtle"
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
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. ${detail}`}
      className="min-h-20 flex-row items-center gap-sm border-b border-borderSubtle py-sm last:border-b-0"
    >
      <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
        <Icon color={tokens.colors.primary} size={tokens.iconSize.md} />
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
  const topCategory = breakdown[0];
  const topPresentation = topCategory
    ? expenseCategoryPresentation[topCategory.iconKey]
    : undefined;

  return (
    <View className="gap-md">
      <View className="gap-2xs">
        <AppText tone="primary" variant="title">
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
              ? `${formatInr(latestExpense.actualPaise)} most recently added`
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
  const reduceMotion = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const mutation = useWorkspaceMutation();
  const workspace = useWorkspace();
  const showFeedback = useFeedbackStore((state) => state.show);
  const submissionInFlight = useRef(false);
  const [value, setValue] = useState(() => fromPaise(currentTarget));
  const [error, setError] = useState<string>();
  const stackActions = isLargeText(fontScale);

  const close = () => {
    if (mutation.isPending) return;
    setError(undefined);
    onClose();
  };
  const save = async () => {
    if (submissionInFlight.current) return;
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
    submissionInFlight.current = true;
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
    } finally {
      submissionInFlight.current = false;
    }
    showFeedback({ message: trimmed ? "Budget target updated" : "Budget target cleared" });
    onClose();
  };

  return (
    <Modal
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={close}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-overlay"
      >
        <SafeAreaView
          accessibilityViewIsModal
          edges={["bottom"]}
          className="gap-lg rounded-t-sheet border border-borderSubtle bg-elevatedSurface p-lg shadow-elevated"
        >
          <View className="flex-row items-center gap-sm">
            <View className="min-w-0 flex-1 gap-2xs">
              <AppText accessibilityRole="header" tone="primary" variant="heading">
                Budget target
              </AppText>
              <AppText tone="muted" variant="caption">
                Use the total amount your family wants to stay within.
              </AppText>
            </View>
            <IconButton accessibilityLabel="Close budget target editor" icon={X} onPress={close} />
          </View>
          <TextField
            autoFocus
            error={error}
            icon={Target}
            keyboardType="decimal-pad"
            label="Target amount (₹)"
            onChangeText={setValue}
            placeholder="Leave empty to clear"
            value={value}
          />
          {mutation.error ? (
            <AppText accessibilityRole="alert" tone="danger" variant="caption">
              {toUserMessage(mutation.error)}
            </AppText>
          ) : null}
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
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
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
  const presentation = expenseCategoryPresentation[category?.iconKey ?? "other"];
  const amountRecorded = expense.actualPaise > 0;
  const { fontScale } = useWindowDimensions();
  const stacked = isLargeText(fontScale);
  const amountLabel = amountRecorded ? formatInr(expense.actualPaise) : "Amount not recorded";
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
      android_ripple={{ color: tokens.colors.surfaceMuted }}
      className="overflow-hidden rounded-card bg-elevatedSurface shadow-card active:opacity-90"
      onPress={onPress}
      pressedScale={0.99}
    >
      <View className="gap-sm p-md">
        <View className="flex-row items-start gap-sm">
          <ExpenseCategoryIcon iconKey={category?.iconKey ?? "other"} />
          <View className="min-w-0 flex-1 gap-2xs">
            <View
              className="self-start rounded-control px-xs py-2xs"
              style={{ backgroundColor: presentation.softColor }}
            >
              <AppText style={{ color: presentation.color }} variant="caption">
                {categoryLabel}
              </AppText>
            </View>
            <AppText numberOfLines={2} variant="heading">
              {expense.title}
            </AppText>
          </View>
          <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
        </View>
        <View className="border-t border-dashed border-borderStrong pt-sm">
          <View
            className="gap-2xs"
            style={{
              alignItems: stacked ? "stretch" : "center",
              flexDirection: stacked ? "column" : "row",
            }}
            testID={`expense-card-heading-${expense.id}`}
          >
            <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-xs">
              {expense.date ? (
                <AppText tone="muted" variant="caption">
                  {formatDateOnly(expense.date)}
                </AppText>
              ) : (
                <AppText tone="muted" variant="caption">
                  Date not recorded
                </AppText>
              )}
              {expense.receipt ? (
                <View className="rounded-control bg-surfaceMuted px-xs py-2xs">
                  <AppText tone="muted" variant="caption">
                    Receipt attached
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText
              className={stacked ? "self-start" : "shrink-0 text-right"}
              style={{ fontVariant: ["tabular-nums"] }}
              tone={amountRecorded ? "primary" : "warning"}
              variant="title"
            >
              {amountLabel}
            </AppText>
          </View>
        </View>
      </View>
    </MotionPressable>
  );
});

function CategoryBreakdown({ items }: { items: CategorySpending[] }) {
  const { fontScale } = useWindowDimensions();
  const stacked = isLargeText(fontScale);

  return (
    <View className="gap-md">
      <View className="gap-2xs">
        <AppText accessibilityRole="header" tone="primary" variant="title">
          Where money went
        </AppText>
        <AppText tone="muted" variant="caption">
          Categories ranked by actual recorded spending
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
  const [today] = useState(() => todayDateOnly());

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
        <MangalyaHeader />
        <DetailHeader fallback="/budget" title="Budget & expenses" />
        <BudgetPosition
          onEditTarget={() => setTargetEditorOpen(true)}
          summary={analytics.summary}
        />
        <View className="gap-md">
          <View className="gap-2xs">
            <AppText accessibilityRole="header" tone="primary" variant="title">
              Spending trend
            </AppText>
            <AppText tone="muted" variant="caption">
              See how recorded spending changed over time
            </AppText>
          </View>
          <SegmentedControl
            accessibilityLabel="Spending range"
            onChange={(value) => {
              if (value === trendRange) return;
              setTrendRange(value);
              void Haptics.selectionAsync();
            }}
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
  const workspace = useWorkspace();
  const { fontScale } = useWindowDimensions();
  const data = workspace.data;
  const categoriesById = useMemo(
    () => new Map((data?.categories ?? []).map((category) => [category.id, category])),
    [data?.categories],
  );
  const recentExpenses = useMemo(
    () => selectRecentExpenses(data?.expenses ?? []),
    [data?.expenses],
  );
  const stackedHeader = isLargeText(fontScale);

  if (workspace.isLoading || !data) {
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
      <MangalyaHeader />
      <View
        className="gap-sm"
        style={{
          alignItems: stackedHeader ? "stretch" : "center",
          flexDirection: stackedHeader ? "column" : "row",
        }}
      >
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText accessibilityRole="header" tone="primary" variant="display">
            Money
          </AppText>
        </View>
        <Button
          className={stackedHeader ? "self-start" : ""}
          icon={ChartNoAxesCombined}
          label="Budget overview"
          onPress={() => router.navigate("/budget/overview")}
          variant="ghost"
        />
      </View>
      <View className="flex-row items-center justify-between gap-sm">
        <AppText accessibilityRole="header" tone="primary" variant="title">
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
        contentContainerStyle={{
          paddingBottom: listFooterClearance,
          paddingHorizontal: contentPadding,
          paddingTop: contentPadding,
        }}
        data={recentExpenses}
        ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
        keyExtractor={(expense) => expense.id}
        ListEmptyComponent={<EmptyState title="No expenses yet" />}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ExpenseCard
            category={categoriesById.get(item.categoryId)}
            expense={item}
            onPress={() =>
              item.actualPaise > 0
                ? router.navigate(`/expenses/${item.id}`)
                : router.navigate({ pathname: "/expenses/edit", params: { id: item.id } })
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      <View
        className="border-t border-borderSubtle bg-elevatedSurface p-md shadow-floating"
        testID="money-action-footer"
      >
        <Button icon={Plus} label="Add expense" onPress={() => router.navigate("/expenses/new")} />
      </View>
    </Screen>
  );
}
