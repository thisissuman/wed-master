import {
  createInspirationRecord,
  filterAndPageInspirations,
  updateInspirationRecord,
} from "./domain";
import { inspirationSnapshotSchema } from "./schemas";
import type { CreateInspirationInput, Inspiration } from "./types";

function input(
  id: string,
  overrides: Partial<CreateInspirationInput> = {},
): CreateInspirationInput {
  return {
    weddingId: "wedding-1",
    category: "decor",
    sourceType: "gallery",
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
    ...overrides,
  };
}

function record(
  id: string,
  createdAt: string,
  overrides: Partial<CreateInspirationInput> = {},
): Inspiration {
  return createInspirationRecord(input(id, overrides), id, createdAt);
}

describe("Inspire domain", () => {
  it("normalizes optional copy and preserves natural image metadata", () => {
    const inspiration = createInspirationRecord(
      input("one", {
        title: "  Pastel   floral mandap  ",
        note: "  Ask the decorator.  ",
      }),
      "one",
      "2026-08-24T10:00:00.000Z",
    );

    expect(inspiration).toMatchObject({
      title: "Pastel floral mandap",
      note: "Ask the decorator.",
      isFavourite: false,
      media: { detailWidth: 1600, detailHeight: 1200, mimeType: "image/webp" },
    });
  });

  it("clears optional edit fields without allowing ownership changes", () => {
    const current = record("one", "2026-08-24T10:00:00.000Z", {
      title: "Mandap",
      note: "Lavender flowers",
      eventId: "event-1",
    });
    const updated = updateInspirationRecord(
      current,
      {
        id: "one",
        weddingId: "wedding-1",
        title: "  ",
        eventId: undefined,
      },
      "2026-08-24T11:00:00.000Z",
    );

    expect(updated.title).toBeUndefined();
    expect(updated.eventId).toBeUndefined();
    expect(updated.note).toBe("Lavender flowers");
    expect(() =>
      updateInspirationRecord(
        current,
        { id: "one", weddingId: "wedding-2", title: "Changed" },
        "2026-08-24T11:00:00.000Z",
      ),
    ).toThrow("ownership");
  });

  it("uses a stable created-at and ID cursor even if the cursor row disappears", () => {
    const timestamp = "2026-08-24T10:00:00.000Z";
    const inspirations = ["a", "b", "c", "d"].map((id) => record(id, timestamp));
    const first = filterAndPageInspirations(inspirations, { weddingId: "wedding-1", limit: 2 });

    expect(first.items.map(({ id }) => id)).toEqual(["d", "c"]);
    expect(first.nextCursor).toEqual({ createdAt: timestamp, id: "c" });

    const changed = [record("e", timestamp), ...inspirations.filter(({ id }) => id !== "c")];
    const second = filterAndPageInspirations(changed, {
      weddingId: "wedding-1",
      limit: 2,
      cursor: first.nextCursor,
    });
    expect(second.items.map(({ id }) => id)).toEqual(["b", "a"]);
  });

  it("combines category, favourite, event, and accent-insensitive search", () => {
    const timestamp = "2026-08-24T10:00:00.000Z";
    const inspirations = [
      record("mandap", timestamp, {
        category: "decor",
        eventId: "event-reception",
        isFavourite: true,
        note: "Hanging flowers",
      }),
      record("outfit", timestamp, {
        category: "outfits",
        isFavourite: true,
        title: "Ivory lehenga",
      }),
    ];
    const page = filterAndPageInspirations(inspirations, {
      weddingId: "wedding-1",
      category: "decor",
      favouriteOnly: true,
      search: "décor reception",
      eventNamesById: { "event-reception": "Reception" },
    });

    expect(page.items.map(({ id }) => id)).toEqual(["mandap"]);
  });

  it("rejects duplicate media ownership in a snapshot", () => {
    const first = record("one", "2026-08-24T10:00:00.000Z");
    const second = { ...record("two", "2026-08-24T11:00:00.000Z"), media: first.media };

    expect(
      inspirationSnapshotSchema.safeParse({ version: 1, inspirations: [first, second] }).success,
    ).toBe(false);
  });

  it("keeps shared authorship fields outside the device-local Phase 1 contract", () => {
    const inspiration = record("one", "2026-08-24T10:00:00.000Z");

    expect(
      inspirationSnapshotSchema.safeParse({
        version: 1,
        inspirations: [{ ...inspiration, savedByName: "Someone" }],
      }).success,
    ).toBe(false);
  });
});
