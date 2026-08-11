import { useLocalSearchParams } from "expo-router";

import { ExpenseDetailDashboard } from "@/features/workspace";

export default function ExpenseDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExpenseDetailDashboard expenseId={id} />;
}
