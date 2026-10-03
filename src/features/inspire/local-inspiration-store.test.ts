import { InspirationCapacityError, StorageWriteError } from "@/lib/errors";
import { utf8ByteLength } from "@/lib/storage/utf8-byte-length";

import {
  createLocalInspirationRepository,
  InspirationCorruptionError,
  inspirationStorageKey,
  LocalInspirationStore,
  maximumInspirationSnapshotBytes,
} from "./local-inspiration-store";
import type { CreateInspirationInput, InspirationSnapshot } from "./types";

function input(id: string, weddingId = "wedding-1"): CreateInspirationInput {
  return {
    weddingId,
    category: id.includes("outfit") ? "outfits" : "decor",
    sourceType: "gallery",
    title: id,
    eventId: id.includes("event") ? "event-1" : undefined,
    media: {
      detailUri: `file:///documents/mangalya/inspiration-media/${id}-detail.webp`,
      detailWidth: 1600,
      detailHeight: 1200,
      detailSizeBytes: 100_000,
      thumbnailUri: `file:///documents/mangalya/inspiration-media/${id}-thumbnail.webp`,
      thumbnailWidth: 720,
      thumbnailHeight: 540,
      thumbnailSizeBytes: 20_000,
      mimeType: "image/webp",
    },
  };
}

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(inspirationStorageKey, initial);
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

function repositoryWith(
  ids: string[],
  times: string[] = ids.map((_, index) => new Date(index + 1).toISOString()),
  storage = memoryStorage(),
) {
  let idIndex = 0;
  let timeIndex = 0;
  const store = new LocalInspirationStore(storage, {
    createId: () => ids[idIndex++] ?? `extra-${idIndex}`,
    now: () => times[timeIndex++] ?? times.at(-1) ?? new Date(0).toISOString(),
  });
  return { repository: createLocalInspirationRepository(store), storage, store };
}

function oversizedSnapshot(): InspirationSnapshot {
  const createdAt = "2026-08-24T10:00:00.000Z";
  return {
    version: 1,
    inspirations: Array.from({ length: 240 }, (_, index) => ({
      id: `inspiration-${index}`,
      weddingId: "wedding-1",
      category: "decor" as const,
      sourceType: "gallery" as const,
      title: `Inspiration ${index}`,
      note: "अ".repeat(2_000),
      isFavourite: false,
      createdAt,
      updatedAt: createdAt,
      media: {
        detailUri: `file:///documents/mangalya/inspiration-media/${index}-detail.webp`,
        detailWidth: 1600,
        detailHeight: 1200,
        detailSizeBytes: 100_000,
        thumbnailUri: `file:///documents/mangalya/inspiration-media/${index}-thumbnail.webp`,
        thumbnailWidth: 720,
        thumbnailHeight: 540,
        thumbnailSizeBytes: 20_000,
        mimeType: "image/webp" as const,
      },
    })),
  };
}

describe("LocalInspirationStore", () => {
  it("starts with an empty board without writing into the workspace snapshot", async () => {
    const { repository, storage } = repositoryWith(["one"]);

    await expect(repository.snapshot()).resolves.toEqual({ version: 1, inspirations: [] });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(inspirationStorageKey).toBe("@wed-master/local-inspirations/v1");
  });

  it("serializes concurrent creates and reloads the separate snapshot", async () => {
    const { repository, storage } = repositoryWith(["one", "two"]);
    await Promise.all([repository.create(input("one")), repository.create(input("two"))]);

    const reloaded = createLocalInspirationRepository(new LocalInspirationStore(storage));
    expect((await reloaded.snapshot()).inspirations.map(({ id }) => id).sort()).toEqual([
      "one",
      "two",
    ]);
  });

  it("does not leak an unpersisted create into the in-memory cache", async () => {
    const storage = memoryStorage();
    storage.setItem.mockRejectedValueOnce(new Error("Disk full"));
    const { repository } = repositoryWith(["one"], undefined, storage);

    await expect(repository.create(input("one"))).rejects.toBeInstanceOf(StorageWriteError);
    await expect(repository.snapshot()).resolves.toEqual({ version: 1, inspirations: [] });
  });

  it("wraps adapter failures while checking capacity without changing cached metadata", async () => {
    const storage = memoryStorage();
    let failRead = false;
    storage.getItem.mockImplementation(async (key: string) => {
      if (failRead) throw new Error("Adapter offline");
      return storage.values.get(key) ?? null;
    });
    const { repository } = repositoryWith(["one"], undefined, storage);
    await repository.snapshot();
    failRead = true;

    await expect(repository.create(input("one"))).rejects.toBeInstanceOf(StorageWriteError);

    failRead = false;
    await expect(repository.snapshot()).resolves.toEqual({ version: 1, inspirations: [] });
  });

  it("rejects an oversized replacement before writing", async () => {
    const storage = memoryStorage();
    const store = new LocalInspirationStore(storage);

    expect(utf8ByteLength(JSON.stringify(oversizedSnapshot()))).toBeGreaterThan(
      maximumInspirationSnapshotBytes,
    );
    await expect(store.replace(oversizedSnapshot())).rejects.toBeInstanceOf(
      InspirationCapacityError,
    );
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("opens existing oversized metadata, permits shrinkage, and rejects growth", async () => {
    const existing = oversizedSnapshot();
    const serialized = JSON.stringify(existing);
    const storage = memoryStorage(serialized);
    const store = new LocalInspirationStore(storage);

    await expect(store.getSnapshot()).resolves.toMatchObject({ version: 1 });
    await expect(
      store.update((snapshot) => {
        const first = snapshot.inspirations[0];
        if (!first) throw new Error("Oversized fixture needs an inspiration.");
        snapshot.inspirations.push({
          ...first,
          id: "inspiration-growth",
          note: "अ",
          media: {
            ...first.media,
            detailUri: "file:///documents/mangalya/inspiration-media/growth-detail.webp",
            thumbnailUri: "file:///documents/mangalya/inspiration-media/growth-thumbnail.webp",
          },
        });
      }),
    ).rejects.toBeInstanceOf(InspirationCapacityError);
    expect(storage.values.get(inspirationStorageKey)).toBe(serialized);

    await expect(
      store.update((snapshot) => {
        snapshot.inspirations.pop();
      }),
    ).resolves.toHaveProperty("inspirations.length", existing.inspirations.length - 1);
  });

  it("filters, favourites, edits, and unlinks only the requested wedding event", async () => {
    const { repository } = repositoryWith(
      ["event-decor", "event-outfit", "other-wedding"],
      [
        "2026-08-24T10:00:00.000Z",
        "2026-08-24T11:00:00.000Z",
        "2026-08-24T12:00:00.000Z",
        "2026-08-24T13:00:00.000Z",
        "2026-08-24T14:00:00.000Z",
      ],
    );
    const decor = await repository.create(input("event-decor"));
    await repository.create(input("event-outfit"));
    await repository.create(input("event-other-wedding", "wedding-2"));
    await repository.setFavourite("wedding-1", decor.id, true);

    const favourites = await repository.list({
      weddingId: "wedding-1",
      favouriteOnly: true,
      category: "decor",
    });
    expect(favourites.items.map(({ id }) => id)).toEqual(["event-decor"]);

    await repository.update({
      id: decor.id,
      weddingId: "wedding-1",
      title: "Lavender mandap",
    });
    await expect(repository.unlinkEvent("wedding-1", "event-1")).resolves.toBe(2);
    expect((await repository.get("wedding-1", decor.id))?.eventId).toBeUndefined();
    expect((await repository.get("wedding-2", "other-wedding"))?.eventId).toBe("event-1");
  });

  it("repairs only stale event links and is idempotent on restart", async () => {
    const { repository, storage } = repositoryWith(
      ["event-valid", "event-stale", "other-wedding"],
      [
        "2026-08-24T10:00:00.000Z",
        "2026-08-24T11:00:00.000Z",
        "2026-08-24T12:00:00.000Z",
        "2026-08-24T13:00:00.000Z",
      ],
    );
    const valid = await repository.create(input("event-valid"));
    const stale = await repository.create(input("event-stale"));
    const other = await repository.create(input("event-other-wedding", "wedding-2"));
    await repository.update({ id: valid.id, weddingId: "wedding-1", eventId: "event-1" });
    await repository.update({ id: stale.id, weddingId: "wedding-1", eventId: "deleted-event" });

    const writesBeforeRepair = storage.setItem.mock.calls.length;
    await expect(repository.repairEventLinks("wedding-1", ["event-1"])).resolves.toBe(1);
    const writesAfterRepair = storage.setItem.mock.calls.length;
    await expect(repository.repairEventLinks("wedding-1", ["event-1"])).resolves.toBe(0);
    expect(writesAfterRepair).toBe(writesBeforeRepair + 1);
    expect(storage.setItem.mock.calls.length).toBe(writesAfterRepair);
    expect((await repository.get("wedding-1", valid.id))?.eventId).toBe("event-1");
    expect((await repository.get("wedding-1", stale.id))?.eventId).toBeUndefined();
    expect((await repository.get("wedding-2", other.id))?.eventId).toBe("event-1");
  });

  it("supports delete/restore and wedding-scoped cleanup without deleting files implicitly", async () => {
    const { repository } = repositoryWith(["one", "two"]);
    const one = await repository.create(input("one"));
    await repository.create(input("two", "wedding-2"));

    const deleted = await repository.delete("wedding-1", one.id);
    await expect(repository.get("wedding-1", one.id)).resolves.toBeNull();
    await repository.restore(deleted);
    await expect(repository.get("wedding-1", one.id)).resolves.toMatchObject({ id: "one" });

    await expect(repository.deleteWedding("wedding-1")).resolves.toHaveLength(1);
    expect((await repository.snapshot()).inspirations.map(({ weddingId }) => weddingId)).toEqual([
      "wedding-2",
    ]);
  });

  it("clears every wedding from the separate inspiration document", async () => {
    const { repository } = repositoryWith(["one", "two"]);
    await repository.create(input("one"));
    await repository.create(input("two", "wedding-2"));

    await expect(repository.clear()).resolves.toHaveLength(2);
    await expect(repository.snapshot()).resolves.toEqual({ version: 1, inspirations: [] });
  });

  it("surfaces corrupted JSON without replacing it", async () => {
    const storage = memoryStorage('{"version":1,"inspirations":"broken"}');
    const store = new LocalInspirationStore(storage);

    await expect(store.getSnapshot()).rejects.toBeInstanceOf(InspirationCorruptionError);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.values.get(inspirationStorageKey)).toContain("broken");
  });

  it("allows an explicit full cleanup to recover a corrupted inspiration document", async () => {
    const storage = memoryStorage('{"version":1,"inspirations":"broken"}');
    const repository = createLocalInspirationRepository(new LocalInspirationStore(storage));

    await expect(repository.clear()).resolves.toEqual([]);
    await expect(repository.snapshot()).resolves.toEqual({ version: 1, inspirations: [] });
  });
});
