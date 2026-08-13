import { todayDateOnly, toDateOnly } from "@/lib/dates";

import type {
  BudgetCategoryIconKey,
  Expense,
  GiftKind,
  GiftRecord,
  Household,
  ISODate,
  Task,
  TaskPriority,
  TaskStatus,
  WeddingEvent,
  WorkspaceSnapshot,
} from "./types";

export type TaskFilterState = {
  dueWindow: "All" | "This Week";
  eventId: string;
  overdueOnly: boolean;
  priority: TaskPriority | "All" | "Urgent";
  status: TaskStatus | "All";
};

export const emptyTaskFilters = (): TaskFilterState => ({
  dueWindow: "All",
  eventId: "All",
  overdueOnly: false,
  priority: "All",
  status: "All",
});

export const isOverdue = (date?: string, today = todayDateOnly()) => Boolean(date && date < today);
export const activeTasks = (tasks: Task[]) => tasks.filter((task) => task.status !== "Cancelled");
export const completedTaskCount = (tasks: Task[]) =>
  tasks.filter((task) => task.status === "Completed").length;
export const taskProgress = (tasks: Task[]) => {
  const active = activeTasks(tasks);
  return { completed: completedTaskCount(active), total: active.length };
};

export function taskProgressByEvent(tasks: Task[]) {
  return tasks.reduce<Map<string, { completed: number; total: number }>>((progress, task) => {
    if (!task.eventId || task.status === "Cancelled") return progress;
    const current = progress.get(task.eventId) ?? { completed: 0, total: 0 };
    current.total += 1;
    if (task.status === "Completed") current.completed += 1;
    progress.set(task.eventId, current);
    return progress;
  }, new Map());
}

const homePriorityOrder: Record<TaskPriority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};
const latestTaskDate = "9999-12-31";

const homeDueBucket = (task: Task, today: string) => {
  if (isOverdue(task.dueDate, today)) return 0;
  if (task.dueDate === today) return 1;
  return 2;
};

export function selectHomeNextActions(tasks: Task[], today = todayDateOnly(), limit = 2) {
  return [...tasks]
    .filter((task) => task.status !== "Completed" && task.status !== "Cancelled")
    .sort((left, right) => {
      const dueBucket = homeDueBucket(left, today) - homeDueBucket(right, today);
      if (dueBucket) return dueBucket;

      const priority = homePriorityOrder[left.priority] - homePriorityOrder[right.priority];
      if (priority) return priority;

      const dueDate = (left.dueDate ?? latestTaskDate).localeCompare(
        right.dueDate ?? latestTaskDate,
      );
      if (dueDate) return dueDate;

      return left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
    })
    .slice(0, Math.max(0, limit));
}

export function taskSummary(tasks: Task[], today = todayDateOnly()) {
  return tasks.reduce(
    (summary, task) => {
      if (task.status === "Completed") summary.completed += 1;
      if (task.status === "Completed" || task.status === "Cancelled") return summary;
      if (task.dueDate === today) summary.today += 1;
      if (isOverdue(task.dueDate, today)) summary.overdue += 1;
      return summary;
    },
    { completed: 0, overdue: 0, today: 0 },
  );
}

export function isDateInCurrentWeek(date: string | undefined, today = todayDateOnly()) {
  if (!date) return false;
  const current = new Date(`${today}T12:00:00`);
  const dayFromMonday = (current.getDay() + 6) % 7;
  const start = new Date(current);
  start.setDate(current.getDate() - dayFromMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return date >= toDateOnly(start) && date <= toDateOnly(end);
}

export function filterTasks(tasks: Task[], filters: TaskFilterState, today = todayDateOnly()) {
  return tasks
    .filter((task) => filters.status === "All" || task.status === filters.status)
    .filter((task) => {
      if (filters.priority === "All") return true;
      if (filters.priority === "Urgent") {
        return task.priority === "High" || task.priority === "Critical";
      }
      return task.priority === filters.priority;
    })
    .filter((task) => filters.eventId === "All" || (task.eventId ?? "") === filters.eventId)
    .filter(
      (task) =>
        !filters.overdueOnly ||
        (task.status !== "Completed" &&
          task.status !== "Cancelled" &&
          isOverdue(task.dueDate, today)),
    )
    .filter((task) => filters.dueWindow === "All" || isDateInCurrentWeek(task.dueDate, today));
}

export function taskFilterCount(filters: TaskFilterState) {
  return [
    filters.status !== "All",
    filters.priority !== "All",
    filters.eventId !== "All",
    filters.overdueOnly,
    filters.dueWindow !== "All",
  ].filter(Boolean).length;
}

export function weddingDateEvent(events: WeddingEvent[], weddingDate: string) {
  return [...events]
    .filter((event) => event.date === weddingDate)
    .sort((left, right) => left.sortOrder - right.sortOrder)[0];
}
export const expenseTotals = (expenses: Expense[]) =>
  expenses.reduce(
    (totals, expense) => ({
      estimatedPaise: totals.estimatedPaise + (expense.estimatedPaise ?? 0),
      actualPaise: totals.actualPaise + expense.actualPaise,
      paidPaise: totals.paidPaise + (expense.paidPaise ?? 0),
      outstandingPaise:
        totals.outstandingPaise + Math.max(0, expense.actualPaise - (expense.paidPaise ?? 0)),
    }),
    { estimatedPaise: 0, actualPaise: 0, paidPaise: 0, outstandingPaise: 0 },
  );

export type HomeBudgetSummary = ReturnType<typeof homeBudgetSummary>;

export function homeBudgetSummary(snapshot: WorkspaceSnapshot) {
  const spentPaise = snapshot.expenses.reduce((sum, expense) => sum + expense.actualPaise, 0);
  const targetPaise = snapshot.wedding.budgetTargetPaise;
  const hasTarget = targetPaise !== undefined && targetPaise > 0;
  const differencePaise = hasTarget ? targetPaise - spentPaise : undefined;
  const percentage = hasTarget ? (spentPaise / targetPaise) * 100 : undefined;

  return {
    actualPaise: spentPaise,
    overBudgetPaise: differencePaise === undefined ? 0 : Math.max(0, -differencePaise),
    percentage,
    remainingPaise: differencePaise,
    spentPaise,
    targetPaise: hasTarget ? targetPaise : undefined,
  } as const;
}
export const categoryTotals = (snapshot: WorkspaceSnapshot, categoryId: string) =>
  expenseTotals(snapshot.expenses.filter((expense) => expense.categoryId === categoryId));

export function selectRecentExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort(
    (left, right) =>
      right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id),
  );
}

export type ExpenseDateGroup = {
  date?: Expense["date"];
  expenses: Expense[];
};

export function selectExpenseDateGroups(expenses: Expense[]): ExpenseDateGroup[] {
  const groups = new Map<string, Expense[]>();
  for (const expense of selectRecentExpenses(expenses)) {
    const key = expense.date ?? "";
    const group = groups.get(key) ?? [];
    group.push(expense);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (!left) return 1;
      if (!right) return -1;
      return right.localeCompare(left);
    })
    .map(([date, groupedExpenses]) => ({
      date: (date || undefined) as Expense["date"],
      expenses: groupedExpenses,
    }));
}

const normalizeExpenseTitle = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");

export type ExpenseTitleSuggestion = Pick<Expense, "categoryId" | "title">;

export function selectExpenseTitleSuggestions(
  expenses: Expense[],
  query: string,
  limit = 5,
): ExpenseTitleSuggestion[] {
  const normalizedQuery = normalizeExpenseTitle(query);
  if (!normalizedQuery) return [];

  const matches = selectRecentExpenses(expenses)
    .map((expense) => ({ expense, normalizedTitle: normalizeExpenseTitle(expense.title) }))
    .filter(({ normalizedTitle }) => normalizedTitle.includes(normalizedQuery))
    .sort((left, right) => {
      const leftPrefix = left.normalizedTitle.startsWith(normalizedQuery) ? 0 : 1;
      const rightPrefix = right.normalizedTitle.startsWith(normalizedQuery) ? 0 : 1;
      return leftPrefix - rightPrefix;
    });
  const seen = new Set<string>();
  const suggestions: ExpenseTitleSuggestion[] = [];

  for (const match of matches) {
    if (seen.has(match.normalizedTitle)) continue;
    seen.add(match.normalizedTitle);
    suggestions.push({ categoryId: match.expense.categoryId, title: match.expense.title });
    if (suggestions.length >= Math.max(0, limit)) break;
  }
  return suggestions;
}

const categoryOrder: BudgetCategoryIconKey[] = [
  "event",
  "task",
  "shopping",
  "commute",
  "gift",
  "advance",
  "other",
];

export type CategorySpending = {
  actualPaise: number;
  iconKey: BudgetCategoryIconKey;
  percentage: number;
};

export function categorySpending(snapshot: WorkspaceSnapshot): CategorySpending[] {
  const categories = new Map(snapshot.categories.map((category) => [category.id, category]));
  const totals = snapshot.expenses.reduce<Map<BudgetCategoryIconKey, number>>((result, expense) => {
    const iconKey = categories.get(expense.categoryId)?.iconKey ?? "other";
    result.set(iconKey, (result.get(iconKey) ?? 0) + expense.actualPaise);
    return result;
  }, new Map());
  const spent = [...totals.values()].reduce((sum, amount) => sum + amount, 0);

  return categoryOrder
    .map((iconKey) => {
      const actualPaise = totals.get(iconKey) ?? 0;
      return {
        actualPaise,
        iconKey,
        percentage: spent > 0 ? (actualPaise / spent) * 100 : 0,
      };
    })
    .filter((item) => item.actualPaise > 0)
    .sort(
      (left, right) =>
        right.actualPaise - left.actualPaise ||
        categoryOrder.indexOf(left.iconKey) - categoryOrder.indexOf(right.iconKey),
    );
}

export const spendingTrendRanges = ["30d", "90d", "all"] as const;
export type SpendingTrendRange = (typeof spendingTrendRanges)[number];

export type SpendingTrendPoint = {
  actualPaise: number;
  endDate: ISODate;
  expenseCount: number;
  startDate: ISODate;
};

function dateOnlyDaysBefore(value: string, days: number): ISODate {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() - days);
  return toDateOnly(date) as ISODate;
}

export function selectDailySpending(
  expenses: Expense[],
  range: SpendingTrendRange,
  today = todayDateOnly(),
): SpendingTrendPoint[] {
  const startDate =
    range === "30d"
      ? dateOnlyDaysBefore(today, 29)
      : range === "90d"
        ? dateOnlyDaysBefore(today, 89)
        : undefined;
  const totals = expenses.reduce<Map<ISODate, { actualPaise: number; expenseCount: number }>>(
    (result, expense) => {
      if (
        !expense.date ||
        expense.actualPaise <= 0 ||
        (startDate && (expense.date < startDate || expense.date > today))
      ) {
        return result;
      }
      const current = result.get(expense.date) ?? { actualPaise: 0, expenseCount: 0 };
      current.actualPaise += expense.actualPaise;
      current.expenseCount += 1;
      result.set(expense.date, current);
      return result;
    },
    new Map(),
  );

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, values]) => ({
      ...values,
      endDate: date,
      startDate: date,
    }));
}

export function selectSpendingTrend(
  expenses: Expense[],
  range: SpendingTrendRange,
  today = todayDateOnly(),
  maximumPoints = 10,
): SpendingTrendPoint[] {
  const daily = selectDailySpending(expenses, range, today);
  const pointLimit = Math.max(1, Math.floor(maximumPoints));
  if (daily.length <= pointLimit) return daily;

  const bucketSize = Math.ceil(daily.length / pointLimit);
  const points: SpendingTrendPoint[] = [];
  for (let index = 0; index < daily.length; index += bucketSize) {
    const bucket = daily.slice(index, index + bucketSize);
    const first = bucket[0];
    const last = bucket.at(-1);
    if (!first || !last) continue;
    points.push({
      actualPaise: bucket.reduce((sum, point) => sum + point.actualPaise, 0),
      endDate: last.endDate,
      expenseCount: bucket.reduce((sum, point) => sum + point.expenseCount, 0),
      startDate: first.startDate,
    });
  }
  return points;
}

export const householdGuestCount = (household: Household) =>
  household.guestCount ?? household.guests.length;

export function householdSummary(households: Household[]) {
  return households.reduce(
    (summary, household) => {
      const count = householdGuestCount(household);
      summary.households += 1;
      if (household.invitationStatus !== "Not Sent") summary.invited += count;
      if (household.accommodationStatus === "Booked") summary.stayBooked += count;
      if (household.transportStatus === "Booked") summary.transportBooked += count;
      if (household.rsvpStatus === "Confirmed") summary.confirmed += count;
      return summary;
    },
    { confirmed: 0, households: 0, invited: 0, stayBooked: 0, transportBooked: 0 },
  );
}

export function filterHouseholds(
  households: Household[],
  filters: { query: string; side: string; status: string },
) {
  const query = filters.query.trim().toLowerCase();
  return households.filter((household) => {
    const sideMatches = filters.side === "all" || household.side === filters.side;
    const statusMatches = filters.status === "all" || household.rsvpStatus === filters.status;
    const searchMatches = !query || household.name.toLowerCase().includes(query);
    return sideMatches && statusMatches && searchMatches;
  });
}

export function giftSummary(gifts: GiftRecord[]) {
  return {
    total: gifts.length,
    totalValuePaise: gifts.reduce((sum, gift) => sum + (gift.valuePaise ?? 0), 0),
  };
}

export function selectAndSortGifts(
  gifts: GiftRecord[],
  kind: GiftKind,
  sort: "name" | "recent" | "value",
) {
  return gifts
    .filter((gift) => (gift.kind ?? "Received") === kind)
    .sort((left, right) => {
      if (sort === "value") return (right.valuePaise ?? 0) - (left.valuePaise ?? 0);
      if (sort === "name") return left.personName.localeCompare(right.personName);
      return (right.date ?? "").localeCompare(left.date ?? "");
    });
}

export function linkedVendorNames(expenses: Expense[]) {
  return [
    ...new Set(
      expenses
        .map((expense) => expense.vendorName?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ];
}
