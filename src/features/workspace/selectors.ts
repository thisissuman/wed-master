import { todayDateOnly, toDateOnly } from "@/lib/dates";

import type {
  Expense,
  GiftKind,
  GiftRecord,
  Household,
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
      paidPaise: totals.paidPaise + expense.paidPaise,
      outstandingPaise: totals.outstandingPaise + (expense.actualPaise - expense.paidPaise),
    }),
    { estimatedPaise: 0, actualPaise: 0, paidPaise: 0, outstandingPaise: 0 },
  );

export type HomeBudgetSummary = ReturnType<typeof homeBudgetSummary>;

export function homeBudgetSummary(snapshot: WorkspaceSnapshot) {
  const totals = expenseTotals(snapshot.expenses);
  const positiveTarget = (snapshot.wedding.budgetTargetPaise ?? 0) > 0;
  const positiveEstimates = totals.estimatedPaise > 0;
  const plannedPaise = positiveTarget
    ? (snapshot.wedding.budgetTargetPaise ?? 0)
    : positiveEstimates
      ? totals.estimatedPaise
      : 0;
  const plannedSource = positiveTarget ? "target" : positiveEstimates ? "estimates" : "none";
  const percentage = plannedPaise > 0 ? (totals.actualPaise / plannedPaise) * 100 : undefined;

  return {
    ...totals,
    overBudgetPaise: plannedPaise > 0 ? Math.max(0, totals.actualPaise - plannedPaise) : 0,
    percentage,
    plannedPaise,
    plannedSource,
  } as const;
}
export const categoryTotals = (snapshot: WorkspaceSnapshot, categoryId: string) =>
  expenseTotals(snapshot.expenses.filter((expense) => expense.categoryId === categoryId));

export const householdGuestCount = (household: Household) =>
  household.guestCount ?? household.guests.length;

export function householdSummary(households: Household[]) {
  const allGuests = households.flatMap((household) => household.guests);
  return {
    households: households.length,
    invited: households
      .filter((household) => household.invitationStatus !== "Not Sent")
      .reduce((sum, household) => sum + householdGuestCount(household), 0),
    confirmed: allGuests.filter((guest) => guest.rsvpStatus === "Confirmed").length,
    stayBooked: households
      .filter((household) => household.accommodationStatus === "Booked")
      .reduce((sum, household) => sum + householdGuestCount(household), 0),
    transportBooked: households
      .filter((household) => household.transportStatus === "Booked")
      .reduce((sum, household) => sum + householdGuestCount(household), 0),
  };
}

export function filterHouseholds(
  households: Household[],
  filters: { query: string; side: string; status: string },
) {
  const query = filters.query.trim().toLowerCase();
  return households.filter((household) => {
    const sideMatches = filters.side === "all" || household.side === filters.side;
    const statusMatches =
      filters.status === "all" ||
      household.guests.some((guest) => guest.rsvpStatus === filters.status);
    const searchMatches =
      !query ||
      household.name.toLowerCase().includes(query) ||
      household.guests.some((guest) => guest.name.toLowerCase().includes(query));
    return sideMatches && statusMatches && searchMatches;
  });
}

export function giftSummary(gifts: GiftRecord[]) {
  return {
    total: gifts.length,
    totalValuePaise: gifts.reduce((sum, gift) => sum + (gift.valuePaise ?? 0), 0),
    thanked: gifts.filter((gift) => gift.thankedStatus === "Done").length,
    returned: gifts.filter((gift) => gift.returnGiftStatus === "Done").length,
  };
}

export function selectAndSortGifts(
  gifts: GiftRecord[],
  kind: GiftKind,
  sort: "name" | "recent" | "value",
) {
  return gifts
    .filter((gift) => gift.kind === kind)
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
