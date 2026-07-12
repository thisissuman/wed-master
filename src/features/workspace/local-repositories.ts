import AsyncStorage from "@react-native-async-storage/async-storage";

import { demoWorkspace } from "./seed";
import type {
  BudgetCategory,
  Expense,
  Repositories,
  Task,
  Wedding,
  WeddingEvent,
  WorkspaceSnapshot,
} from "./types";

const storageKey = "@wed-master/local-workspace/v1";
const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export type KeyValueStorage = Pick<typeof AsyncStorage, "getItem" | "setItem">;

export class LocalWorkspaceStore {
  private snapshotCache?: WorkspaceSnapshot;
  constructor(private readonly storage: KeyValueStorage = AsyncStorage) {}

  async getSnapshot(): Promise<WorkspaceSnapshot> {
    if (this.snapshotCache) return copy(this.snapshotCache);
    const stored = await this.storage.getItem(storageKey);
    this.snapshotCache = stored ? (JSON.parse(stored) as WorkspaceSnapshot) : copy(demoWorkspace);
    if (!stored) await this.persist();
    return copy(this.snapshotCache);
  }

  async update(mutator: (snapshot: WorkspaceSnapshot) => void): Promise<WorkspaceSnapshot> {
    const snapshot = await this.getSnapshot();
    mutator(snapshot);
    this.snapshotCache = snapshot;
    await this.persist();
    return copy(snapshot);
  }

  private async persist() {
    if (this.snapshotCache)
      await this.storage.setItem(storageKey, JSON.stringify(this.snapshotCache));
  }
}

export function createLocalRepositories(store = new LocalWorkspaceStore()): Repositories {
  return {
    snapshot: () => store.getSnapshot(),
    wedding: {
      getWedding: async () => (await store.getSnapshot()).wedding,
      updateWedding: (wedding: Wedding) =>
        store.update((s) => {
          s.wedding = wedding;
        }),
    },
    events: {
      listEvents: async () =>
        (await store.getSnapshot()).events.sort(
          (a, b) => a.date.localeCompare(b.date) || a.sortOrder - b.sortOrder,
        ),
      createEvent: (event) =>
        store.update((s) => {
          s.events.push({ ...event, id: makeId("event"), sortOrder: s.events.length });
        }),
      updateEvent: (event: WeddingEvent) =>
        store.update((s) => {
          const index = s.events.findIndex((item) => item.id === event.id);
          if (index >= 0) s.events[index] = event;
        }),
      deleteEvent: (id) =>
        store.update((s) => {
          s.events = s.events.filter((event) => event.id !== id);
          s.tasks = s.tasks.map((task) =>
            task.eventId === id ? { ...task, eventId: undefined } : task,
          );
        }),
    },
    tasks: {
      listTasks: async () => (await store.getSnapshot()).tasks,
      createTask: (task) =>
        store.update((s) => {
          s.tasks.push({ ...task, id: makeId("task") });
        }),
      updateTask: (task: Task) =>
        store.update((s) => {
          const index = s.tasks.findIndex((item) => item.id === task.id);
          if (index >= 0) s.tasks[index] = task;
        }),
      deleteTask: (id) =>
        store.update((s) => {
          s.tasks = s.tasks.filter((task) => task.id !== id);
        }),
    },
    budget: {
      listCategories: async () => (await store.getSnapshot()).categories,
      createCategory: (category) =>
        store.update((s) => {
          s.categories.push({
            ...category,
            id: makeId("category"),
            sortOrder: s.categories.length,
          });
        }),
      updateCategory: (category: BudgetCategory) =>
        store.update((s) => {
          const index = s.categories.findIndex((item) => item.id === category.id);
          if (index >= 0) s.categories[index] = category;
        }),
      deleteCategory: (id) =>
        store.update((s) => {
          s.categories = s.categories.filter((category) => category.id !== id);
          s.expenses = s.expenses.filter((expense) => expense.categoryId !== id);
        }),
    },
    expenses: {
      listExpenses: async () => (await store.getSnapshot()).expenses,
      createExpense: (expense) =>
        store.update((s) => {
          s.expenses.push({ ...expense, id: makeId("expense") });
        }),
      updateExpense: (expense: Expense) =>
        store.update((s) => {
          const index = s.expenses.findIndex((item) => item.id === expense.id);
          if (index >= 0) s.expenses[index] = expense;
        }),
      deleteExpense: (id) =>
        store.update((s) => {
          s.expenses = s.expenses.filter((expense) => expense.id !== id);
        }),
    },
  };
}
