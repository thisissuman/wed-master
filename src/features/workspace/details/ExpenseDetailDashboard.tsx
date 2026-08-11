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
} from "@/components/ui";
import { feedbackDurationMilliseconds, useFeedbackStore } from "@/features/feedback/feedback-store";
import { formatInr } from "@/lib/money";

import { removeWorkspaceAttachment } from "../files/workspace-files";
import { ExpenseCategoryIcon } from "../money/ExpenseCategoryIcon";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { DetailHeader, formatDate } from "../ui";

export function ExpenseDetailDashboard({ expenseId }: { expenseId: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);

  if (!data) {
    return (
      <Screen edges={["top", "right", "bottom", "left"]}>
        <LoadingState />
      </Screen>
    );
  }

  const expense = data.expenses.find((item) => item.id === expenseId);
  if (!expense) {
    return (
      <Screen className="p-md" edges={["top", "right", "bottom", "left"]}>
        <AppText>Expense not found.</AppText>
      </Screen>
    );
  }

  const categoryName =
    data.categories.find((category) => category.id === expense.categoryId)?.name ?? "Uncategorised";
  const category = data.categories.find((item) => item.id === expense.categoryId);

  const deleteExpense = async () => {
    await mutation.mutateAsync((repositories) => repositories.expenses.deleteExpense(expense.id));
    let restored = false;
    setTimeout(() => {
      if (!restored) removeWorkspaceAttachment(expense.receipt);
    }, feedbackDurationMilliseconds);
    showFeedback({
      actionLabel: "Undo",
      message: "Expense deleted",
      onAction: async () => {
        restored = true;
        await mutation.mutateAsync((repositories) => repositories.expenses.restoreExpense(expense));
      },
    });
    router.replace("/budget");
  };

  return (
    <Screen edges={["top", "right", "bottom", "left"]}>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <DetailHeader eyebrow={categoryName} fallback="/budget" title={expense.title} />
        <Card className="gap-md" variant="subtle">
          <View className="flex-row items-center gap-sm">
            {category ? <ExpenseCategoryIcon iconKey={category.iconKey} /> : null}
            <View className="min-w-0 flex-1 gap-2xs">
              <AppText tone="muted" variant="caption">
                Amount spent
              </AppText>
              {expense.actualPaise > 0 ? (
                <AppText tone="primary" variant="display">
                  {formatInr(expense.actualPaise)}
                </AppText>
              ) : (
                <AppText tone="warning" variant="heading">
                  Amount not recorded
                </AppText>
              )}
            </View>
          </View>
          {expense.date ? (
            <View className="border-t border-borderSubtle pt-sm">
              <AppText tone="muted" variant="caption">
                Expense date
              </AppText>
              <AppText>{formatDate(expense.date)}</AppText>
            </View>
          ) : null}
        </Card>

        {expense.notes || expense.receipt ? (
          <View className="gap-xs">
            <SectionHeader title="Details" />
            <Card className="gap-md" variant="subtle">
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
            label={expense.actualPaise === 0 ? "Add amount" : "Edit expense"}
            onPress={() =>
              router.navigate({ pathname: "/expenses/edit", params: { id: expense.id } })
            }
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
        description="This expense and its attachment will be removed from the local budget."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void deleteExpense()}
        pending={mutation.isPending}
        title="Delete this expense?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
