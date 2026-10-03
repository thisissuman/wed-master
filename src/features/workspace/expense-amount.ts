import { formatInr } from "@/lib/money";
import type { Expense } from "./types";

export function netExpensePaise(expense: Expense): number {
  return expense.direction === "refund" ? -expense.actualPaise : expense.actualPaise;
}

export function expenseAmountLabel(expense: Expense): string {
  return `${expense.direction === "refund" ? "+" : "-"}${formatInr(expense.actualPaise)}`;
}
