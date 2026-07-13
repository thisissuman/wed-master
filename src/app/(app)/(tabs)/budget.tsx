import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Plus, SlidersHorizontal } from "lucide-react-native";
import { router } from "expo-router";

import {
  AppText,
  Button,
  EmptyState,
  FilterSheet,
  LoadingState,
  Screen,
  SectionHeader,
  SelectField,
} from "@/components/ui";
import { categoryTotals, expenseTotals, useWorkspace } from "@/features/workspace";
import {
  CategorySummaryRow,
  ExpenseListItem,
  FinancialSummary,
  PageHeader,
} from "@/features/workspace/ui";

export default function BudgetScreen() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data, isLoading } = useWorkspace();

  if (isLoading || !data) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  const totals = expenseTotals(data.expenses);
  const expenses = data.expenses.filter(
    (expense) =>
      (categoryFilter === "All" || expense.categoryId === categoryFilter) &&
      (paymentFilter === "All" || expense.paymentStatus === paymentFilter),
  );
  const categorySummaries = data.categories
    .map((category) => ({ category, totals: categoryTotals(data, category.id) }))
    .filter(
      ({ totals: categoryTotal }) =>
        categoryTotal.estimatedPaise > 0 ||
        categoryTotal.actualPaise > 0 ||
        categoryTotal.paidPaise > 0,
    )
    .sort((left, right) => left.category.sortOrder - right.category.sortOrder);
  const activeFilterLabels = [
    categoryFilter !== "All"
      ? data.categories.find((category) => category.id === categoryFilter)?.name
      : undefined,
    paymentFilter !== "All" ? paymentFilter : undefined,
  ].filter((label): label is string => Boolean(label));

  const clearFilters = () => {
    setCategoryFilter("All");
    setPaymentFilter("All");
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-xl">
        <PageHeader title="Budget" />
        <FinancialSummary
          actualPaise={totals.actualPaise}
          estimatedPaise={totals.estimatedPaise}
          outstandingPaise={totals.outstandingPaise}
          paidPaise={totals.paidPaise}
        />

        <View className="gap-xs">
          <SectionHeader title="By category" />
          {categorySummaries.length ? (
            categorySummaries.map(({ category, totals: categoryTotal }) => (
              <CategorySummaryRow
                actualPaise={categoryTotal.actualPaise}
                estimatedPaise={categoryTotal.estimatedPaise}
                key={category.id}
                name={category.name}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add expense"
              description="Add a cost to see where the budget is going."
              onAction={() => router.push("/expenses/new")}
              title="No category activity yet"
            />
          )}
        </View>

        <View className="gap-sm">
          <View className="flex-row items-center justify-between gap-sm">
            <AppText className="flex-1" variant="heading">
              Expenses
            </AppText>
            <Button
              icon={SlidersHorizontal}
              label="Filter"
              onPress={() => setFiltersOpen(true)}
              variant="secondary"
            />
          </View>
          {activeFilterLabels.length ? (
            <View className="flex-row items-center justify-between gap-sm rounded-control bg-surfaceSubtle px-md py-xs">
              <AppText className="flex-1" numberOfLines={1} variant="caption">
                {activeFilterLabels.join(" · ")}
              </AppText>
              <Button label="Clear" onPress={clearFilters} variant="ghost" />
            </View>
          ) : null}
          {expenses.length ? (
            expenses.map((expense) => (
              <ExpenseListItem
                categoryName={
                  data.categories.find((category) => category.id === expense.categoryId)?.name ??
                  "Uncategorised"
                }
                expense={expense}
                key={expense.id}
                onPress={() => router.push(`/expenses/${expense.id}`)}
              />
            ))
          ) : (
            <EmptyState
              actionLabel="Add expense"
              description={
                activeFilterLabels.length
                  ? "Clear the filters or add a new expense."
                  : "Record a cost to keep the budget clear."
              }
              onAction={() => router.push("/expenses/new")}
              title={activeFilterLabels.length ? "No matching expenses" : "No expenses yet"}
            />
          )}
        </View>
      </ScrollView>
      <View className="border-t border-border bg-surface p-md">
        <Button icon={Plus} label="Add expense" onPress={() => router.push("/expenses/new")} />
      </View>
      <FilterSheet
        onClear={clearFilters}
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
        <SelectField
          label="Payment status"
          onChange={setPaymentFilter}
          options={[
            { label: "All payment statuses", value: "All" },
            { label: "Payment due", value: "Not Paid" },
            { label: "Partially paid", value: "Partially Paid" },
            { label: "Paid", value: "Paid" },
          ]}
          value={paymentFilter}
        />
      </FilterSheet>
    </Screen>
  );
}
