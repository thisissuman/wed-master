import AsyncStorage from "@react-native-async-storage/async-storage";

import { InspirationCapacityError, StorageWriteError } from "@/lib/errors";
import { utf8ByteLength } from "@/lib/storage/utf8-byte-length";

import {
  createInspirationRecord,
  filterAndPageInspirations,
  updateInspirationRecord,
} from "./domain";
import { inspirationSchema, parseInspirationSnapshot } from "./schemas";
import type {
  CreateInspirationInput,
  Inspiration,
  InspirationRepository,
  InspirationSnapshot,
  UpdateInspirationInput,
} from "./types";

export const inspirationStorageKey = "@wed-master/local-inspirations/v1";
export const maximumInspirationSnapshotBytes = 1024 * 1024;

const emptySnapshot = (): InspirationSnapshot => ({ version: 1, inspirations: [] });
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const sharedOperationQueues = new WeakMap<object, Promise<void>>();

export type InspirationKeyValueStorage = Pick<typeof AsyncStorage, "getItem" | "setItem"> &
  Partial<Pick<typeof AsyncStorage, "removeItem">>;

export class InspirationCorruptionError extends Error {
  constructor(
    message: string,
    readonly recoveryText: string,
  ) {
    super(message);
    this.name = "InspirationCorruptionError";
  }
}

export class InspirationNotFoundError extends Error {
  constructor() {
    super("This inspiration no longer exists.");
    this.name = "InspirationNotFoundError";
  }
}

export type LocalInspirationStoreOptions = {
  createId?: () => string;
  now?: () => string;
};

function defaultId(): string {
  return `inspiration-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class LocalInspirationStore {
  private snapshotCache?: InspirationSnapshot;
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(
    private readonly storage: InspirationKeyValueStorage = AsyncStorage,
    options: LocalInspirationStoreOptions = {},
  ) {
    this.createId = options.createId ?? defaultId;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  getSnapshot(): Promise<InspirationSnapshot> {
    return this.runExclusive(() => this.getSnapshotUnlocked());
  }

  replace(snapshot: InspirationSnapshot): Promise<InspirationSnapshot> {
    return this.runExclusive(() => this.commitCandidate(snapshot, true));
  }

  update(mutator: (snapshot: InspirationSnapshot) => void): Promise<InspirationSnapshot> {
    return this.runExclusive(async () => {
      const candidate = await this.getSnapshotUnlocked();
      mutator(candidate);
      return this.commitCandidate(candidate);
    });
  }

  clear(): Promise<Inspiration[]> {
    return this.runExclusive(async () => {
      let deleted: Inspiration[] = [];
      try {
        deleted = (await this.getSnapshotUnlocked()).inspirations;
      } catch (error) {
        if (!(error instanceof InspirationCorruptionError)) throw error;
      }

      const snapshot = emptySnapshot();
      try {
        if (this.storage.removeItem) await this.storage.removeItem(inspirationStorageKey);
        else await this.storage.setItem(inspirationStorageKey, JSON.stringify(snapshot));
      } catch (error) {
        throw new StorageWriteError(error);
      }
      this.snapshotCache = snapshot;
      return clone(deleted);
    });
  }

  makeId(): string {
    return this.createId();
  }

  timestamp(): string {
    return this.now();
  }

  private async getSnapshotUnlocked(): Promise<InspirationSnapshot> {
    if (this.snapshotCache) return clone(this.snapshotCache);
    const stored = await this.storage.getItem(inspirationStorageKey);
    if (!stored) {
      const snapshot = emptySnapshot();
      this.snapshotCache = snapshot;
      return clone(snapshot);
    }

    try {
      const snapshot = parseInspirationSnapshot(JSON.parse(stored));
      this.snapshotCache = snapshot;
      return clone(snapshot);
    } catch {
      throw new InspirationCorruptionError(
        "Mangalya could not safely open the local inspiration board.",
        stored,
      );
    }
  }

  private async commitCandidate(
    candidate: InspirationSnapshot,
    requireWithinCapacity = false,
  ): Promise<InspirationSnapshot> {
    const validated = parseInspirationSnapshot(clone(candidate));
    const serialized = JSON.stringify(validated);
    const candidateBytes = utf8ByteLength(serialized);
    let currentBytes = 0;
    if (!requireWithinCapacity) {
      let current: string | null;
      try {
        current = await this.storage.getItem(inspirationStorageKey);
      } catch (error) {
        throw new StorageWriteError(error);
      }
      currentBytes = current ? utf8ByteLength(current) : 0;
    }
    if (
      candidateBytes > maximumInspirationSnapshotBytes &&
      (requireWithinCapacity || candidateBytes > currentBytes)
    ) {
      throw new InspirationCapacityError();
    }

    try {
      await this.storage.setItem(inspirationStorageKey, serialized);
    } catch (error) {
      throw new StorageWriteError(error);
    }
    this.snapshotCache = validated;
    return clone(validated);
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

function recordFor(snapshot: InspirationSnapshot, weddingId: string, id: string): Inspiration {
  const inspiration = snapshot.inspirations.find(
    (candidate) => candidate.id === id && candidate.weddingId === weddingId,
  );
  if (!inspiration) throw new InspirationNotFoundError();
  return inspiration;
}

export function createLocalInspirationRepository(
  store = new LocalInspirationStore(),
): InspirationRepository {
  return {
    snapshot: () => store.getSnapshot(),
    list: async (query) =>
      filterAndPageInspirations((await store.getSnapshot()).inspirations, query),
    get: async (weddingId, id) => {
      const inspiration = (await store.getSnapshot()).inspirations.find(
        (candidate) => candidate.id === id && candidate.weddingId === weddingId,
      );
      return inspiration ? clone(inspiration) : null;
    },
    create: async (input: CreateInspirationInput) => {
      const id = store.makeId();
      const created = createInspirationRecord(input, id, store.timestamp());
      await store.update((snapshot) => {
        if (snapshot.inspirations.some((candidate) => candidate.id === id)) {
          throw new Error("Could not create a unique inspiration ID.");
        }
        snapshot.inspirations.push(created);
      });
      return clone(created);
    },
    update: async (input: UpdateInspirationInput) => {
      let updated: Inspiration | undefined;
      await store.update((snapshot) => {
        const current = recordFor(snapshot, input.weddingId, input.id);
        updated = updateInspirationRecord(current, input, store.timestamp());
        const index = snapshot.inspirations.findIndex((candidate) => candidate.id === input.id);
        snapshot.inspirations[index] = updated;
      });
      if (!updated) throw new InspirationNotFoundError();
      return clone(updated);
    },
    setFavourite: async (weddingId, id, isFavourite) => {
      let updated: Inspiration | undefined;
      await store.update((snapshot) => {
        const current = recordFor(snapshot, weddingId, id);
        updated = inspirationSchema.parse({
          ...current,
          isFavourite,
          updatedAt: store.timestamp(),
        });
        const index = snapshot.inspirations.findIndex((candidate) => candidate.id === id);
        snapshot.inspirations[index] = updated;
      });
      if (!updated) throw new InspirationNotFoundError();
      return clone(updated);
    },
    delete: async (weddingId, id) => {
      let deleted: Inspiration | undefined;
      await store.update((snapshot) => {
        deleted = clone(recordFor(snapshot, weddingId, id));
        snapshot.inspirations = snapshot.inspirations.filter((candidate) => candidate.id !== id);
      });
      if (!deleted) throw new InspirationNotFoundError();
      return deleted;
    },
    restore: async (inspiration) => {
      const validated = inspirationSchema.parse(clone(inspiration));
      let restored = validated;
      await store.update((snapshot) => {
        const existing = snapshot.inspirations.find((candidate) => candidate.id === validated.id);
        if (existing) {
          if (existing.weddingId !== validated.weddingId) {
            throw new Error("Inspiration IDs must be unique across weddings.");
          }
          restored = clone(existing);
          return;
        }
        snapshot.inspirations.push(validated);
      });
      return clone(restored);
    },
    unlinkEvent: async (weddingId, eventId) => {
      let count = 0;
      const timestamp = store.timestamp();
      await store.update((snapshot) => {
        snapshot.inspirations = snapshot.inspirations.map((inspiration) => {
          if (inspiration.weddingId !== weddingId || inspiration.eventId !== eventId) {
            return inspiration;
          }
          count += 1;
          const unlinked = { ...inspiration, updatedAt: timestamp };
          delete unlinked.eventId;
          return inspirationSchema.parse(unlinked);
        });
      });
      return count;
    },
    repairEventLinks: async (weddingId, validEventIds) => {
      const validIds = new Set(validEventIds);
      const needsRepair = (await store.getSnapshot()).inspirations.some((inspiration) => {
        const eventId = inspiration.eventId;
        return (
          inspiration.weddingId === weddingId && eventId !== undefined && !validIds.has(eventId)
        );
      });
      if (!needsRepair) return 0;
      let count = 0;
      const timestamp = store.timestamp();
      await store.update((snapshot) => {
        snapshot.inspirations = snapshot.inspirations.map((inspiration) => {
          if (
            inspiration.weddingId !== weddingId ||
            !inspiration.eventId ||
            validIds.has(inspiration.eventId)
          ) {
            return inspiration;
          }
          count += 1;
          const repaired = { ...inspiration, updatedAt: timestamp };
          delete repaired.eventId;
          return inspirationSchema.parse(repaired);
        });
      });
      return count;
    },
    deleteWedding: async (weddingId) => {
      let deleted: Inspiration[] = [];
      await store.update((snapshot) => {
        deleted = snapshot.inspirations
          .filter((inspiration) => inspiration.weddingId === weddingId)
          .map(clone);
        snapshot.inspirations = snapshot.inspirations.filter(
          (inspiration) => inspiration.weddingId !== weddingId,
        );
      });
      return deleted;
    },
    clear: () => store.clear(),
  };
}
