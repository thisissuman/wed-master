import { z } from "zod";

import type { WorkspaceSnapshot } from "../types";
import { createDataOnlySnapshot, parseOrMigrateWorkspaceSnapshot } from "../workspace-schema";

export const maximumBackupBytes = 5 * 1024 * 1024;

const backupEnvelopeSchema = z
  .object({
    format: z.literal("mangalya-data-backup"),
    exportedAt: z.string().datetime(),
    attachmentsIncluded: z.literal(false),
    workspace: z.unknown(),
  })
  .strict();

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}

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
  if (utf8ByteLength(text) > maximumBackupBytes) {
    throw new Error("Mangalya backups must be 5 MB or smaller.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (typeof parsed === "object" && parsed !== null && "workspace" in parsed) {
    const envelope = backupEnvelopeSchema.safeParse(parsed);
    if (!envelope.success) {
      throw new Error("This backup is not a supported Mangalya workspace file.");
    }
    return createDataOnlySnapshot(parseOrMigrateWorkspaceSnapshot(envelope.data.workspace));
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
  const rows = [
    csvLine(["Title", "Category", "Amount INR", "Expense Date", "Notes", "Attachment Name"]),
    ...snapshot.expenses.map((expense) =>
      csvLine([
        expense.title,
        categories.get(expense.categoryId),
        rupees(expense.actualPaise),
        expense.date,
        expense.notes,
        expense.receipt?.name,
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
      "RSVP",
      "Invitation",
      "Accommodation",
      "Transport",
      "Notes",
    ]),
    ...snapshot.households.map((household) =>
      csvLine([
        household.name,
        household.side,
        household.guestCount ?? household.guests.length,
        household.rsvpStatus,
        household.invitationStatus,
        household.accommodationStatus,
        household.transportStatus,
        household.notes,
      ]),
    ),
  ];
  return `\uFEFF${rows.join("\n")}`;
}
