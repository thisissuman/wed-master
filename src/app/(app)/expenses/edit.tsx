import { useLocalSearchParams } from "expo-router";
import { ExpenseForm, useWorkspace } from "@/features/workspace";
import {
  RouteLoadError,
  RouteLoading,
  RouteNotFound,
} from "@/features/workspace/routes/RouteStates";
export default function EditExpenseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workspace = useWorkspace();
  if (workspace.isError)
    return (
      <RouteLoadError
        error={workspace.error}
        fallback="/budget"
        onRetry={() => void workspace.refetch()}
        title="We could not open this expense"
      />
    );
  if (!workspace.data) return <RouteLoading label="Opening expense" />;
  const expense = workspace.data.expenses.find((item) => item.id === id);
  return expense ? (
    <ExpenseForm expense={expense} />
  ) : (
    <RouteNotFound entity="Expense" fallback="/budget" />
  );
}
