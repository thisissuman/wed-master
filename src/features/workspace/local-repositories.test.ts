import {
  StorageWriteError,
  WorkspaceAlreadyExistsError,
  WorkspaceCapacityError,
} from "@/lib/errors";

import {
  LocalWorkspaceStore,
  WorkspaceCorruptionError,
  WorkspaceEmptyError,
  createLocalRepositories,
  emptyWorkspaceStorageKey,
  legacyWorkspaceStorageKey,
  workspaceStorageKey,
  workspaceStorageKeyV2,
  workspaceStorageKeyV3,
  workspaceStorageKeyV4,
} from "./local-repositories";
import { demoWorkspace } from "./seed";

const populatedValues = () =>
  new Map<string, string>([[workspaceStorageKey, JSON.stringify(demoWorkspace)]]);

function oversizedWorkspace() {
  const oversized = structuredClone(demoWorkspace);
  const baseTask = oversized.tasks[0];
  if (!baseTask) throw new Error("Demo workspace needs a task fixture.");
  oversized.tasks = Array.from({ length: 110 }, (_, index) => ({
    ...baseTask,
    attachments: [],
    checklist: [],
    id: `oversized-task-${index}`,
    notes: "अ".repeat(10_000),
    starterTaskKey: undefined,
  }));
  return oversized;
}

describe("local repositories", () => {
  it("treats a brand-new installation as an empty workspace", async () => {
    const storage = {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(async () => undefined),
    };

    await expect(new LocalWorkspaceStore(storage).getSnapshot()).rejects.toBeInstanceOf(
      WorkspaceEmptyError,
    );
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("persists changes through the storage adapter", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));
    await repositories.tasks.createTask({
      title: "Persist me",
      priority: "Low",
      status: "Not Started",
    });
    const reloaded = createLocalRepositories(new LocalWorkspaceStore(storage));
    expect((await reloaded.tasks.listTasks()).some((task) => task.title === "Persist me")).toBe(
      true,
    );
  });

  it("keeps caller and returned replacement snapshots detached from the persisted cache", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const store = new LocalWorkspaceStore(storage);
    const replacement = structuredClone(demoWorkspace);
    const expectedName = replacement.wedding.name;

    const returned = await store.replace(replacement);
    replacement.wedding.name = "Caller mutation";
    returned.wedding.name = "Returned mutation";

    await expect(store.getSnapshot()).resolves.toMatchObject({
      wedding: { name: expectedName },
    });
  });

  it("changes only task status when completing an existing task", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));
    const task = demoWorkspace.tasks[0];
    if (!task) throw new Error("Demo workspace needs a task fixture.");

    await repositories.tasks.updateTaskStatus(task.id, "Completed");

    const updated = (await repositories.tasks.listTasks()).find((item) => item.id === task.id);
    expect(updated).toMatchObject({
      dueDate: task.dueDate,
      status: "Completed",
      title: task.title,
    });
  });

  it("caps export history and returns evicted, individually removed, and cleared entries", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));
    let latestResult: Awaited<ReturnType<(typeof repositories.backup)["addHistory"]>> | undefined;
    for (let index = 0; index < 21; index += 1) {
      latestResult = await repositories.backup.addHistory({
        createdAt: `2026-08-29T10:00:${String(index).padStart(2, "0")}.000Z`,
        fileName: `backup-${index}.json`,
        id: `backup-${index}`,
        kind: "backup",
        sizeBytes: 100,
        uri: `file:///documents/mangalya/exports/backup-${index}.json`,
      });
    }

    expect(latestResult?.snapshot.backupHistory).toHaveLength(20);
    expect(latestResult?.removedEntries.map(({ id }) => id)).toEqual(["backup-0"]);

    const removed = await repositories.backup.removeHistory("backup-10");
    expect(removed.removedEntries.map(({ id }) => id)).toEqual(["backup-10"]);
    expect(removed.snapshot.backupHistory.some(({ id }) => id === "backup-10")).toBe(false);

    const cleared = await repositories.backup.clearHistory();
    expect(cleared.removedEntries).toHaveLength(19);
    expect(cleared.snapshot.backupHistory).toEqual([]);
  });

  it("persists a device-local wedding cover URI in the v3 workspace", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));
    const wedding = await repositories.wedding.getWedding();

    await repositories.wedding.updateWedding({
      ...wedding,
      coverPhotoUri: "file:///documents/mangalya/cover-photos/cover.jpg",
    });

    const reloaded = createLocalRepositories(new LocalWorkspaceStore(storage));
    expect((await reloaded.wedding.getWedding()).coverPhotoUri).toBe(
      "file:///documents/mangalya/cover-photos/cover.jpg",
    );
  });

  it("persists the editable wedding keepsake message", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));
    const wedding = await repositories.wedding.getWedding();

    await repositories.wedding.updateWedding({
      ...wedding,
      keepsakeMessage: "The beginning of our forever.",
    });

    const reloaded = createLocalRepositories(new LocalWorkspaceStore(storage));
    expect((await reloaded.wedding.getWedding()).keepsakeMessage).toBe(
      "The beginning of our forever.",
    );
  });

  it("migrates the legacy key without deleting it", async () => {
    const values = new Map<string, string>([
      [
        legacyWorkspaceStorageKey,
        JSON.stringify({
          version: 1,
          wedding: {
            id: "wedding",
            name: "A & B",
            type: "Custom",
            date: "2026-12-14",
            location: "Odisha",
            currency: "INR",
          },
          events: [],
          tasks: [],
          categories: [],
          expenses: [],
        }),
      ],
    ]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };

    const snapshot = await new LocalWorkspaceStore(storage).getSnapshot();

    expect(snapshot.version).toBe(5);
    expect(snapshot.wedding.name).toBe("A & B");
    expect(values.has(legacyWorkspaceStorageKey)).toBe(true);
    expect(values.has(workspaceStorageKey)).toBe(true);
  });

  it("migrates the v2 key into v5 without deleting the previous key", async () => {
    const previous = {
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
      households: demoWorkspace.households.map(
        ({ rsvpStatus: _rsvpStatus, ...household }) => household,
      ),
      gifts: demoWorkspace.gifts.map((gift) => ({
        ...gift,
        kind: gift.kind ?? "Received",
        itemName: gift.itemName ?? "Gift",
        thankedStatus: gift.thankedStatus ?? "Pending",
        returnGiftStatus: gift.returnGiftStatus ?? "Pending",
      })),
    };
    const values = new Map<string, string>([[workspaceStorageKeyV2, JSON.stringify(previous)]]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };

    const snapshot = await new LocalWorkspaceStore(storage).getSnapshot();

    expect(snapshot.version).toBe(5);
    expect(values.has(workspaceStorageKeyV2)).toBe(true);
    expect(values.has(workspaceStorageKey)).toBe(true);
    expect(snapshot.categories.filter((category) => !category.archived)).toHaveLength(7);
  });

  it("migrates the v4 key into v5 without deleting the previous key", async () => {
    const previous = {
      ...structuredClone(demoWorkspace),
      version: 4,
      tasks: demoWorkspace.tasks.map(({ starterTaskKey: _starterTaskKey, ...task }) => task),
    };
    const values = new Map<string, string>([[workspaceStorageKeyV4, JSON.stringify(previous)]]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };

    const snapshot = await new LocalWorkspaceStore(storage).getSnapshot();

    expect(snapshot.version).toBe(5);
    expect(values.has(workspaceStorageKeyV4)).toBe(true);
    expect(values.has(workspaceStorageKey)).toBe(true);
  });

  it("keeps an existing oversized legacy workspace readable during migration", async () => {
    const previous = {
      ...oversizedWorkspace(),
      version: 4 as const,
      tasks: oversizedWorkspace().tasks.map(({ starterTaskKey: _starterTaskKey, ...task }) => task),
    };
    const values = new Map<string, string>([[workspaceStorageKeyV4, JSON.stringify(previous)]]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };

    await expect(new LocalWorkspaceStore(storage).getSnapshot()).resolves.toMatchObject({
      version: 5,
    });
    expect(values.has(workspaceStorageKey)).toBe(true);
  });

  it("reports legacy migration persistence failures as storage errors", async () => {
    const previous = {
      ...structuredClone(demoWorkspace),
      version: 4 as const,
      tasks: demoWorkspace.tasks.map(({ starterTaskKey: _starterTaskKey, ...task }) => task),
    };
    const values = new Map<string, string>([[workspaceStorageKeyV4, JSON.stringify(previous)]]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async () => {
        throw new Error("Disk full at /private/path");
      }),
    };

    await expect(new LocalWorkspaceStore(storage).getSnapshot()).rejects.toBeInstanceOf(
      StorageWriteError,
    );
    expect(values.has(workspaceStorageKey)).toBe(false);
    expect(values.has(workspaceStorageKeyV4)).toBe(true);
  });

  it("returns the exact created expense and lists expenses newest first", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));

    const result = await repositories.expenses.createExpense({
      actualPaise: 12_345,
      categoryId: "category-core-shopping",
      date: "2026-07-23",
      eventId: "event-wedding",
      title: "Wedding shoes",
    });

    expect(result.expense).toMatchObject({
      actualPaise: 12_345,
      categoryId: "category-core-shopping",
      date: "2026-07-23",
      eventId: "event-wedding",
      title: "Wedding shoes",
    });
    expect(result.expense.createdAt).toEqual(expect.any(String));
    expect(result.expense).not.toHaveProperty("estimatedPaise");
    expect(result.expense).not.toHaveProperty("paymentStatus");
    expect(result.snapshot.expenses.at(-1)?.id).toBe(result.expense.id);
    expect((await repositories.expenses.listExpenses())[0]?.id).toBe(result.expense.id);
  });

  it("persists household, gift, and emergency-contact CRUD", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));

    await repositories.households.createHousehold({
      name: "Friends",
      side: "both",
      rsvpStatus: "Confirmed",
      invitationStatus: "Sent",
      accommodationStatus: "Not Needed",
      transportStatus: "Needed",
      guests: [{ id: "guest", name: "Asha", rsvpStatus: "Confirmed" }],
    });
    await repositories.gifts.createGift({
      kind: "Received",
      personName: "Asha",
      itemName: "Book",
      thankedStatus: "Pending",
      returnGiftStatus: "Pending",
    });
    await repositories.emergencyContacts.createContact({
      name: "Security desk",
      role: "Venue",
      phone: "100",
    });

    expect(
      (await repositories.households.listHouseholds()).some((item) => item.name === "Friends"),
    ).toBe(true);
    expect((await repositories.gifts.listGifts()).some((item) => item.personName === "Asha")).toBe(
      true,
    );
    const contact = (await repositories.emergencyContacts.listContacts()).find(
      (item) => item.name === "Security desk",
    );
    expect(contact).toBeDefined();

    if (contact) await repositories.emergencyContacts.deleteContact(contact.id);
    expect(
      (await repositories.emergencyContacts.listContacts()).some(
        (item) => item.name === "Security desk",
      ),
    ).toBe(false);
  });

  it("rejects an invalid replacement without overwriting the current snapshot", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const store = new LocalWorkspaceStore(storage);
    const repositories = createLocalRepositories(store);
    const before = await repositories.snapshot();

    await expect(
      repositories.workspace.replaceSnapshot({ ...before, version: 6 } as never),
    ).rejects.toThrow("not a supported Mangalya workspace file");

    expect((await repositories.snapshot()).wedding.name).toBe(before.wedding.name);
  });

  it("serializes concurrent writes so both mutations are retained", async () => {
    const values = new Map<string, string>([[workspaceStorageKey, JSON.stringify(demoWorkspace)]]);
    let releaseFirstWrite: () => void = () => undefined;
    const firstWriteReleased = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve;
    });
    let notifyFirstWrite: () => void = () => undefined;
    const firstWriteStarted = new Promise<void>((resolve) => {
      notifyFirstWrite = resolve;
    });
    let writeCount = 0;
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        writeCount += 1;
        if (writeCount === 1) {
          notifyFirstWrite();
          await firstWriteReleased;
        }
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));

    const first = repositories.tasks.createTask({
      title: "First concurrent task",
      priority: "Low",
      status: "Not Started",
    });
    await firstWriteStarted;
    const second = repositories.tasks.createTask({
      title: "Second concurrent task",
      priority: "Low",
      status: "Not Started",
    });
    releaseFirstWrite();
    await Promise.all([first, second]);

    const titles = (await repositories.tasks.listTasks()).map((task) => task.title);
    expect(titles).toEqual(
      expect.arrayContaining(["First concurrent task", "Second concurrent task"]),
    );
  });

  it("does not advance the cache when persistence fails", async () => {
    const values = new Map<string, string>([[workspaceStorageKey, JSON.stringify(demoWorkspace)]]);
    let failNextWrite = true;
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        if (failNextWrite) {
          failNextWrite = false;
          throw new Error("Disk unavailable");
        }
        values.set(key, value);
      }),
    };
    const repositories = createLocalRepositories(new LocalWorkspaceStore(storage));

    await expect(
      repositories.tasks.createTask({
        title: "Must not leak into cache",
        priority: "Low",
        status: "Not Started",
      }),
    ).rejects.toBeInstanceOf(StorageWriteError);
    await repositories.tasks.createTask({
      title: "Persisted after retry",
      priority: "Low",
      status: "Not Started",
    });

    const titles = (await repositories.tasks.listTasks()).map((task) => task.title);
    expect(titles).toContain("Persisted after retry");
    expect(titles).not.toContain("Must not leak into cache");
  });

  it("wraps adapter failures while checking write capacity and preserves the cache", async () => {
    const values = populatedValues();
    let failWorkspaceRead = false;
    const storage = {
      getItem: jest.fn(async (key: string) => {
        if (failWorkspaceRead && key === workspaceStorageKey) throw new Error("Adapter offline");
        return values.get(key) ?? null;
      }),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const store = new LocalWorkspaceStore(storage);
    const before = await store.getSnapshot();
    failWorkspaceRead = true;

    await expect(
      store.update((snapshot) => {
        snapshot.wedding.name = "Must not publish";
      }),
    ).rejects.toBeInstanceOf(StorageWriteError);

    failWorkspaceRead = false;
    expect((await store.getSnapshot()).wedding.name).toBe(before.wedding.name);
    expect(JSON.parse(values.get(workspaceStorageKey) ?? "null").wedding.name).toBe(
      before.wedding.name,
    );
  });

  it("surfaces corrupted data with the original recovery text", async () => {
    const corrupted = "{not-json";
    const storage = {
      getItem: jest.fn(async (key: string) => (key === workspaceStorageKey ? corrupted : null)),
      setItem: jest.fn(async () => undefined),
    };

    const error = await new LocalWorkspaceStore(storage)
      .getSnapshot()
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(WorkspaceCorruptionError);
    expect((error as WorkspaceCorruptionError).recoveryText).toBe(corrupted);
  });

  it("marks a deleted workspace empty and permits explicit setup", async () => {
    const values = new Map<string, string>([[workspaceStorageKey, JSON.stringify(demoWorkspace)]]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };
    const store = new LocalWorkspaceStore(storage);

    await expect(store.deleteLocalData()).resolves.toEqual({
      authoritative: true,
      residualKeys: [],
    });
    await expect(store.getSnapshot()).rejects.toBeInstanceOf(WorkspaceEmptyError);
    expect(values.get(emptyWorkspaceStorageKey)).toBe("true");

    const created = structuredClone(demoWorkspace);
    created.wedding.name = "Asha & Dev";
    await store.create(created);
    expect((await store.getSnapshot()).wedding.name).toBe("Asha & Dev");
    expect(values.has(emptyWorkspaceStorageKey)).toBe(false);
  });

  it("cleans residual legacy keys before a new setup clears the deletion tombstone", async () => {
    const values = new Map<string, string>([
      [emptyWorkspaceStorageKey, "true"],
      [workspaceStorageKeyV3, JSON.stringify(demoWorkspace)],
      [legacyWorkspaceStorageKey, JSON.stringify(demoWorkspace)],
    ]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };
    const store = new LocalWorkspaceStore(storage);

    await store.create({
      ...demoWorkspace,
      wedding: { ...demoWorkspace.wedding, name: "Asha & Dev" },
    });

    expect(values.has(workspaceStorageKeyV3)).toBe(false);
    expect(values.has(legacyWorkspaceStorageKey)).toBe(false);
    expect(values.has(emptyWorkspaceStorageKey)).toBe(false);
    expect(JSON.parse(values.get(workspaceStorageKey) ?? "null").wedding.name).toBe("Asha & Dev");
  });

  it("keeps deletion authoritative when key removal is unavailable", async () => {
    const values = new Map<string, string>([[workspaceStorageKey, JSON.stringify(demoWorkspace)]]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async () => {
        throw new Error("Removal unavailable");
      }),
    };
    const store = new LocalWorkspaceStore(storage);

    await expect(store.deleteLocalData()).resolves.toEqual({
      authoritative: true,
      residualKeys: [
        "workspace-current",
        "workspace-v4",
        "workspace-v3",
        "workspace-v2",
        "workspace-v1",
      ],
    });
    await expect(store.getSnapshot()).rejects.toBeInstanceOf(WorkspaceEmptyError);
    expect(values.get(workspaceStorageKey)).toBe("");
  });

  it.each([
    workspaceStorageKey,
    workspaceStorageKeyV4,
    workspaceStorageKeyV3,
    workspaceStorageKeyV2,
    legacyWorkspaceStorageKey,
  ])("refuses setup while the existing key %s is present", async (existingKey) => {
    const values = new Map<string, string>([[existingKey, JSON.stringify(demoWorkspace)]]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };

    await expect(new LocalWorkspaceStore(storage).create(demoWorkspace)).rejects.toBeInstanceOf(
      WorkspaceAlreadyExistsError,
    );
    expect(values.get(existingKey)).toBe(JSON.stringify(demoWorkspace));
  });

  it("allows exactly one of two concurrent setup attempts", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };
    const first = structuredClone(demoWorkspace);
    first.wedding.name = "First";
    const second = structuredClone(demoWorkspace);
    second.wedding.name = "Second";

    const results = await Promise.allSettled([
      new LocalWorkspaceStore(storage).create(first),
      new LocalWorkspaceStore(storage).create(second),
    ]);

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const rejected = results.find(({ status }) => status === "rejected");
    expect(rejected).toMatchObject({ reason: expect.any(WorkspaceAlreadyExistsError) });
    expect(["First", "Second"]).toContain(
      JSON.parse(values.get(workspaceStorageKey) ?? "null").wedding.name,
    );
  });

  it("rejects an oversized fresh workspace before writing it", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };
    const oversized = oversizedWorkspace();

    await expect(new LocalWorkspaceStore(storage).create(oversized)).rejects.toBeInstanceOf(
      WorkspaceCapacityError,
    );
    expect(values.has(workspaceStorageKey)).toBe(false);
  });

  it("opens existing oversized data but rejects further growth", async () => {
    const existing = oversizedWorkspace();
    const serialized = JSON.stringify(existing);
    const values = new Map<string, string>([[workspaceStorageKey, serialized]]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };
    const store = new LocalWorkspaceStore(storage);

    await expect(store.getSnapshot()).resolves.toMatchObject({ version: 5 });
    await expect(
      store.update((snapshot) => {
        snapshot.tasks[0]!.notes = `${snapshot.tasks[0]!.notes ?? ""}अ`;
      }),
    ).rejects.toBeInstanceOf(WorkspaceCapacityError);
    expect(values.get(workspaceStorageKey)).toBe(serialized);
  });

  it("rejects an oversized replacement without changing the current workspace", async () => {
    const values = populatedValues();
    const original = values.get(workspaceStorageKey);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
    };

    await expect(
      new LocalWorkspaceStore(storage).replace(oversizedWorkspace()),
    ).rejects.toBeInstanceOf(WorkspaceCapacityError);
    expect(values.get(workspaceStorageKey)).toBe(original);
  });

  it("keeps deletion authoritative and retries residual keys after restart", async () => {
    const values = new Map<string, string>([
      [workspaceStorageKey, JSON.stringify(demoWorkspace)],
      [workspaceStorageKeyV4, "legacy-residual"],
    ]);
    let failCleanup = true;
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        if (failCleanup && key !== emptyWorkspaceStorageKey) throw new Error("Disk busy");
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        if (failCleanup) throw new Error("Disk busy");
        values.delete(key);
      }),
    };

    const report = await new LocalWorkspaceStore(storage).deleteLocalData();
    expect(report).toEqual({
      authoritative: true,
      residualKeys: [
        "workspace-current",
        "workspace-v4",
        "workspace-v3",
        "workspace-v2",
        "workspace-v1",
      ],
    });
    expect(values.get(emptyWorkspaceStorageKey)).toBe("true");

    failCleanup = false;
    await expect(new LocalWorkspaceStore(storage).getSnapshot()).rejects.toBeInstanceOf(
      WorkspaceEmptyError,
    );
    expect(values.get(emptyWorkspaceStorageKey)).toBe("true");
    expect(values.has(workspaceStorageKey)).toBe(false);
    expect(values.has(workspaceStorageKeyV4)).toBe(false);
  });

  it("does not expose residual recovery text after an authoritative deletion", async () => {
    const values = new Map<string, string>([
      [emptyWorkspaceStorageKey, "true"],
      [workspaceStorageKey, JSON.stringify(demoWorkspace)],
    ]);
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };

    await expect(new LocalWorkspaceStore(storage).getRecoveryText()).resolves.toBeNull();
    expect(values.get(emptyWorkspaceStorageKey)).toBe("true");
    expect(values.has(workspaceStorageKey)).toBe(false);
  });

  it("does not return another store instance's stale cache after deletion", async () => {
    const values = populatedValues();
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };
    const cachedStore = new LocalWorkspaceStore(storage);
    const deletingStore = new LocalWorkspaceStore(storage);
    await cachedStore.getSnapshot();

    await deletingStore.deleteLocalData();

    await expect(cachedStore.getSnapshot()).rejects.toBeInstanceOf(WorkspaceEmptyError);
  });

  it("restores the deletion tombstone when replacement persistence fails", async () => {
    const values = new Map<string, string>([[emptyWorkspaceStorageKey, "true"]]);
    let failWorkspaceWrite = true;
    const storage = {
      getItem: jest.fn(async (key: string) => values.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        if (key === workspaceStorageKey && failWorkspaceWrite) {
          failWorkspaceWrite = false;
          throw new Error("Disk full");
        }
        values.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        values.delete(key);
      }),
    };
    const store = new LocalWorkspaceStore(storage);

    await expect(store.create(demoWorkspace)).rejects.toBeInstanceOf(StorageWriteError);
    expect(values.get(emptyWorkspaceStorageKey)).toBe("true");
    expect(values.has(workspaceStorageKey)).toBe(false);
    await expect(store.getSnapshot()).rejects.toBeInstanceOf(WorkspaceEmptyError);
  });
});
