import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  StorageWriteError,
  WorkspaceAlreadyExistsError,
  WorkspaceCapacityError,
} from "@/lib/errors";
import { utf8ByteLength } from "@/lib/storage/utf8-byte-length";

import { createDemoWorkspace } from "./seed";
import { selectRecentExpenses } from "./selectors";
import type {
  BackupHistoryEntry,
  BudgetCategory,
  EmergencyContact,
  Expense,
  GiftRecord,
  Household,
  Repositories,
  Task,
  Wedding,
  WeddingEvent,
  WorkspaceDeletionReport,
  WorkspaceResidualKeyIdentifier,
  WorkspaceSnapshot,
} from "./types";
import { parseOrMigrateWorkspaceSnapshot } from "./workspace-schema";

export const workspaceStorageKey = "@wed-master/local-workspace/v5";
export const workspaceStorageKeyV4 = "@wed-master/local-workspace/v4";
export const workspaceStorageKeyV3 = "@wed-master/local-workspace/v3";
export const workspaceStorageKeyV2 = "@wed-master/local-workspace/v2";
export const legacyWorkspaceStorageKey = "@wed-master/local-workspace/v1";
export const emptyWorkspaceStorageKey = "@wed-master/local-workspace/empty";
export const maximumWorkspaceSnapshotBytes = 2 * 1024 * 1024;
export const makeWorkspaceId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const workspaceStorageEntries: readonly {
  id: WorkspaceResidualKeyIdentifier;
  key: string;
}[] = [
  { id: "workspace-current", key: workspaceStorageKey },
  { id: "workspace-v4", key: workspaceStorageKeyV4 },
  { id: "workspace-v3", key: workspaceStorageKeyV3 },
  { id: "workspace-v2", key: workspaceStorageKeyV2 },
  { id: "workspace-v1", key: legacyWorkspaceStorageKey },
];

const sharedOperationQueues = new WeakMap<object, Promise<void>>();
type CommitCapacityMode = "existing-migration" | "growth-only" | "strict";
type CommitCandidateOptions = {
  capacityMode?: CommitCapacityMode;
  clearDeletionTombstone?: boolean;
};

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

  constructor(private readonly storage: KeyValueStorage = AsyncStorage) {}

  async getSnapshot(): Promise<WorkspaceSnapshot> {
    return this.runExclusive(() => this.getSnapshotUnlocked());
  }

  async getRecoveryText(): Promise<string | null> {
    return this.runExclusive(async () => {
      if ((await this.storage.getItem(emptyWorkspaceStorageKey)) === "true") {
        await this.retryDeletedWorkspaceCleanup();
        return null;
      }

      for (const key of [
        workspaceStorageKey,
        workspaceStorageKeyV4,
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
    return this.runExclusive(() =>
      this.commitCandidate(snapshot, {
        capacityMode: "strict",
        clearDeletionTombstone: true,
      }),
    );
  }

  async create(snapshot: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
    return this.runExclusive(async () => {
      try {
        const deletionIsAuthoritative =
          (await this.storage.getItem(emptyWorkspaceStorageKey)) === "true";
        if (!deletionIsAuthoritative) {
          for (const { key } of workspaceStorageEntries) {
            if ((await this.storage.getItem(key)) !== null) {
              throw new WorkspaceAlreadyExistsError();
            }
          }
        } else {
          // A prior deletion may have left legacy keys behind after a disk-full
          // or adapter failure. Retry and verify those keys before allowing a
          // new workspace to clear the tombstone; stale private data must not
          // survive underneath a fresh setup.
          await this.retryDeletedWorkspaceCleanup();
          for (const { key } of workspaceStorageEntries) {
            const residual = await this.storage.getItem(key);
            if (residual !== null && residual !== "") {
              throw new StorageWriteError(new Error("Deleted workspace cleanup is incomplete."));
            }
          }
        }
      } catch (error) {
        if (error instanceof WorkspaceAlreadyExistsError) throw error;
        throw new StorageWriteError(error);
      }

      return this.commitCandidate(snapshot, {
        capacityMode: "strict",
        clearDeletionTombstone: true,
      });
    });
  }

  async reset(): Promise<WorkspaceSnapshot> {
    return this.replace(createDemoWorkspace());
  }

  async deleteLocalData(): Promise<WorkspaceDeletionReport> {
    return this.runExclusive(async () => {
      try {
        await this.storage.setItem(emptyWorkspaceStorageKey, "true");
      } catch (error) {
        throw new StorageWriteError(error);
      }
      this.snapshotCache = undefined;

      const residualKeys: WorkspaceResidualKeyIdentifier[] = [];
      for (const entry of workspaceStorageEntries) {
        if (!(await this.eraseAndVerifyStorageKey(entry.key))) residualKeys.push(entry.id);
      }

      return { authoritative: true, residualKeys };
    });
  }

  private async getSnapshotUnlocked(): Promise<WorkspaceSnapshot> {
    if ((await this.storage.getItem(emptyWorkspaceStorageKey)) === "true") {
      this.snapshotCache = undefined;
      await this.retryDeletedWorkspaceCleanup();
      throw new WorkspaceEmptyError();
    }

    if (this.snapshotCache) return copy(this.snapshotCache);

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

    const versionFourStored = await this.storage.getItem(workspaceStorageKeyV4);
    if (versionFourStored) {
      return this.migrateStoredSnapshot(versionFourStored);
    }

    const versionThreeStored = await this.storage.getItem(workspaceStorageKeyV3);
    if (versionThreeStored) {
      return this.migrateStoredSnapshot(versionThreeStored);
    }

    const previousStored = await this.storage.getItem(workspaceStorageKeyV2);
    if (previousStored) {
      return this.migrateStoredSnapshot(previousStored);
    }

    const legacyStored = await this.storage.getItem(legacyWorkspaceStorageKey);
    if (!legacyStored) {
      throw new WorkspaceEmptyError();
    }

    return this.migrateStoredSnapshot(legacyStored);
  }

  private async migrateStoredSnapshot(stored: string): Promise<WorkspaceSnapshot> {
    let candidate: WorkspaceSnapshot;
    try {
      candidate = parseOrMigrateWorkspaceSnapshot(JSON.parse(stored));
    } catch {
      throw new WorkspaceCorruptionError(
        "Mangalya could not safely migrate the local workspace.",
        stored,
      );
    }

    return this.commitCandidate(candidate, { capacityMode: "existing-migration" });
  }

  private async commitCandidate(
    candidate: WorkspaceSnapshot,
    { capacityMode = "growth-only", clearDeletionTombstone = false }: CommitCandidateOptions = {},
  ): Promise<WorkspaceSnapshot> {
    // Zod returns a detached parsed value, so cloning the complete snapshot before parsing only
    // duplicates hot-write work. Keep the parsed cache and returned snapshot isolated below.
    const validated = workspaceSnapshotSchemaParse(candidate);
    const serialized = JSON.stringify(validated);
    const candidateBytes = utf8ByteLength(serialized);
    let currentBytes = 0;
    if (capacityMode === "growth-only") {
      let current: string | null;
      try {
        current = await this.storage.getItem(workspaceStorageKey);
      } catch (error) {
        throw new StorageWriteError(error);
      }
      currentBytes = current ? utf8ByteLength(current) : 0;
    }
    if (
      candidateBytes > maximumWorkspaceSnapshotBytes &&
      (capacityMode === "strict" ||
        (capacityMode === "growth-only" && candidateBytes > currentBytes))
    ) {
      throw new WorkspaceCapacityError();
    }

    let clearedAuthoritativeTombstone = false;
    try {
      if (
        clearDeletionTombstone &&
        (await this.storage.getItem(emptyWorkspaceStorageKey)) === "true"
      ) {
        // Clear the tombstone before publishing the replacement. If the write fails, restore the
        // tombstone so stale legacy keys can never become authoritative again on restart.
        await this.removeStorageKey(emptyWorkspaceStorageKey);
        clearedAuthoritativeTombstone = true;
      }
      await this.storage.setItem(workspaceStorageKey, serialized);
    } catch (error) {
      if (clearedAuthoritativeTombstone) {
        try {
          await this.storage.setItem(emptyWorkspaceStorageKey, "true");
        } catch {
          // Preserve the original storage failure. The cache still remains unpublished.
        }
      }
      if (error instanceof StorageWriteError) throw error;
      throw new StorageWriteError(error);
    }
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

  private async eraseAndVerifyStorageKey(key: string): Promise<boolean> {
    try {
      if (this.storage.removeItem) await this.storage.removeItem(key);
      else await this.storage.setItem(key, "");
    } catch {
      try {
        await this.storage.setItem(key, "");
      } catch {
        return false;
      }
    }

    try {
      return (await this.storage.getItem(key)) === null;
    } catch {
      return false;
    }
  }

  private async retryDeletedWorkspaceCleanup(): Promise<void> {
    for (const { key } of workspaceStorageEntries) {
      await this.eraseAndVerifyStorageKey(key);
    }
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const storageIdentity = this.storage as object;
    const previous = sharedOperationQueues.get(storageIdentity) ?? Promise.resolve();
    const result = previous.then(operation, operation);
    sharedOperationQueues.set(
      storageIdentity,
      result.then(
        () => undefined,
        () => undefined,
      ),
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
      updateTaskStatus: (id, status) =>
        store.update((snapshot) => {
          const index = snapshot.tasks.findIndex((item) => item.id === id);
          if (index >= 0) snapshot.tasks[index] = { ...snapshot.tasks[index], status };
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
      addHistory: async (entry) => {
        let removedEntries: BackupHistoryEntry[] = [];
        const snapshot = await store.update((draft) => {
          draft.backupHistory.unshift(entry);
          removedEntries = draft.backupHistory.slice(20);
          draft.backupHistory = draft.backupHistory.slice(0, 20);
        });
        return { removedEntries, snapshot };
      },
      clearHistory: async () => {
        let removedEntries: BackupHistoryEntry[] = [];
        const snapshot = await store.update((draft) => {
          removedEntries = [...draft.backupHistory];
          draft.backupHistory = [];
        });
        return { removedEntries, snapshot };
      },
      removeHistory: async (id) => {
        let removedEntries: BackupHistoryEntry[] = [];
        const snapshot = await store.update((draft) => {
          removedEntries = draft.backupHistory.filter((entry) => entry.id === id);
          draft.backupHistory = draft.backupHistory.filter((entry) => entry.id !== id);
        });
        return { removedEntries, snapshot };
      },
    },
  };
}
