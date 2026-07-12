import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import {
  AppText,
  Button,
  Card,
  EmptyState,
  LoadingState,
  Screen,
  SelectField,
  StatusBadge,
} from "@/components/ui";
import { categoryTotals, expenseTotals, useWorkspace } from "@/features/workspace";
import { MoneyLine, PageHeader } from "@/features/workspace/ui";
export default function BudgetScreen() {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const { data, isLoading } = useWorkspace();
  if (isLoading || !data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const totals = expenseTotals(data.expenses);
  const expenses = data.expenses.filter(
    (expense) =>
      (categoryFilter === "All" || expense.categoryId === categoryFilter) &&
      (paymentFilter === "All" || expense.paymentStatus === paymentFilter),
  );
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <PageHeader title="Budget" />
        <Card className="gap-sm">
          <MoneyLine emphasis label="Estimated budget" value={totals.estimatedPaise} />
          <MoneyLine label="Actual spending" value={totals.actualPaise} />
          <MoneyLine label="Paid" value={totals.paidPaise} />
          <MoneyLine label="Outstanding" value={totals.outstandingPaise} />
        </Card>
        <Button label="Add expense" onPress={() => router.push("/expenses/new")} />
        <View className="gap-sm">
          <AppText variant="heading">Categories</AppText>
          {data.categories.map((category) => {
            const categoryTotal = categoryTotals(data, category.id);
            const over =
              categoryTotal.actualPaise > categoryTotal.estimatedPaise &&
              categoryTotal.estimatedPaise > 0;
            return (
              <Card className="gap-sm" key={category.id}>
                <View className="flex-row justify-between gap-sm">
                  <AppText variant="heading">{category.name}</AppText>
                  {over ? <StatusBadge label="Over estimate" tone="danger" /> : null}
                </View>
                <MoneyLine label="Estimated" value={categoryTotal.estimatedPaise} />
                <MoneyLine label="Actual" value={categoryTotal.actualPaise} />
                <MoneyLine label="Outstanding" value={categoryTotal.outstandingPaise} />
              </Card>
            );
          })}
        </View>
        <View className="gap-sm">
          <AppText variant="heading">Expenses</AppText>
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
              { label: "Not paid", value: "Not Paid" },
              { label: "Partially paid", value: "Partially Paid" },
              { label: "Paid", value: "Paid" },
            ]}
            value={paymentFilter}
          />
          {expenses.length ? (
            expenses.map((expense) => (
              <Card
                className="gap-2xs"
                key={expense.id}
                onTouchEnd={() => router.push(`/expenses/${expense.id}`)}
              >
                <AppText variant="heading">{expense.title}</AppText>
                <AppText variant="caption">
                  {data.categories.find((category) => category.id === expense.categoryId)?.name ??
                    "Uncategorised"}{" "}
                  · {expense.paymentStatus}
                </AppText>
                <MoneyLine label="Actual" value={expense.actualPaise} />
              </Card>
            ))
          ) : (
            <EmptyState
              actionLabel="Add expense"
              description="Record the first expected or actual cost."
              onAction={() => router.push("/expenses/new")}
              title="No matching expenses"
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
