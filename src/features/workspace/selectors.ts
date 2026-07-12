import type { Expense, Task, WorkspaceSnapshot } from "./types";

export const isOverdue = (date?: string, today = new Date().toISOString().slice(0, 10)) =>
  Boolean(date && date < today);
export const activeTasks = (tasks: Task[]) => tasks.filter((task) => task.status !== "Cancelled");
export const completedTaskCount = (tasks: Task[]) =>
  tasks.filter((task) => task.status === "Completed").length;
export const taskProgress = (tasks: Task[]) => {
  const active = activeTasks(tasks);
  return { completed: completedTaskCount(active), total: active.length };
};
export const expenseTotals = (expenses: Expense[]) =>
  expenses.reduce(
    (totals, expense) => ({
      estimatedPaise: totals.estimatedPaise + (expense.estimatedPaise ?? 0),
      actualPaise: totals.actualPaise + expense.actualPaise,
      paidPaise: totals.paidPaise + expense.paidPaise,
      outstandingPaise: totals.outstandingPaise + (expense.actualPaise - expense.paidPaise),
    }),
    { estimatedPaise: 0, actualPaise: 0, paidPaise: 0, outstandingPaise: 0 },
  );
export const categoryTotals = (snapshot: WorkspaceSnapshot, categoryId: string) =>
  expenseTotals(snapshot.expenses.filter((expense) => expense.categoryId === categoryId));
