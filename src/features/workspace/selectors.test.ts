import { expenseTotals, isOverdue, taskProgress } from "./selectors";
import type { Expense, Task } from "./types";

describe("workspace selectors", () => {
  it("updates task progress when a task is completed", () => {
    const tasks: Task[] = [
      { id: "1", title: "A", priority: "High", status: "Completed" },
      { id: "2", title: "B", priority: "Low", status: "Not Started" },
      { id: "3", title: "C", priority: "Low", status: "Cancelled" },
    ];
    expect(taskProgress(tasks)).toEqual({ completed: 1, total: 2 });
  });

  it("uses paise exactly for paid and outstanding totals", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        title: "Venue",
        categoryId: "venue",
        estimatedPaise: 10_000_001,
        actualPaise: 10_000_001,
        paidPaise: 3_333_334,
        paymentStatus: "Partially Paid",
      },
    ];
    expect(expenseTotals(expenses)).toEqual({
      estimatedPaise: 10_000_001,
      actualPaise: 10_000_001,
      paidPaise: 3_333_334,
      outstandingPaise: 6_666_667,
    });
  });

  it("identifies overdue tasks by due date", () => {
    expect(isOverdue("2026-01-01", "2026-02-01")).toBe(true);
    expect(isOverdue("2026-02-01", "2026-02-01")).toBe(false);
  });
});
