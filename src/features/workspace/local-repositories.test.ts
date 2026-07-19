import {
  LocalWorkspaceStore,
  createLocalRepositories,
  legacyWorkspaceStorageKey,
  workspaceStorageKey,
} from "./local-repositories";

describe("local repositories", () => {
  it("persists changes through the storage adapter", async () => {
    const values = new Map<string, string>();
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

  it("persists a device-local wedding cover URI in the v2 workspace", async () => {
    const values = new Map<string, string>();
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

    expect(snapshot.version).toBe(2);
    expect(snapshot.wedding.name).toBe("A & B");
    expect(values.has(legacyWorkspaceStorageKey)).toBe(true);
    expect(values.has(workspaceStorageKey)).toBe(true);
  });

  it("persists household, gift, and emergency-contact CRUD", async () => {
    const values = new Map<string, string>();
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
    const values = new Map<string, string>();
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
      repositories.workspace.replaceSnapshot({ ...before, version: 3 } as never),
    ).rejects.toThrow("not a supported Mangalya workspace file");

    expect((await repositories.snapshot()).wedding.name).toBe(before.wedding.name);
  });
});
