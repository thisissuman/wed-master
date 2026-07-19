import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  LoadingState,
  Screen,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";

import { removeWorkspaceAttachment } from "../files/workspace-files";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { DetailHeader, formatDate, MoneyLine } from "../ui";

export function ExpenseDetailDashboard({ expenseId }: { expenseId: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();

  if (!data) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  const expense = data.expenses.find((item) => item.id === expenseId);
  if (!expense) {
    return (
      <Screen className="p-md">
        <AppText>Expense not found.</AppText>
      </Screen>
    );
  }

  const categoryName =
    data.categories.find((category) => category.id === expense.categoryId)?.name ?? "Uncategorised";
  const paymentTone = expense.paymentStatus === "Paid" ? "success" : "warning";

  const deleteExpense = async () => {
    await mutation.mutateAsync((repositories) => repositories.expenses.deleteExpense(expense.id));
    removeWorkspaceAttachment(expense.receipt);
    router.replace("/budget");
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <DetailHeader eyebrow={categoryName} title={expense.title} />
        <StatusBadge label={expense.paymentStatus} tone={paymentTone} />

        <Card className="gap-sm" variant="subtle">
          <MoneyLine label="Planned" value={expense.estimatedPaise ?? 0} />
          <MoneyLine emphasis label="Spent" value={expense.actualPaise} />
          <MoneyLine label="Paid" value={expense.paidPaise} />
          <MoneyLine label="Outstanding" value={expense.actualPaise - expense.paidPaise} />
        </Card>

        {expense.vendorName ||
        expense.date ||
        expense.eventId ||
        expense.dueDate ||
        expense.notes ||
        expense.receipt ? (
          <View className="gap-xs">
            <SectionHeader title="Details" />
            <Card className="gap-md" variant="subtle">
              {expense.vendorName ? (
                <View className="gap-2xs">
                  <AppText variant="caption">Payee or vendor</AppText>
                  <AppText>{expense.vendorName}</AppText>
                </View>
              ) : null}
              {expense.date ? (
                <View className="gap-2xs">
                  <AppText variant="caption">Expense date</AppText>
                  <AppText>{formatDate(expense.date)}</AppText>
                </View>
              ) : null}
              {expense.eventId ? (
                <View className="gap-2xs">
                  <AppText variant="caption">Linked event</AppText>
                  <AppText>
                    {data.events.find((event) => event.id === expense.eventId)?.name ??
                      "Event removed"}
                  </AppText>
                </View>
              ) : null}
              {expense.dueDate ? (
                <View className="gap-2xs">
                  <AppText variant="caption">Payment due</AppText>
                  <AppText>{formatDate(expense.dueDate)}</AppText>
                </View>
              ) : null}
              {expense.notes ? (
                <View className="gap-2xs">
                  <AppText variant="caption">Notes</AppText>
                  <AppText>{expense.notes}</AppText>
                </View>
              ) : null}
              {expense.receipt ? (
                <View className="gap-2xs">
                  <AppText variant="caption">Receipt or bill</AppText>
                  <AppText>{expense.receipt.name}</AppText>
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}

        <View className="gap-xs pt-sm">
          <Button
            label="Edit expense"
            onPress={() => router.push({ pathname: "/expenses/edit", params: { id: expense.id } })}
          />
          <Button
            label="Delete expense"
            onPress={() => setDeleteOpen(true)}
            variant="dangerGhost"
          />
        </View>
      </ScrollView>
      <ConfirmationDialog
        confirmLabel="Delete expense"
        description="This cost and its payment information will be removed from the local budget."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteExpense()}
        pending={mutation.isPending}
        title="Delete this expense?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
