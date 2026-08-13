import {
  LocalWorkspaceStore,
  WorkspaceCorruptionError,
  WorkspaceEmptyError,
  createLocalRepositories,
  emptyWorkspaceStorageKey,
  legacyWorkspaceStorageKey,
  workspaceStorageKey,
  workspaceStorageKeyV2,
} from "./local-repositories";
import { demoWorkspace } from "./seed";

const populatedValues = () =>
  new Map<string, string>([[workspaceStorageKey, JSON.stringify(demoWorkspace)]]);

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

    expect(snapshot.version).toBe(4);
    expect(snapshot.wedding.name).toBe("A & B");
    expect(values.has(legacyWorkspaceStorageKey)).toBe(true);
    expect(values.has(workspaceStorageKey)).toBe(true);
  });

  it("migrates the v2 key into v4 without deleting the previous key", async () => {
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

    expect(snapshot.version).toBe(4);
    expect(values.has(workspaceStorageKeyV2)).toBe(true);
    expect(values.has(workspaceStorageKey)).toBe(true);
    expect(snapshot.categories.filter((category) => !category.archived)).toHaveLength(7);
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
      repositories.workspace.replaceSnapshot({ ...before, version: 5 } as never),
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
    ).rejects.toThrow("Disk unavailable");
    await repositories.tasks.createTask({
      title: "Persisted after retry",
      priority: "Low",
      status: "Not Started",
    });

    const titles = (await repositories.tasks.listTasks()).map((task) => task.title);
    expect(titles).toContain("Persisted after retry");
    expect(titles).not.toContain("Must not leak into cache");
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

    await store.deleteLocalData();
    await expect(store.getSnapshot()).rejects.toBeInstanceOf(WorkspaceEmptyError);
    expect(values.get(emptyWorkspaceStorageKey)).toBe("true");

    const created = structuredClone(demoWorkspace);
    created.wedding.name = "Asha & Dev";
    await store.create(created);
    expect((await store.getSnapshot()).wedding.name).toBe("Asha & Dev");
    expect(values.has(emptyWorkspaceStorageKey)).toBe(false);
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

    await expect(store.deleteLocalData()).resolves.toBeUndefined();
    await expect(store.getSnapshot()).rejects.toBeInstanceOf(WorkspaceEmptyError);
    expect(values.get(workspaceStorageKey)).toBe("");
  });
});
