import type { WorkspaceSnapshot } from "../types";
import { createDataOnlySnapshot, parseOrMigrateWorkspaceSnapshot } from "../workspace-schema";

export function serializeDataBackup(snapshot: WorkspaceSnapshot, exportedAt: string): string {
  return JSON.stringify(
    {
      format: "mangalya-data-backup",
      exportedAt,
      attachmentsIncluded: false,
      workspace: createDataOnlySnapshot(snapshot),
    },
    null,
    2,
  );
}

export function parseDataBackup(text: string): WorkspaceSnapshot {
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed === "object" && parsed !== null && "workspace" in parsed) {
    return createDataOnlySnapshot(parseOrMigrateWorkspaceSnapshot(parsed.workspace));
  }
  return createDataOnlySnapshot(parseOrMigrateWorkspaceSnapshot(parsed));
}

function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function csvLine(values: (string | number | undefined)[]): string {
  return values.map(csvCell).join(",");
}

function rupees(paise?: number): string {
  return paise === undefined ? "" : (paise / 100).toFixed(2);
}

export function expensesCsv(snapshot: WorkspaceSnapshot): string {
  const categories = new Map(snapshot.categories.map((category) => [category.id, category.name]));
  const events = new Map(snapshot.events.map((event) => [event.id, event.name]));
  const rows = [
    csvLine([
      "Title",
      "Category",
      "Planned INR",
      "Amount INR",
      "Paid INR",
      "Status",
      "Date",
      "Event",
      "Vendor",
      "Notes",
    ]),
    ...snapshot.expenses.map((expense) =>
      csvLine([
        expense.title,
        categories.get(expense.categoryId),
        rupees(expense.estimatedPaise),
        rupees(expense.actualPaise),
        rupees(expense.paidPaise),
        expense.paymentStatus,
        expense.date,
        expense.eventId ? events.get(expense.eventId) : undefined,
        expense.vendorName,
        expense.notes,
      ]),
    ),
  ];
  return `\uFEFF${rows.join("\n")}`;
}

export function tasksCsv(snapshot: WorkspaceSnapshot): string {
  const events = new Map(snapshot.events.map((event) => [event.id, event.name]));
  const rows = [
    csvLine([
      "Task",
      "Event",
      "Due date",
      "Priority",
      "Status",
      "Responsible",
      "Category",
      "Notes",
    ]),
    ...snapshot.tasks.map((task) =>
      csvLine([
        task.title,
        task.eventId ? events.get(task.eventId) : undefined,
        task.dueDate,
        task.priority,
        task.status,
        task.responsiblePerson,
        task.category,
        task.notes,
      ]),
    ),
  ];
  return `\uFEFF${rows.join("\n")}`;
}

export function guestsCsv(snapshot: WorkspaceSnapshot): string {
  const rows = [
    csvLine([
      "Household",
      "Side",
      "Guest count",
      "Guest",
      "RSVP",
      "Invitation",
      "Accommodation",
      "Transport",
      "Notes",
    ]),
    ...snapshot.households.flatMap((household) => {
      const guests = household.guests.length ? household.guests : [undefined];
      return guests.map((guest) =>
        csvLine([
          household.name,
          household.side,
          household.guestCount ?? household.guests.length,
          guest?.name,
          guest?.rsvpStatus,
          household.invitationStatus,
          household.accommodationStatus,
          household.transportStatus,
          household.notes,
        ]),
      );
    }),
  ];
  return `\uFEFF${rows.join("\n")}`;
}
