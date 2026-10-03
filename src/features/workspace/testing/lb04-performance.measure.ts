import { filterAndPageInspirations } from "@/features/inspire/domain";
import type { Inspiration } from "@/features/inspire/types";
import { formatInr } from "@/lib/money";
import { utf8ByteLength } from "@/lib/storage/utf8-byte-length";

import { buildEventDetailItems } from "../details/event-detail-items";
import {
  createLocalRepositories,
  LocalWorkspaceStore,
  workspaceStorageKey,
  type KeyValueStorage,
} from "../local-repositories";
import {
  filterHouseholds,
  filterTasks,
  selectExpenseDateGroups,
  taskProgressByEvent,
  taskSummary,
} from "../selectors";
import { parseOrMigrateWorkspaceSnapshot } from "../workspace-schema";
import { createStressWorkspace } from "./stress-fixture";

type TimingSummary = {
  iterations: number;
  medianMs: number;
  p95Ms: number;
};

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  constructor(serializedWorkspace: string) {
    this.values.set(workspaceStorageKey, serializedWorkspace);
  }

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

function percentile(sorted: readonly number[], fraction: number): number {
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}

async function measure(
  operation: () => void | Promise<void>,
  iterations = 30,
  warmups = 5,
): Promise<TimingSummary> {
  for (let index = 0; index < warmups; index += 1) await operation();

  const timings: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now();
    await operation();
    timings.push(performance.now() - startedAt);
  }
  timings.sort((left, right) => left - right);

  return {
    iterations,
    medianMs: Number(percentile(timings, 0.5).toFixed(2)),
    p95Ms: Number(percentile(timings, 0.95).toFixed(2)),
  };
}

function createInspirations(weddingId: string, count = 200): Inspiration[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `stress-inspiration-${index}`,
    weddingId,
    category: index % 2 === 0 ? ("decor" as const) : ("outfits" as const),
    sourceType: "gallery" as const,
    media: {
      detailUri: `file:///documents/mangalya/inspiration-media/${index}-detail.webp`,
      detailWidth: 1_600,
      detailHeight: 1_200,
      detailSizeBytes: 900_000,
      thumbnailUri: `file:///documents/mangalya/inspiration-media/${index}-thumbnail.webp`,
      thumbnailWidth: 720,
      thumbnailHeight: 540,
      thumbnailSizeBytes: 90_000,
      mimeType: "image/webp" as const,
    },
    title: `Lavender wedding inspiration ${index}`,
    note: `Searchable family decoration reference ${index}`,
    isFavourite: index % 3 === 0,
    createdAt: new Date(Date.UTC(2026, 6, 1, 0, 0, index)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 6, 1, 0, 0, index)).toISOString(),
  }));
}

const runMeasurement = process.env.LB04_MEASURE === "1" ? describe : describe.skip;

runMeasurement("LB-04 host diagnostics", () => {
  jest.setTimeout(30_000);

  it("measures deterministic stress paths without setting device acceptance claims", async () => {
    const workspace = createStressWorkspace();
    const serialized = JSON.stringify(workspace);
    const event = workspace.events[0];
    const task = workspace.tasks[0];
    const category = workspace.categories[0];
    if (!event || !task || !category) throw new Error("Stress fixture is incomplete.");

    const schemaParse = await measure(() => {
      parseOrMigrateWorkspaceSnapshot(workspace);
    });
    const hydration = await measure(async () => {
      await new LocalWorkspaceStore(new MemoryStorage(serialized)).getSnapshot();
    });
    const taskPersistence = await measure(async () => {
      const store = new LocalWorkspaceStore(new MemoryStorage(serialized));
      await store.getSnapshot();
      const repositories = createLocalRepositories(store);
      await repositories.tasks.updateTaskStatus(task.id, "Completed");
    });
    const expensePersistence = await measure(async () => {
      const store = new LocalWorkspaceStore(new MemoryStorage(serialized));
      await store.getSnapshot();
      const repositories = createLocalRepositories(store);
      await repositories.expenses.createExpense({
        title: "Measured expense",
        categoryId: category.id,
        actualPaise: 45_000,
        date: "2026-07-23",
      });
    });
    const listPreparation = await measure(() => {
      filterTasks(workspace.tasks, { priority: "All", status: "All" }).sort((left, right) =>
        left.title.localeCompare(right.title),
      );
      taskProgressByEvent(workspace.tasks);
      taskSummary(workspace.tasks, "2026-09-07");
      filterHouseholds(workspace.households, {
        needsSupport: true,
        query: "family",
        status: "All",
      });
      selectExpenseDateGroups(workspace.expenses);
      buildEventDetailItems(event, workspace.tasks, workspace.expenses);
    });
    const moneyFormatting = await measure(() => {
      for (const expense of workspace.expenses) formatInr(expense.actualPaise);
    });
    const inspirations = createInspirations(workspace.wedding.id);
    const inspirationQuery = await measure(() => {
      filterAndPageInspirations(inspirations, {
        weddingId: workspace.wedding.id,
        favouriteOnly: true,
        search: "lavender decoration",
        limit: 30,
      });
    });

    const report = {
      environment:
        "Jest host process with in-memory storage; excludes Android disk, bridge, UI, and images",
      fixture: {
        bytes: utf8ByteLength(serialized),
        expenses: workspace.expenses.length,
        guests: workspace.households.flatMap((household) => household.guests).length,
        inspirations: inspirations.length,
        tasks: workspace.tasks.length,
      },
      timingsMs: {
        expensePersistence,
        hydration,
        inspirationQuery,
        listPreparation,
        moneyFormatting500: moneyFormatting,
        schemaParse,
        taskPersistence,
      },
    };

    console.log(`LB04_MEASUREMENT ${JSON.stringify(report)}`);
    expect(parseOrMigrateWorkspaceSnapshot(workspace)).toEqual(workspace);
  });
});
