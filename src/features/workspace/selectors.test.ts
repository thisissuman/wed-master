import {
  categorySpending,
  emptyTaskFilters,
  expenseTotals,
  filterTasks,
  filterHouseholds,
  giftSummary,
  homeBudgetSummary,
  householdSummary,
  isDateInCurrentWeek,
  isOverdue,
  selectDailySpending,
  selectExpenseTitleSuggestions,
  selectHomeNextActions,
  selectRecentExpenses,
  selectSpendingTrend,
  taskProgress,
  taskSummary,
  weddingDateEvent,
} from "./selectors";
import type { Expense, Task, WeddingEvent } from "./types";
import { demoWorkspace } from "./seed";

describe("workspace selectors", () => {
  it("updates task progress when a task is completed", () => {
    const tasks: Task[] = [
      {
        id: "1",
        title: "A",
        priority: "High",
        status: "Completed",
        checklist: [],
        attachments: [],
      },
      {
        id: "2",
        title: "B",
        priority: "Low",
        status: "Not Started",
        checklist: [],
        attachments: [],
      },
      { id: "3", title: "C", priority: "Low", status: "Cancelled", checklist: [], attachments: [] },
    ];
    expect(taskProgress(tasks)).toEqual({ completed: 1, total: 2 });
    expect(taskProgress([])).toEqual({ completed: 0, total: 0 });
  });

  it("ranks at most two home focus tasks deterministically", () => {
    const task = (values: Partial<Task> & Pick<Task, "id" | "title">): Task => ({
      priority: "Low",
      status: "Not Started",
      checklist: [],
      attachments: [],
      ...values,
    });
    const tasks = [
      task({
        id: "future-critical",
        title: "Future critical",
        dueDate: "2026-07-20",
        priority: "Critical",
      }),
      task({ id: "today-low", title: "Today low", dueDate: "2026-07-17" }),
      task({ id: "overdue-low", title: "Overdue low", dueDate: "2026-07-16" }),
      task({ id: "future-high", title: "Future high", dueDate: "2026-07-19", priority: "High" }),
      task({ id: "completed", title: "Completed", status: "Completed" }),
      task({ id: "cancelled", title: "Cancelled", status: "Cancelled" }),
    ];

    expect(selectHomeNextActions(tasks, "2026-07-17").map((item) => item.id)).toEqual([
      "overdue-low",
      "today-low",
    ]);
  });

  it("calculates budget only from the wedding target and actual spending", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.budgetTargetPaise = 100_000;
    snapshot.expenses = [
      {
        id: "expense",
        title: "Venue",
        categoryId: "venue",
        createdAt: "2026-07-23T10:00:00.000Z",
        estimatedPaise: 200_000,
        actualPaise: 125_000,
        paidPaise: 75_000,
        paymentStatus: "Partially Paid",
      },
    ];

    expect(homeBudgetSummary(snapshot)).toMatchObject({
      targetPaise: 100_000,
      spentPaise: 125_000,
      remainingPaise: -25_000,
      percentage: 125,
      overBudgetPaise: 25_000,
    });

    snapshot.wedding.budgetTargetPaise = 0;
    expect(homeBudgetSummary(snapshot)).toMatchObject({
      targetPaise: undefined,
      spentPaise: 125_000,
      remainingPaise: undefined,
      percentage: undefined,
      overBudgetPaise: 0,
    });
  });

  it("leaves budget percentage undefined when no target exists", () => {
    const snapshot = structuredClone(demoWorkspace);
    delete snapshot.wedding.budgetTargetPaise;
    snapshot.expenses = [];

    expect(homeBudgetSummary(snapshot)).toMatchObject({
      overBudgetPaise: 0,
      targetPaise: undefined,
      spentPaise: 0,
      remainingPaise: undefined,
      percentage: undefined,
    });
  });

  it("orders recent expenses by creation time", () => {
    const expenses: Expense[] = [
      {
        id: "older",
        title: "Older",
        categoryId: "category-core-event",
        createdAt: "2026-07-20T10:00:00.000Z",
        actualPaise: 100,
      },
      {
        id: "newer",
        title: "Newer",
        categoryId: "category-core-event",
        createdAt: "2026-07-22T10:00:00.000Z",
        actualPaise: 200,
      },
    ];

    expect(selectRecentExpenses(expenses).map((expense) => expense.id)).toEqual(["newer", "older"]);
  });

  it("ranks and deduplicates normalized title suggestions", () => {
    const expenses: Expense[] = [
      {
        id: "old-prefix",
        title: "Venue advance",
        categoryId: "category-core-event",
        createdAt: "2026-07-20T10:00:00.000Z",
        actualPaise: 100,
      },
      {
        id: "contains",
        title: "Main venue flowers",
        categoryId: "category-core-shopping",
        createdAt: "2026-07-23T10:00:00.000Z",
        actualPaise: 200,
      },
      {
        id: "new-prefix",
        title: "  VENUE   ADVANCE ",
        categoryId: "category-core-advance",
        createdAt: "2026-07-22T10:00:00.000Z",
        actualPaise: 300,
      },
      {
        id: "prefix-two",
        title: "Venue transport",
        categoryId: "category-core-commute",
        createdAt: "2026-07-21T10:00:00.000Z",
        actualPaise: 400,
      },
    ];

    expect(selectExpenseTitleSuggestions(expenses, "  veNUE ")).toEqual([
      { categoryId: "category-core-advance", title: "  VENUE   ADVANCE " },
      { categoryId: "category-core-commute", title: "Venue transport" },
      { categoryId: "category-core-shopping", title: "Main venue flowers" },
    ]);
  });

  it("groups legacy and core category spending by compatible icon", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.expenses = [
      {
        id: "event",
        title: "Catering",
        categoryId: "category-core-event",
        createdAt: "2026-07-20T10:00:00.000Z",
        actualPaise: 75_000,
      },
      {
        id: "gift",
        title: "Return gift",
        categoryId: "category-core-gift",
        createdAt: "2026-07-21T10:00:00.000Z",
        actualPaise: 25_000,
      },
    ];

    expect(categorySpending(snapshot)).toEqual([
      { actualPaise: 75_000, iconKey: "event", percentage: 75 },
      { actualPaise: 25_000, iconKey: "gift", percentage: 25 },
    ]);
  });

  it("ranks category spending by amount", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.expenses = [
      {
        id: "event",
        title: "Event",
        categoryId: "category-core-event",
        createdAt: "2026-07-20T10:00:00.000Z",
        actualPaise: 25_000,
      },
      {
        id: "gift",
        title: "Gift",
        categoryId: "category-core-gift",
        createdAt: "2026-07-21T10:00:00.000Z",
        actualPaise: 75_000,
      },
    ];

    expect(categorySpending(snapshot).map((item) => item.iconKey)).toEqual(["gift", "event"]);
  });

  it("groups spending by expense date and filters recent ranges", () => {
    const expenses: Expense[] = [
      {
        id: "old",
        title: "Old",
        categoryId: "category-core-event",
        createdAt: "2026-05-01T10:00:00.000Z",
        actualPaise: 10_000,
        date: "2026-05-01",
      },
      {
        id: "first",
        title: "First",
        categoryId: "category-core-event",
        createdAt: "2026-07-20T10:00:00.000Z",
        actualPaise: 25_000,
        date: "2026-07-20",
      },
      {
        id: "second",
        title: "Second",
        categoryId: "category-core-gift",
        createdAt: "2026-07-20T11:00:00.000Z",
        actualPaise: 75_000,
        date: "2026-07-20",
      },
      {
        id: "undated",
        title: "Undated",
        categoryId: "category-core-other",
        createdAt: "2026-07-21T10:00:00.000Z",
        actualPaise: 5_000,
      },
      {
        id: "zero",
        title: "Zero",
        categoryId: "category-core-other",
        createdAt: "2026-07-22T10:00:00.000Z",
        actualPaise: 0,
        date: "2026-07-22",
      },
    ];

    expect(selectDailySpending(expenses, "30d", "2026-07-23")).toEqual([
      {
        actualPaise: 100_000,
        endDate: "2026-07-20",
        expenseCount: 2,
        startDate: "2026-07-20",
      },
    ]);
    expect(selectDailySpending(expenses, "all", "2026-07-23")).toHaveLength(2);
  });

  it("condenses long spending timelines without losing totals", () => {
    const expenses: Expense[] = Array.from({ length: 12 }, (_, index) => ({
      id: `expense-${index}`,
      title: `Expense ${index}`,
      categoryId: "category-core-event",
      createdAt: `2026-07-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
      actualPaise: 10_000,
      date: `2026-07-${String(index + 1).padStart(2, "0")}` as Expense["date"],
    }));
    const points = selectSpendingTrend(expenses, "all", "2026-07-23", 5);

    expect(points.length).toBeLessThanOrEqual(5);
    expect(points.reduce((sum, point) => sum + point.actualPaise, 0)).toBe(120_000);
    expect(points[0]?.startDate).toBe("2026-07-01");
    expect(points.at(-1)?.endDate).toBe("2026-07-12");
  });

  it("computes household metrics and combines side, RSVP, and search filters", () => {
    const households = [
      {
        id: "one",
        name: "Patnaik Family",
        guestCount: 5,
        side: "partnerOne" as const,
        rsvpStatus: "Confirmed" as const,
        invitationStatus: "Delivered" as const,
        accommodationStatus: "Booked" as const,
        transportStatus: "Needed" as const,
        guests: [
          { id: "a", name: "Asha Patnaik", rsvpStatus: "Confirmed" as const },
          { id: "b", name: "Ravi Patnaik", rsvpStatus: "Pending" as const },
        ],
      },
      {
        id: "two",
        name: "Friends",
        guestCount: 3,
        side: "both" as const,
        rsvpStatus: "Pending" as const,
        invitationStatus: "Not Sent" as const,
        accommodationStatus: "Not Needed" as const,
        transportStatus: "Booked" as const,
        guests: [{ id: "c", name: "Diya", rsvpStatus: "Confirmed" as const }],
      },
    ];

    expect(householdSummary(households)).toEqual({
      households: 2,
      invited: 5,
      confirmed: 5,
      stayBooked: 5,
      transportBooked: 3,
    });
    expect(
      filterHouseholds(households, {
        query: "patnaik",
        side: "partnerOne",
        status: "Confirmed",
      }).map((household) => household.id),
    ).toEqual(["one"]);
  });

  it("summarizes optional gift values and follow-up states", () => {
    expect(
      giftSummary([
        {
          id: "gift-a",
          kind: "Received",
          personName: "Asha",
          itemName: "Cash",
          valuePaise: 10_000,
          thankedStatus: "Done",
          returnGiftStatus: "Pending",
        },
        {
          id: "gift-b",
          kind: "Received",
          personName: "Ravi",
          itemName: "Dinner set",
          thankedStatus: "Pending",
          returnGiftStatus: "Done",
        },
      ]),
    ).toEqual({ total: 2, totalValuePaise: 10_000 });
  });

  it("uses paise exactly for paid and outstanding totals", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        title: "Venue",
        categoryId: "venue",
        createdAt: "2026-07-23T10:00:00.000Z",
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

  it("treats Monday through Sunday as the current planning week", () => {
    const wednesday = "2026-07-15";

    expect(isDateInCurrentWeek("2026-07-13", wednesday)).toBe(true);
    expect(isDateInCurrentWeek("2026-07-19", wednesday)).toBe(true);
    expect(isDateInCurrentWeek("2026-07-12", wednesday)).toBe(false);
    expect(isDateInCurrentWeek("2026-07-20", wednesday)).toBe(false);
  });

  it("counts today's, overdue, and completed tasks without double counting inactive work", () => {
    const tasks: Task[] = [
      {
        id: "today",
        title: "Today",
        dueDate: "2026-07-15",
        priority: "High",
        status: "Not Started",
        checklist: [],
        attachments: [],
      },
      {
        id: "overdue",
        title: "Overdue",
        dueDate: "2026-07-14",
        priority: "Medium",
        status: "In Progress",
        checklist: [],
        attachments: [],
      },
      {
        id: "completed-overdue",
        title: "Completed",
        dueDate: "2026-07-10",
        priority: "Low",
        status: "Completed",
        checklist: [],
        attachments: [],
      },
      {
        id: "cancelled-today",
        title: "Cancelled",
        dueDate: "2026-07-15",
        priority: "Low",
        status: "Cancelled",
        checklist: [],
        attachments: [],
      },
    ];

    expect(taskSummary(tasks, "2026-07-15")).toEqual({
      completed: 1,
      overdue: 1,
      today: 1,
    });
  });

  it("matches High and Critical tasks in the urgent priority preset", () => {
    const tasks: Task[] = [
      {
        id: "high",
        title: "High",
        priority: "High",
        status: "Not Started",
        checklist: [],
        attachments: [],
      },
      {
        id: "critical",
        title: "Critical",
        priority: "Critical",
        status: "Not Started",
        checklist: [],
        attachments: [],
      },
      {
        id: "medium",
        title: "Medium",
        priority: "Medium",
        status: "Not Started",
        checklist: [],
        attachments: [],
      },
    ];

    expect(
      filterTasks(tasks, { ...emptyTaskFilters(), priority: "Urgent" }, "2026-07-15").map(
        (task) => task.id,
      ),
    ).toEqual(["high", "critical"]);
  });

  it("selects the first ordered event on the editable wedding date", () => {
    const events: WeddingEvent[] = [
      {
        id: "later",
        name: "Family gathering",
        date: "2026-12-14",
        sortOrder: 2,
        requiredItems: [],
      },
      { id: "other", name: "Welcome dinner", date: "2026-12-13", sortOrder: 0, requiredItems: [] },
      { id: "anchor", name: "Wedding day", date: "2026-12-14", sortOrder: 1, requiredItems: [] },
    ];

    expect(weddingDateEvent(events, "2026-12-14")?.id).toBe("anchor");
  });

  it("combines status, event, due-window, and urgent-priority filters", () => {
    const tasks: Task[] = [
      {
        id: "match",
        title: "Matching task",
        eventId: "event-wedding",
        dueDate: "2026-07-16",
        priority: "Critical",
        status: "In Progress",
        checklist: [],
        attachments: [],
      },
      {
        id: "wrong-event",
        title: "Wrong event",
        eventId: "event-haldi",
        dueDate: "2026-07-16",
        priority: "Critical",
        status: "In Progress",
        checklist: [],
        attachments: [],
      },
      {
        id: "wrong-priority",
        title: "Wrong priority",
        eventId: "event-wedding",
        dueDate: "2026-07-16",
        priority: "Medium",
        status: "In Progress",
        checklist: [],
        attachments: [],
      },
    ];

    expect(
      filterTasks(
        tasks,
        {
          dueWindow: "This Week",
          eventId: "event-wedding",
          overdueOnly: false,
          priority: "Urgent",
          status: "In Progress",
        },
        "2026-07-15",
      ).map((task) => task.id),
    ).toEqual(["match"]);
  });
});
