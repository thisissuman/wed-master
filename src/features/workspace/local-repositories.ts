import AsyncStorage from "@react-native-async-storage/async-storage";

import { createDemoWorkspace } from "./seed";
import { selectRecentExpenses } from "./selectors";
import type {
  BudgetCategory,
  EmergencyContact,
  Expense,
  GiftRecord,
  Household,
  Repositories,
  Task,
  Wedding,
  WeddingEvent,
  WorkspaceSnapshot,
} from "./types";
import { parseOrMigrateWorkspaceSnapshot } from "./workspace-schema";

export const workspaceStorageKey = "@wed-master/local-workspace/v4";
export const workspaceStorageKeyV3 = "@wed-master/local-workspace/v3";
export const workspaceStorageKeyV2 = "@wed-master/local-workspace/v2";
export const legacyWorkspaceStorageKey = "@wed-master/local-workspace/v1";
export const emptyWorkspaceStorageKey = "@wed-master/local-workspace/empty";
export const makeWorkspaceId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export type KeyValueStorage = Pick<typeof AsyncStorage, "getItem" | "setItem"> &
  Partial<Pick<typeof AsyncStorage, "removeItem">>;

export class WorkspaceEmptyError extends Error {
  constructor() {
    super("Set up your local wedding workspace to continue.");
    this.name = "WorkspaceEmptyError";
  }
}

export class WorkspaceCorruptionError extends Error {
  constructor(
    message: string,
    readonly recoveryText: string,
  ) {
    super(message);
    this.name = "WorkspaceCorruptionError";
  }
}

export class LocalWorkspaceStore {
  private snapshotCache?: WorkspaceSnapshot;
  private operationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly storage: KeyValueStorage = AsyncStorage) {}

  async getSnapshot(): Promise<WorkspaceSnapshot> {
    return this.runExclusive(() => this.getSnapshotUnlocked());
  }

  async getRecoveryText(): Promise<string | null> {
    return this.runExclusive(async () => {
      for (const key of [
        workspaceStorageKey,
        workspaceStorageKeyV3,
        workspaceStorageKeyV2,
        legacyWorkspaceStorageKey,
      ]) {
        const value = await this.storage.getItem(key);
        if (value) return value;
      }
      return null;
    });
  }

  async update(mutator: (snapshot: WorkspaceSnapshot) => void): Promise<WorkspaceSnapshot> {
    return this.runExclusive(async () => {
      const candidate = await this.getSnapshotUnlocked();
      mutator(candidate);
      return this.commitCandidate(candidate);
    });
  }

  async replace(snapshot: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
    return this.runExclusive(() => this.commitCandidate(snapshot));
  }

  async create(snapshot: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
    return this.runExclusive(async () => {
      const validated = workspaceSnapshotSchemaParse(copy(snapshot));
      await this.storage.setItem(workspaceStorageKey, JSON.stringify(validated));
      await this.removeStorageKey(emptyWorkspaceStorageKey);
      this.snapshotCache = validated;
      return copy(validated);
    });
  }

  async reset(): Promise<WorkspaceSnapshot> {
    return this.replace(createDemoWorkspace());
  }

  async deleteLocalData(): Promise<void> {
    return this.runExclusive(async () => {
      await this.storage.setItem(emptyWorkspaceStorageKey, "true");
      this.snapshotCache = undefined;
      await Promise.allSettled([
        this.removeStorageKey(workspaceStorageKey),
        this.removeStorageKey(workspaceStorageKeyV3),
        this.removeStorageKey(workspaceStorageKeyV2),
        this.removeStorageKey(legacyWorkspaceStorageKey),
      ]);
    });
  }

  private async getSnapshotUnlocked(): Promise<WorkspaceSnapshot> {
    if (this.snapshotCache) return copy(this.snapshotCache);

    if ((await this.storage.getItem(emptyWorkspaceStorageKey)) === "true") {
      throw new WorkspaceEmptyError();
    }

    const currentStored = await this.storage.getItem(workspaceStorageKey);
    if (currentStored) {
      try {
        const parsed = parseOrMigrateWorkspaceSnapshot(JSON.parse(currentStored));
        this.snapshotCache = parsed;
        return copy(parsed);
      } catch {
        throw new WorkspaceCorruptionError(
          "Mangalya could not safely open the local workspace.",
          currentStored,
        );
      }
    }

    const versionThreeStored = await this.storage.getItem(workspaceStorageKeyV3);
    if (versionThreeStored) {
      try {
        return this.commitCandidate(
          parseOrMigrateWorkspaceSnapshot(JSON.parse(versionThreeStored)),
        );
      } catch {
        throw new WorkspaceCorruptionError(
          "Mangalya could not safely migrate the local workspace.",
          versionThreeStored,
        );
      }
    }

    const previousStored = await this.storage.getItem(workspaceStorageKeyV2);
    if (previousStored) {
      try {
        return this.commitCandidate(parseOrMigrateWorkspaceSnapshot(JSON.parse(previousStored)));
      } catch {
        throw new WorkspaceCorruptionError(
          "Mangalya could not safely migrate the local workspace.",
          previousStored,
        );
      }
    }

    const legacyStored = await this.storage.getItem(legacyWorkspaceStorageKey);
    if (!legacyStored) {
      throw new WorkspaceEmptyError();
    }

    try {
      return this.commitCandidate(parseOrMigrateWorkspaceSnapshot(JSON.parse(legacyStored)));
    } catch {
      throw new WorkspaceCorruptionError(
        "Mangalya could not safely migrate the local workspace.",
        legacyStored,
      );
    }
  }

  private async commitCandidate(candidate: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
    const validated = workspaceSnapshotSchemaParse(copy(candidate));
    await this.storage.setItem(workspaceStorageKey, JSON.stringify(validated));
    this.snapshotCache = validated;
    return copy(validated);
  }

  private async removeStorageKey(key: string): Promise<void> {
    try {
      if (this.storage.removeItem) {
        await this.storage.removeItem(key);
        return;
      }
    } catch {
      // Fall through to an overwrite for adapters that cannot remove a key.
    }
    await this.storage.setItem(key, "");
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

function workspaceSnapshotSchemaParse(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return parseOrMigrateWorkspaceSnapshot(snapshot);
}

export function createLocalRepositories(store = new LocalWorkspaceStore()): Repositories {
  return {
    snapshot: () => store.getSnapshot(),
    workspace: {
      replaceSnapshot: (snapshot) => store.replace(snapshot),
      resetDemo: () => store.reset(),
      createSnapshot: (snapshot) => store.create(snapshot),
      deleteLocalData: () => store.deleteLocalData(),
      getRecoveryText: () => store.getRecoveryText(),
    },
    wedding: {
      getWedding: async () => (await store.getSnapshot()).wedding,
      updateWedding: (wedding: Wedding) =>
        store.update((snapshot) => {
          snapshot.wedding = wedding;
        }),
    },
    events: {
      listEvents: async () =>
        (await store.getSnapshot()).events.sort(
          (a, b) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder,
        ),
      createEvent: (event) =>
        store.update((snapshot) => {
          snapshot.events.push({
            ...event,
            requiredItems: event.requiredItems ?? [],
            id: makeWorkspaceId("event"),
            sortOrder: snapshot.events.length,
          });
        }),
      updateEvent: (event: WeddingEvent) =>
        store.update((snapshot) => {
          const index = snapshot.events.findIndex((item) => item.id === event.id);
          if (index >= 0) snapshot.events[index] = event;
        }),
      deleteEvent: (id) =>
        store.update((snapshot) => {
          snapshot.events = snapshot.events.filter((event) => event.id !== id);
          snapshot.tasks = snapshot.tasks.map((task) =>
            task.eventId === id ? { ...task, eventId: undefined } : task,
          );
          snapshot.expenses = snapshot.expenses.map((expense) =>
            expense.eventId === id ? { ...expense, eventId: undefined } : expense,
          );
        }),
      moveEvent: (id, direction) =>
        store.update((snapshot) => {
          const ordered = [...snapshot.events].sort(
            (a, b) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder,
          );
          const index = ordered.findIndex((event) => event.id === id);
          const target = direction === "earlier" ? index - 1 : index + 1;
          if (index < 0 || target < 0 || target >= ordered.length) return;
          const current = ordered[index];
          ordered[index] = ordered[target];
          ordered[target] = current;
          snapshot.events = ordered.map((event, sortOrder) => ({ ...event, sortOrder }));
        }),
    },
    tasks: {
      listTasks: async () => (await store.getSnapshot()).tasks,
      createTask: (task) =>
        store.update((snapshot) => {
          snapshot.tasks.push({
            ...task,
            attachments: task.attachments ?? [],
            checklist: task.checklist ?? [],
            id: makeWorkspaceId("task"),
          });
        }),
      updateTask: (task: Task) =>
        store.update((snapshot) => {
          const index = snapshot.tasks.findIndex((item) => item.id === task.id);
          if (index >= 0) snapshot.tasks[index] = task;
        }),
      deleteTask: (id) =>
        store.update((snapshot) => {
          snapshot.tasks = snapshot.tasks.filter((task) => task.id !== id);
        }),
      restoreTask: (task) =>
        store.update((snapshot) => {
          if (!snapshot.tasks.some((item) => item.id === task.id)) snapshot.tasks.push(task);
        }),
    },
    budget: {
      listCategories: async () => (await store.getSnapshot()).categories,
      createCategory: (category) =>
        store.update((snapshot) => {
          snapshot.categories.push({
            ...category,
            id: makeWorkspaceId("category"),
            sortOrder: snapshot.categories.length,
          });
        }),
      updateCategory: (category: BudgetCategory) =>
        store.update((snapshot) => {
          const index = snapshot.categories.findIndex((item) => item.id === category.id);
          if (index >= 0) snapshot.categories[index] = category;
        }),
      deleteCategory: (id) =>
        store.update((snapshot) => {
          snapshot.categories = snapshot.categories.filter((category) => category.id !== id);
          snapshot.expenses = snapshot.expenses.filter((expense) => expense.categoryId !== id);
        }),
    },
    expenses: {
      listExpenses: async () => selectRecentExpenses((await store.getSnapshot()).expenses),
      createExpense: async (expense) => {
        const created: Expense = {
          ...expense,
          createdAt: new Date().toISOString(),
          id: makeWorkspaceId("expense"),
        };
        const snapshot = await store.update((candidate) => {
          candidate.expenses.push(created);
        });
        return { expense: copy(created), snapshot };
      },
      updateExpense: (expense: Expense) =>
        store.update((snapshot) => {
          const index = snapshot.expenses.findIndex((item) => item.id === expense.id);
          if (index >= 0) snapshot.expenses[index] = expense;
        }),
      deleteExpense: (id) =>
        store.update((snapshot) => {
          snapshot.expenses = snapshot.expenses.filter((expense) => expense.id !== id);
        }),
      restoreExpense: (expense) =>
        store.update((snapshot) => {
          if (!snapshot.expenses.some((item) => item.id === expense.id)) {
            snapshot.expenses.push(expense);
          }
        }),
    },
    households: {
      listHouseholds: async () => (await store.getSnapshot()).households,
      createHousehold: (household) =>
        store.update((snapshot) => {
          snapshot.households.push({ ...household, id: makeWorkspaceId("household") });
        }),
      updateHousehold: (household: Household) =>
        store.update((snapshot) => {
          const index = snapshot.households.findIndex((item) => item.id === household.id);
          if (index >= 0) snapshot.households[index] = household;
        }),
      deleteHousehold: (id) =>
        store.update((snapshot) => {
          snapshot.households = snapshot.households.filter((household) => household.id !== id);
        }),
      restoreHousehold: (household) =>
        store.update((snapshot) => {
          if (!snapshot.households.some((item) => item.id === household.id)) {
            snapshot.households.push(household);
          }
        }),
    },
    gifts: {
      listGifts: async () => (await store.getSnapshot()).gifts,
      createGift: (gift) =>
        store.update((snapshot) => {
          snapshot.gifts.push({ ...gift, id: makeWorkspaceId("gift") });
        }),
      updateGift: (gift: GiftRecord) =>
        store.update((snapshot) => {
          const index = snapshot.gifts.findIndex((item) => item.id === gift.id);
          if (index >= 0) snapshot.gifts[index] = gift;
        }),
      deleteGift: (id) =>
        store.update((snapshot) => {
          snapshot.gifts = snapshot.gifts.filter((gift) => gift.id !== id);
        }),
      restoreGift: (gift) =>
        store.update((snapshot) => {
          if (!snapshot.gifts.some((item) => item.id === gift.id)) snapshot.gifts.push(gift);
        }),
    },
    emergencyContacts: {
      listContacts: async () => (await store.getSnapshot()).emergencyContacts,
      createContact: (contact) =>
        store.update((snapshot) => {
          snapshot.emergencyContacts.push({ ...contact, id: makeWorkspaceId("contact") });
        }),
      updateContact: (contact: EmergencyContact) =>
        store.update((snapshot) => {
          const index = snapshot.emergencyContacts.findIndex((item) => item.id === contact.id);
          if (index >= 0) snapshot.emergencyContacts[index] = contact;
        }),
      deleteContact: (id) =>
        store.update((snapshot) => {
          snapshot.emergencyContacts = snapshot.emergencyContacts.filter(
            (contact) => contact.id !== id,
          );
        }),
      restoreContact: (contact) =>
        store.update((snapshot) => {
          if (!snapshot.emergencyContacts.some((item) => item.id === contact.id)) {
            snapshot.emergencyContacts.push(contact);
          }
        }),
    },
    backup: {
      addHistory: (entry) =>
        store.update((snapshot) => {
          snapshot.backupHistory.unshift(entry);
          snapshot.backupHistory = snapshot.backupHistory.slice(0, 20);
        }),
      clearHistory: () =>
        store.update((snapshot) => {
          snapshot.backupHistory = [];
        }),
    },
  };
}
