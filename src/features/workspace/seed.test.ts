import { daysUntilDateOnly } from "@/lib/dates";

import {
  createDemoWorkspace,
  createEmptyWorkspace,
  createSuggestedEvents,
  missingSuggestedEvents,
} from "./seed";
import { coreBudgetCategories } from "./expense-categories";

describe("relative demo workspace", () => {
  it("builds a coherent timeline from the supplied reference date", () => {
    const reference = new Date(2030, 0, 10, 12);
    const snapshot = createDemoWorkspace(reference);
    const eventDates = new Map(snapshot.events.map((event) => [event.id, event.date]));

    expect(daysUntilDateOnly(snapshot.wedding.date, "2030-01-10")).toBe(150);
    expect(snapshot.wedding.budgetTargetPaise).toBe(2_800_000_000);
    expect(
      snapshot.tasks.every(
        (task) =>
          !task.eventId || !task.dueDate || task.dueDate <= (eventDates.get(task.eventId) ?? ""),
      ),
    ).toBe(true);
    expect(
      snapshot.gifts
        .filter((gift) => gift.kind === "Received")
        .every((gift) => !gift.date || gift.date <= "2030-01-10"),
    ).toBe(true);
  });

  it("produces different dates for a different reference without mutating prior snapshots", () => {
    const first = createDemoWorkspace(new Date(2030, 0, 10, 12));
    const second = createDemoWorkspace(new Date(2031, 0, 10, 12));

    expect(first.wedding.date).not.toBe(second.wedding.date);
    expect(first.wedding.date).toBe("2030-06-09");
  });

  it("creates a v4 workspace with exactly the seven selectable core categories", () => {
    const snapshot = createDemoWorkspace(new Date(2030, 0, 10, 12));

    expect(snapshot.version).toBe(4);
    expect(snapshot.categories).toEqual(
      coreBudgetCategories.map((category, sortOrder) => ({
        ...category,
        archived: false,
        sortOrder,
      })),
    );
    expect(snapshot.expenses.every((expense) => Boolean(expense.createdAt))).toBe(true);
  });

  it("creates only selected suggested events at editable wedding-relative dates", () => {
    const snapshot = createEmptyWorkspace(
      {
        name: "Asha & Dev",
        type: "Not specified",
        date: "2030-06-09",
        location: "To be decided",
      },
      ["mehendi", "wedding", "reception"],
    );

    expect(
      snapshot.events.map(({ date, name, starterEventKey }) => ({
        date,
        name,
        starterEventKey,
      })),
    ).toEqual([
      { date: "2030-06-07", name: "Mehendi", starterEventKey: "mehendi" },
      { date: "2030-06-09", name: "Wedding", starterEventKey: "wedding" },
      { date: "2030-06-10", name: "Reception", starterEventKey: "reception" },
    ]);
  });

  it("does not recreate suggestions represented by a stable key or familiar name", () => {
    const existing = createSuggestedEvents("2030-06-09", ["wedding"]);
    existing.push({
      id: "custom-mehndi",
      name: "Mehndi",
      date: "2030-06-07",
      requiredItems: [],
      sortOrder: 1,
    });

    expect(missingSuggestedEvents(existing).map((event) => event.key)).not.toEqual(
      expect.arrayContaining(["wedding", "mehendi"]),
    );
  });
});
