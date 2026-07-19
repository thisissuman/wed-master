import { demoWorkspace } from "../seed";
import { expensesCsv, guestsCsv, parseDataBackup, serializeDataBackup } from "./backup-data";

describe("workspace backup data", () => {
  it("serializes a data-only v2 backup and restores it", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.coverPhotoUri = "file:///documents/mangalya/cover-photos/cover.jpg";
    if (snapshot.events[0]) {
      snapshot.events[0].coverPhotoUri = "file:///documents/mangalya/cover-photos/event-cover.jpg";
    }
    const text = serializeDataBackup(snapshot, "2026-07-15T12:00:00.000Z");
    const restored = parseDataBackup(text);

    expect(restored.version).toBe(2);
    expect(restored.wedding.name).toBe(demoWorkspace.wedding.name);
    expect(restored.wedding.coverPhotoUri).toBeUndefined();
    expect(restored.events[0]?.coverPhotoUri).toBeUndefined();
    expect(restored.tasks.every((task) => task.attachments.length === 0)).toBe(true);
    expect(restored.backupHistory).toEqual([]);
  });

  it("escapes quotes and uses INR decimal values in expense CSV", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.expenses[0] = { ...snapshot.expenses[0], title: 'Venue "advance"' };
    const csv = expensesCsv(snapshot);

    expect(csv).toContain('"Venue ""advance"""');
    expect(csv).toContain('"3600000.00"');
  });

  it("exports household and guest rows", () => {
    const csv = guestsCsv(demoWorkspace);
    expect(csv).toContain('"Guest count"');
    expect(csv).toContain('"Patnaik Family"');
    expect(csv).toContain('"3"');
    expect(csv).toContain('"Rajesh Patnaik"');
  });

  it("does not modify data when import parsing fails", () => {
    expect(() => parseDataBackup('{"version":99}')).toThrow(
      "not a supported Mangalya workspace file",
    );
  });
});
