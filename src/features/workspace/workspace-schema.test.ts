import { demoWorkspace } from "./seed";
import { createDataOnlySnapshot, parseOrMigrateWorkspaceSnapshot } from "./workspace-schema";
import { coreBudgetCategories } from "./expense-categories";
import { selectRecentExpenses } from "./selectors";
import type { WorkspaceSnapshotV1, WorkspaceSnapshotV2, WorkspaceSnapshotV3 } from "./types";

function workspaceV2(): WorkspaceSnapshotV2 {
  return {
    ...structuredClone(demoWorkspace),
    version: 2,
    categories: demoWorkspace.categories.map(({ id, name, sortOrder }) => ({
      id,
      name,
      sortOrder,
    })),
    expenses: demoWorkspace.expenses.map(({ createdAt: _createdAt, ...expense }) => ({
      ...expense,
      paidPaise: expense.paidPaise ?? 0,
      paymentStatus: expense.paymentStatus ?? "Not Paid",
    })),
    gifts: demoWorkspace.gifts.map((gift) => ({
      ...gift,
      kind: gift.kind ?? "Received",
      itemName: gift.itemName ?? "Gift",
      thankedStatus: gift.thankedStatus ?? "Pending",
      returnGiftStatus: gift.returnGiftStatus ?? "Pending",
    })),
    households: demoWorkspace.households.map(
      ({ rsvpStatus: _rsvpStatus, ...household }) => household,
    ),
  };
}

describe("workspace snapshot v4", () => {
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

    expect(migrated.version).toBe(4);
    expect(migrated.tasks[0]?.title).toBe("Confirm dinner");
    expect(migrated.tasks[0]?.checklist).toEqual([]);
    expect(migrated.events[0]?.requiredItems).toEqual([]);
    expect(migrated.households).toEqual([]);
    expect(migrated.categories.find((category) => category.id === "food")).toMatchObject({
      archived: true,
      iconKey: "event",
      name: "Food",
    });
    expect(
      migrated.categories.filter((category) => !category.archived).map(({ name }) => name),
    ).toEqual(coreBudgetCategories.map(({ name }) => name));
    expect(migrated.expenses[0]?.createdAt).toBe("1970-01-01T00:00:00.000Z");
  });

  it("migrates v2 categories and gives legacy expenses deterministic creation times", () => {
    const previous = workspaceV2();
    const migrated = parseOrMigrateWorkspaceSnapshot(previous);

    expect(migrated.version).toBe(4);
    expect(migrated.categories.filter((category) => !category.archived)).toHaveLength(7);
    expect(migrated.expenses.map((expense) => expense.createdAt)).toEqual(
      previous.expenses.map((_, index) => new Date(index).toISOString()),
    );
    expect(selectRecentExpenses(migrated.expenses)[0]?.id).toBe(previous.expenses.at(-1)?.id);
  });

  it("migrates v3 households conservatively while preserving legacy detail", () => {
    const previous: WorkspaceSnapshotV3 = {
      ...structuredClone(demoWorkspace),
      version: 3,
      households: demoWorkspace.households.map(({ rsvpStatus: _rsvpStatus, ...household }) =>
        structuredClone(household),
      ),
      gifts: demoWorkspace.gifts.map((gift) => ({
        ...structuredClone(gift),
        kind: gift.kind ?? "Received",
        itemName: gift.itemName ?? "Gift",
        thankedStatus: gift.thankedStatus ?? "Pending",
        returnGiftStatus: gift.returnGiftStatus ?? "Pending",
      })),
    };

    const migrated = parseOrMigrateWorkspaceSnapshot(previous);

    expect(migrated.version).toBe(4);
    expect(migrated.households.map((household) => household.rsvpStatus)).toEqual([
      "Pending",
      "Confirmed",
      "Pending",
    ]);
    expect(migrated.households[0]?.guests[0]?.name).toBe("Rajesh Patnaik");
    expect(migrated.events.find((event) => event.name === "Mehendi")?.requiredItems).not.toEqual(
      [],
    );
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

  it("keeps hidden legacy guest names without blocking a smaller household count", () => {
    const snapshot = structuredClone(demoWorkspace);
    if (snapshot.households[0]) snapshot.households[0].guestCount = 1;

    const parsed = parseOrMigrateWorkspaceSnapshot(snapshot);

    expect(parsed.households[0]?.guestCount).toBe(1);
    expect(parsed.households[0]?.guests).toHaveLength(3);
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
    expect(() => parseOrMigrateWorkspaceSnapshot({ ...demoWorkspace, version: 5 })).toThrow(
      "not a supported Mangalya workspace file",
    );
  });

  it("rejects duplicate IDs and invalid cross-record references", () => {
    const duplicate = structuredClone(demoWorkspace);
    if (duplicate.events[1] && duplicate.events[0]) {
      duplicate.events[1].id = duplicate.events[0].id;
    }
    expect(() => parseOrMigrateWorkspaceSnapshot(duplicate)).toThrow(
      "not a supported Mangalya workspace file",
    );

    const missingCategory = structuredClone(demoWorkspace);
    if (missingCategory.expenses[0]) missingCategory.expenses[0].categoryId = "missing";
    expect(() => parseOrMigrateWorkspaceSnapshot(missingCategory)).toThrow(
      "not a supported Mangalya workspace file",
    );
  });

  it("rejects invalid payment, checklist, time, and linked-task date invariants", () => {
    const invalidPayment = structuredClone(demoWorkspace);
    if (invalidPayment.expenses[0]) {
      invalidPayment.expenses[0].paidPaise = invalidPayment.expenses[0].actualPaise;
      invalidPayment.expenses[0].paymentStatus = "Not Paid";
    }
    expect(() => parseOrMigrateWorkspaceSnapshot(invalidPayment)).toThrow();

    const invalidChecklist = structuredClone(demoWorkspace);
    const item = invalidChecklist.events.flatMap((event) => event.requiredItems)[0];
    if (item) item.completed = item.total + 1;
    expect(() => parseOrMigrateWorkspaceSnapshot(invalidChecklist)).toThrow();

    const invalidTime = structuredClone(demoWorkspace);
    if (invalidTime.events[0]) {
      invalidTime.events[0].time = "12:00";
      invalidTime.events[0].endTime = "11:00";
    }
    expect(() => parseOrMigrateWorkspaceSnapshot(invalidTime)).toThrow();

    const invalidDueDate = structuredClone(demoWorkspace);
    const linkedTask = invalidDueDate.tasks.find((task) => task.eventId);
    const linkedEvent = invalidDueDate.events.find((event) => event.id === linkedTask?.eventId);
    if (linkedTask && linkedEvent) linkedTask.dueDate = "2099-12-31";
    expect(() => parseOrMigrateWorkspaceSnapshot(invalidDueDate)).toThrow();
  });
});
