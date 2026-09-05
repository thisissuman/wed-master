import type { Expense, Task, WeddingEvent } from "../types";
import { buildEventDetailItems } from "./event-detail-items";

const event: WeddingEvent = {
  id: "event-1",
  name: "Wedding",
  date: "2026-12-10",
  notes: "Bring the ceremony notes.",
  requiredItems: [],
  sortOrder: 0,
};

const task = (index: number): Task => ({
  id: `task-${index}`,
  title: `Task ${index}`,
  priority: "Medium",
  status: "Not Started",
  checklist: [],
  attachments: [],
});

const expense = (index: number): Expense => ({
  id: `expense-${index}`,
  title: `Expense ${index}`,
  categoryId: "category-1",
  actualPaise: index,
  createdAt: "2026-08-29T00:00:00.000Z",
});

describe("buildEventDetailItems", () => {
  it("builds a single heterogeneous model for 500 tasks and 500 expenses", () => {
    const items = buildEventDetailItems(
      event,
      Array.from({ length: 500 }, (_, index) => task(index)),
      Array.from({ length: 500 }, (_, index) => expense(index)),
    );

    expect(items).toHaveLength(1_005);
    expect(items.map((item) => item.type).slice(0, 3)).toEqual(["summary", "task-section", "task"]);
    expect(items.filter((item) => item.type === "task")).toHaveLength(500);
    expect(items.filter((item) => item.type === "expense")).toHaveLength(500);
    expect(items.at(-1)?.type).toBe("action");
  });

  it("includes intentional empty states and omits an absent note", () => {
    const items = buildEventDetailItems({ ...event, notes: undefined }, [], []);

    expect(items.map((item) => item.type)).toEqual([
      "summary",
      "task-section",
      "task-empty",
      "expense-section",
      "expense-empty",
      "action",
    ]);
  });
});
