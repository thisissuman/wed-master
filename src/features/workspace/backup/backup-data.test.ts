import { BackupFileTooLargeError, InvalidBackupError } from "@/lib/errors";
import { utf8ByteLength } from "@/lib/storage/utf8-byte-length";

import { demoWorkspace } from "../seed";
import {
  expensesCsv,
  guestsCsv,
  maximumBackupBytes,
  neutralizeCsvFormula,
  parseDataBackup,
  serializeDataBackup,
  tasksCsv,
} from "./backup-data";

describe("workspace backup data", () => {
  it("serializes a data-only v5 backup and restores it", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.coverPhotoUri = "file:///documents/mangalya/cover-photos/cover.jpg";
    if (snapshot.events[0]) {
      snapshot.events[0].coverPhotoUri = "file:///documents/mangalya/cover-photos/event-cover.jpg";
    }
    const text = serializeDataBackup(snapshot, "2026-07-15T12:00:00.000Z");
    const restored = parseDataBackup(text);

    expect(restored.version).toBe(5);
    expect(restored.wedding.name).toBe(demoWorkspace.wedding.name);
    expect(restored.wedding.coverPhotoUri).toBeUndefined();
    expect(restored.events[0]?.coverPhotoUri).toBeUndefined();
    expect(restored.tasks.every((task) => task.attachments.length === 0)).toBe(true);
    expect(restored.backupHistory).toEqual([]);
    expect(text).not.toContain("inspirations");
    expect(text).not.toContain("inspiration-media");
  });

  it("keeps starter task identity out of reader-facing CSV columns", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.tasks[0] = { ...snapshot.tasks[0], starterTaskKey: "venue" };

    const csv = tasksCsv(snapshot);

    expect(csv).not.toContain("Starter task");
    expect(csv).not.toContain("starterTaskKey");
  });

  it("escapes quotes and uses INR decimal values in expense CSV", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.expenses[0] = {
      ...snapshot.expenses[0],
      title: 'Venue "advance"',
      receipt: {
        id: "receipt",
        name: "venue-receipt.pdf",
        uri: "file:///venue-receipt.pdf",
        mimeType: "application/pdf",
        size: 100,
        createdAt: "2026-07-15T12:00:00.000Z",
      },
    };
    const csv = expensesCsv(snapshot);

    expect(csv).toContain(
      '"Title","Category","Amount INR","Expense Date","Notes","Attachment Name"',
    );
    expect(csv).toContain('"Venue ""advance"""');
    expect(csv).toContain('"3600000.00"');
    expect(csv).toContain('"venue-receipt.pdf"');
    expect(csv).not.toContain("Planned INR");
    expect(csv).not.toContain("Paid INR");
    expect(csv).not.toContain("Vendor");
  });

  it("exports household and guest rows", () => {
    const csv = guestsCsv(demoWorkspace);
    expect(csv).toContain('"Guest count"');
    expect(csv).toContain('"Patnaik Family"');
    expect(csv).toContain('"3"');
    expect(csv).toContain('"Pending"');
  });

  it("does not modify data when import parsing fails", () => {
    expect(() => parseDataBackup('{"version":99}')).toThrow(InvalidBackupError);
    expect(() => parseDataBackup("{not-json")).toThrow(InvalidBackupError);
  });

  it("rejects loosely shaped envelopes and oversized files", () => {
    expect(() =>
      parseDataBackup(
        JSON.stringify({
          format: "wrong-format",
          exportedAt: "2026-07-15T12:00:00.000Z",
          attachmentsIncluded: false,
          workspace: demoWorkspace,
        }),
      ),
    ).toThrow(InvalidBackupError);

    expect(() => parseDataBackup(" ".repeat(maximumBackupBytes + 1))).toThrow(
      BackupFileTooLargeError,
    );
    expect(() => parseDataBackup("अ".repeat(Math.ceil(maximumBackupBytes / 3)))).toThrow(
      BackupFileTooLargeError,
    );
  });

  it("accepts a valid backup whose UTF-8 content is exactly the parser limit", () => {
    const backup = serializeDataBackup(demoWorkspace, "2026-07-15T12:00:00.000Z");
    const padded = `${backup}${" ".repeat(maximumBackupBytes - utf8ByteLength(backup))}`;

    expect(utf8ByteLength(padded)).toBe(maximumBackupBytes);
    expect(parseDataBackup(padded).wedding.name).toBe(demoWorkspace.wedding.name);
  });

  it.each([
    "=2+3",
    "+2+3",
    "-2+3",
    "@SUM(A1:A2)",
    "  =2+3",
    "\u2003=2+3",
    "\u00a0\uff0b2+3",
    "\ufeff\uff0d2+3",
    " \uff1d2+3",
    "\uff20SUM(A1:A2)",
    "\tplain text",
    "\nplain text",
    "\rplain text",
  ])("neutralizes spreadsheet-triggering CSV input %j", (value) => {
    expect(neutralizeCsvFormula(value)).toBe(`'${value}`);
  });

  it("preserves ordinary stored text while safely quoting CSV punctuation and formulas", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.tasks[0] = {
      ...snapshot.tasks[0],
      title: '=Call "venue", today\nor tomorrow',
    };

    const csv = tasksCsv(snapshot);

    expect(snapshot.tasks[0]?.title).toBe('=Call "venue", today\nor tomorrow');
    expect(csv).toContain('"\'=Call ""venue"", today\nor tomorrow"');
  });
});
