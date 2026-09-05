import { z } from "zod";

import { BackupFileTooLargeError, InvalidBackupError } from "@/lib/errors";
import { utf8ByteLength } from "@/lib/storage/utf8-byte-length";

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
    throw new BackupFileTooLargeError();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new InvalidBackupError(error);
  }

  try {
    if (typeof parsed === "object" && parsed !== null && "workspace" in parsed) {
      const envelope = backupEnvelopeSchema.safeParse(parsed);
      if (!envelope.success) throw new InvalidBackupError(envelope.error);
      return createDataOnlySnapshot(parseOrMigrateWorkspaceSnapshot(envelope.data.workspace));
    }
    return createDataOnlySnapshot(parseOrMigrateWorkspaceSnapshot(parsed));
  } catch (error) {
    if (error instanceof InvalidBackupError) throw error;
    throw new InvalidBackupError(error);
  }
}

const LEADING_CONTROL_PATTERN =
  /^[\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]*[\u0000-\u001f\u007f-\u009f]/u;
const FORMULA_PREFIX_PATTERN =
  /^[\u0000-\u0020\u007f-\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]*[=+\-@\uff0b\uff0d\uff1d\uff20]/u;

export function neutralizeCsvFormula(value: string): string {
  return LEADING_CONTROL_PATTERN.test(value) || FORMULA_PREFIX_PATTERN.test(value)
    ? `'${value}`
    : value;
}

function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  return `"${neutralizeCsvFormula(text).replace(/"/g, '""')}"`;
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
