import AsyncStorage from "@react-native-async-storage/async-storage";

import { demoWorkspace } from "./seed";
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

export const workspaceStorageKey = "@wed-master/local-workspace/v2";
export const legacyWorkspaceStorageKey = "@wed-master/local-workspace/v1";
export const makeWorkspaceId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export type KeyValueStorage = Pick<typeof AsyncStorage, "getItem" | "setItem">;

export class LocalWorkspaceStore {
  private snapshotCache?: WorkspaceSnapshot;
  constructor(private readonly storage: KeyValueStorage = AsyncStorage) {}

  async getSnapshot(): Promise<WorkspaceSnapshot> {
    if (this.snapshotCache) return copy(this.snapshotCache);

    const currentStored = await this.storage.getItem(workspaceStorageKey);
    if (currentStored) {
      this.snapshotCache = parseOrMigrateWorkspaceSnapshot(JSON.parse(currentStored));
      return copy(this.snapshotCache);
    }

    const legacyStored = await this.storage.getItem(legacyWorkspaceStorageKey);
    this.snapshotCache = legacyStored
      ? parseOrMigrateWorkspaceSnapshot(JSON.parse(legacyStored))
      : copy(demoWorkspace);
    await this.persist();
    return copy(this.snapshotCache);
  }

  async update(mutator: (snapshot: WorkspaceSnapshot) => void): Promise<WorkspaceSnapshot> {
    const snapshot = await this.getSnapshot();
    mutator(snapshot);
    this.snapshotCache = workspaceSnapshotSchemaParse(snapshot);
    await this.persist();
    return copy(this.snapshotCache);
  }

  async replace(snapshot: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
    this.snapshotCache = workspaceSnapshotSchemaParse(snapshot);
    await this.persist();
    return copy(this.snapshotCache);
  }

  async reset(): Promise<WorkspaceSnapshot> {
    return this.replace(copy(demoWorkspace));
  }

  private async persist() {
    if (this.snapshotCache) {
      await this.storage.setItem(workspaceStorageKey, JSON.stringify(this.snapshotCache));
    }
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
      listExpenses: async () => (await store.getSnapshot()).expenses,
      createExpense: (expense) =>
        store.update((snapshot) => {
          snapshot.expenses.push({ ...expense, id: makeWorkspaceId("expense") });
        }),
      updateExpense: (expense: Expense) =>
        store.update((snapshot) => {
          const index = snapshot.expenses.findIndex((item) => item.id === expense.id);
          if (index >= 0) snapshot.expenses[index] = expense;
        }),
      deleteExpense: (id) =>
        store.update((snapshot) => {
          snapshot.expenses = snapshot.expenses.filter((expense) => expense.id !== id);
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
