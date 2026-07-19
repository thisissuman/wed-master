import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import {
  CalendarDays,
  Camera,
  Car,
  Flower2,
  Gift,
  Landmark,
  Music2,
  Plus,
  ReceiptIndianRupee,
  SlidersHorizontal,
  Utensils,
} from "lucide-react-native";
import { router } from "expo-router";

import { MangalyaHeader } from "@/components/brand";
import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  FilterChip,
  FilterSheet,
  LoadingState,
  Screen,
  SelectField,
  StatusBadge,
} from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { formatInr } from "@/lib/money";
import { tokens } from "@/theme";

import { useWorkspace } from "../provider";
import type { Expense, PaymentStatus } from "../types";

type PaymentFilter = PaymentStatus | "All";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const itemGap = Number.parseInt(tokens.spacing.sm, 10);
const listFooterClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["2xl"], 10) * 2;

const paymentPresentation: Record<
  PaymentStatus,
  { label: string; stripe: string; tone: "danger" | "success" | "warning" }
> = {
  "Not Paid": { label: "Unpaid", stripe: "bg-danger", tone: "danger" },
  "Partially Paid": { label: "Partially paid", stripe: "bg-warning", tone: "warning" },
  Paid: { label: "Paid", stripe: "bg-success", tone: "success" },
};

function CategoryIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  const props = { color: tokens.colors.primary, size: tokens.iconSize.md };
  if (/venue|accommodation/.test(normalized)) return <Landmark {...props} />;
  if (/cater|food/.test(normalized)) return <Utensils {...props} />;
  if (/photo/.test(normalized)) return <Camera {...props} />;
  if (/decor|flower/.test(normalized)) return <Flower2 {...props} />;
  if (/music|entertain/.test(normalized)) return <Music2 {...props} />;
  if (/gift|invitation/.test(normalized)) return <Gift {...props} />;
  if (/transport|travel/.test(normalized)) return <Car {...props} />;
  return <ReceiptIndianRupee {...props} />;
}

export type ExpenseCardProps = {
  categoryName: string;
  expense: Expense;
  onPress: () => void;
};

export function ExpenseCard({ categoryName, expense, onPress }: ExpenseCardProps) {
  const presentation = paymentPresentation[expense.paymentStatus];
  const estimatedOnly = expense.actualPaise === 0 && Boolean(expense.estimatedPaise);
  const displayedAmount = estimatedOnly ? (expense.estimatedPaise ?? 0) : expense.actualPaise;

  return (
    <Pressable
      accessibilityLabel={`Open expense: ${expense.title}`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.surfaceMuted }}
      className="overflow-hidden rounded-card border border-borderSubtle bg-elevatedSurface shadow-card active:bg-surfaceMuted"
      onPress={onPress}
    >
      <View className={`absolute bottom-0 left-0 top-0 w-2xs ${presentation.stripe}`} />
      <View className="p-md pl-lg">
        <View className="flex-row items-center gap-sm">
          <View className="h-10 w-10 items-center justify-center rounded-control bg-primarySoft">
            <CategoryIcon name={categoryName} />
          </View>
          <View className="min-w-0 flex-1 gap-xs">
            <View className="flex-row items-start justify-between gap-sm">
              <AppText className="min-w-0 flex-1" numberOfLines={2} variant="label">
                {expense.title}
              </AppText>
              <View className="items-end">
                <AppText variant="heading">{formatInr(displayedAmount)}</AppText>
                {estimatedOnly ? <AppText variant="caption">Estimate</AppText> : null}
              </View>
            </View>
            <View className="flex-row items-center gap-2xs">
              <ReceiptIndianRupee color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
              <AppText numberOfLines={1} variant="caption">
                {categoryName}
              </AppText>
            </View>
            <View className="flex-row flex-wrap items-center justify-between gap-xs">
              {expense.dueDate ? (
                <View className="min-w-0 flex-row items-center gap-2xs">
                  <CalendarDays color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
                  <AppText numberOfLines={1} variant="caption">
                    {formatDateOnly(expense.dueDate)}
                  </AppText>
                </View>
              ) : (
                <View />
              )}
              <StatusBadge label={presentation.label} tone={presentation.tone} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function ExpensesDashboard() {
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const workspace = useWorkspace();

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open your expenses"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening your expenses" />
      </Screen>
    );
  }

  const data = workspace.data;
  const expenses = data.expenses.filter(
    (expense) =>
      (paymentFilter === "All" || expense.paymentStatus === paymentFilter) &&
      (categoryFilter === "All" || expense.categoryId === categoryFilter),
  );
  const header = (
    <View className="gap-xl pb-lg">
      <MangalyaHeader />
      <View className="gap-2xs">
        <AppText tone="primary" variant="display">
          Expenses
        </AppText>
        <AppText variant="body">Track and manage all wedding expenses</AppText>
      </View>
      <ScrollView
        contentContainerClassName="gap-xs pr-md"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <FilterChip
          label="All"
          onPress={() => setPaymentFilter("All")}
          selected={paymentFilter === "All"}
        />
        <FilterChip
          label="Paid"
          onPress={() => setPaymentFilter("Paid")}
          selected={paymentFilter === "Paid"}
        />
        <FilterChip
          label="Partially paid"
          onPress={() => setPaymentFilter("Partially Paid")}
          selected={paymentFilter === "Partially Paid"}
        />
        <FilterChip
          label="Unpaid"
          onPress={() => setPaymentFilter("Not Paid")}
          selected={paymentFilter === "Not Paid"}
        />
        <FilterChip
          count={categoryFilter === "All" ? undefined : 1}
          icon={SlidersHorizontal}
          label="Filters"
          onPress={() => setFiltersOpen(true)}
          selected={categoryFilter !== "All"}
        />
      </ScrollView>
      <AppText variant="caption">
        {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
      </AppText>
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
        data={expenses}
        ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
        keyExtractor={(expense) => expense.id}
        ListEmptyComponent={
          <EmptyState
            actionLabel="Add expense"
            description={
              data.expenses.length
                ? "Change the filters to see more expenses."
                : "Record the first wedding cost when you are ready."
            }
            imageSource={
              data.expenses.length
                ? undefined
                : require("../../../../assets/images/mangalya/empty-expenses.jpg")
            }
            onAction={() => router.push("/expenses/new")}
            title={data.expenses.length ? "No matching expenses" : "No expenses yet"}
          />
        }
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ExpenseCard
            categoryName={
              data.categories.find((category) => category.id === item.categoryId)?.name ??
              "Uncategorised"
            }
            expense={item}
            onPress={() => router.push(`/expenses/${item.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      <View className="border-t border-borderSubtle bg-canvas p-md">
        <Button
          icon={Plus}
          label="Add expense"
          onPress={() => router.push("/expenses/new")}
          variant="primary"
        />
      </View>
      <FilterSheet
        onClear={() => setCategoryFilter("All")}
        onClose={() => setFiltersOpen(false)}
        title="Filter expenses"
        visible={filtersOpen}
      >
        <SelectField
          label="Category"
          onChange={setCategoryFilter}
          options={[
            { label: "All categories", value: "All" },
            ...data.categories.map((category) => ({ label: category.name, value: category.id })),
          ]}
          value={categoryFilter}
        />
      </FilterSheet>
    </Screen>
  );
}
