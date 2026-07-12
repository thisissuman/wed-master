import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import {
  AppText,
  Button,
  Card,
  EmptyState,
  LoadingState,
  Screen,
  StatusBadge,
} from "@/components/ui";
import { categoryTotals, expenseTotals, useWorkspace } from "@/features/workspace";
import { MoneyLine, PageHeader } from "@/features/workspace/ui";
export default function BudgetScreen() {
  const { data, isLoading } = useWorkspace();
  if (isLoading || !data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const totals = expenseTotals(data.expenses);
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
          {data.expenses.length ? (
            data.expenses.map((expense) => (
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
              title="No expenses yet"
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
