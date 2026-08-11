import { demoWorkspace } from "../seed";
import {
  expensesCsv,
  guestsCsv,
  maximumBackupBytes,
  parseDataBackup,
  serializeDataBackup,
} from "./backup-data";

describe("workspace backup data", () => {
  it("serializes a data-only v3 backup and restores it", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.coverPhotoUri = "file:///documents/mangalya/cover-photos/cover.jpg";
    if (snapshot.events[0]) {
      snapshot.events[0].coverPhotoUri = "file:///documents/mangalya/cover-photos/event-cover.jpg";
    }
    const text = serializeDataBackup(snapshot, "2026-07-15T12:00:00.000Z");
    const restored = parseDataBackup(text);

    expect(restored.version).toBe(4);
    expect(restored.wedding.name).toBe(demoWorkspace.wedding.name);
    expect(restored.wedding.coverPhotoUri).toBeUndefined();
    expect(restored.events[0]?.coverPhotoUri).toBeUndefined();
    expect(restored.tasks.every((task) => task.attachments.length === 0)).toBe(true);
    expect(restored.backupHistory).toEqual([]);
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
    expect(() => parseDataBackup('{"version":99}')).toThrow(
      "not a supported Mangalya workspace file",
    );
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
    ).toThrow("not a supported Mangalya workspace file");

    expect(() => parseDataBackup(" ".repeat(maximumBackupBytes + 1))).toThrow("5 MB or smaller");
  });
});
