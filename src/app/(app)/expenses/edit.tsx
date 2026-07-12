import { useLocalSearchParams } from "expo-router";
import { AppText, LoadingState, Screen } from "@/components/ui";
import { ExpenseForm } from "@/features/workspace/ExpenseForm";
import { useWorkspace } from "@/features/workspace";
export default function EditExpenseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useWorkspace();
  if (!data)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  const expense = data.expenses.find((item) => item.id === id);
  return expense ? (
    <ExpenseForm expense={expense} />
  ) : (
    <Screen>
      <AppText>Expense not found.</AppText>
    </Screen>
  );
}
