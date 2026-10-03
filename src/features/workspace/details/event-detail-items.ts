import type { Expense, Task, WeddingEvent } from "../types";

export type EventDetailListItem =
  | { id: "summary"; type: "summary" }
  | { id: "task-section"; type: "task-section" }
  | { id: string; task: Task; type: "task" }
  | { id: "task-empty"; type: "task-empty" }
  | { id: "note"; note: string; type: "note" }
  | { id: "expense-section"; type: "expense-section" }
  | { expense: Expense; id: string; type: "expense" }
  | { id: "expense-empty"; type: "expense-empty" }
  | { id: "delete-action"; type: "action" };

export function buildEventDetailItems(
  event: WeddingEvent,
  tasks: readonly Task[],
  expenses: readonly Expense[],
): EventDetailListItem[] {
  const items: EventDetailListItem[] = [
    { id: "summary", type: "summary" },
    { id: "task-section", type: "task-section" },
  ];

  if (tasks.length) {
    for (const task of tasks) {
      items.push({ id: `task-${task.id}`, task, type: "task" });
    }
  } else {
    items.push({ id: "task-empty", type: "task-empty" });
  }

  if (event.notes) items.push({ id: "note", note: event.notes, type: "note" });

  items.push({ id: "expense-section", type: "expense-section" });
  if (expenses.length) {
    for (const expense of expenses) {
      items.push({ expense, id: `expense-${expense.id}`, type: "expense" });
    }
  } else {
    items.push({ id: "expense-empty", type: "expense-empty" });
  }
  items.push({ id: "delete-action", type: "action" });

  return items;
}
