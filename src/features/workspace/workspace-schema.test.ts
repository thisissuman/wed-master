import { demoWorkspace } from "./seed";
import { createDataOnlySnapshot, parseOrMigrateWorkspaceSnapshot } from "./workspace-schema";
import type { WorkspaceSnapshotV1 } from "./types";

describe("workspace snapshot v2", () => {
  it("migrates v1 records without changing existing values", () => {
    const legacy: WorkspaceSnapshotV1 = {
      version: 1,
      wedding: {
        id: "wedding",
        name: "A & B",
        type: "Custom wedding",
        date: "2026-12-14",
        location: "Odisha",
        currency: "INR",
      },
      events: [{ id: "event", name: "Family dinner", date: "2026-12-13", sortOrder: 0 }],
      tasks: [{ id: "task", title: "Confirm dinner", priority: "High", status: "Not Started" }],
      categories: [{ id: "food", name: "Food", sortOrder: 0 }],
      expenses: [
        {
          id: "expense",
          title: "Dinner",
          categoryId: "food",
          actualPaise: 10000,
          paidPaise: 0,
          paymentStatus: "Not Paid",
        },
      ],
    };

    const migrated = parseOrMigrateWorkspaceSnapshot(legacy);

    expect(migrated.version).toBe(2);
    expect(migrated.tasks[0]?.title).toBe("Confirm dinner");
    expect(migrated.tasks[0]?.checklist).toEqual([]);
    expect(migrated.events[0]?.requiredItems).toEqual([]);
    expect(migrated.households).toEqual([]);
  });

  it("accepts an optional local cover URI without requiring a snapshot migration", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.coverPhotoUri = "file:///documents/mangalya/cover-photos/cover.jpg";
    if (snapshot.events[0]) {
      snapshot.events[0].coverPhotoUri = "file:///documents/mangalya/cover-photos/event-cover.jpg";
    }

    expect(parseOrMigrateWorkspaceSnapshot(snapshot).wedding.coverPhotoUri).toBe(
      snapshot.wedding.coverPhotoUri,
    );
    expect(parseOrMigrateWorkspaceSnapshot(snapshot).events[0]?.coverPhotoUri).toBe(
      snapshot.events[0]?.coverPhotoUri,
    );
    delete snapshot.wedding.coverPhotoUri;
    expect(parseOrMigrateWorkspaceSnapshot(snapshot).wedding.coverPhotoUri).toBeUndefined();
  });

  it("excludes local media references and history from data-only backups", () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.coverPhotoUri = "file:///documents/mangalya/cover-photos/cover.jpg";
    if (snapshot.events[0]) {
      snapshot.events[0].coverPhotoUri = "file:///documents/mangalya/cover-photos/event-cover.jpg";
    }
    snapshot.tasks[0]?.attachments.push({
      id: "file",
      name: "receipt.pdf",
      uri: "file:///receipt.pdf",
      mimeType: "application/pdf",
      size: 100,
      createdAt: "2026-07-15T00:00:00.000Z",
    });
    const exported = createDataOnlySnapshot(snapshot);
    expect(exported.wedding.coverPhotoUri).toBeUndefined();
    expect(exported.events[0]?.coverPhotoUri).toBeUndefined();
    expect(exported.tasks[0]?.attachments).toEqual([]);
    expect(exported.backupHistory).toEqual([]);
  });

  it("rejects unsupported future versions", () => {
    expect(() => parseOrMigrateWorkspaceSnapshot({ ...demoWorkspace, version: 3 })).toThrow(
      "not a supported Mangalya workspace file",
    );
  });
});
