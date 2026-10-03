import {
  createInspirationInputSchema,
  inspirationSchema,
  updateInspirationInputSchema,
} from "./schemas";
import {
  inspirationCategoryLabels,
  type CreateInspirationInput,
  type Inspiration,
  type InspirationListQuery,
  type InspirationPage,
  type UpdateInspirationInput,
} from "./types";

const defaultPageSize = 30;
export const maximumInspirationPageSize = 100;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized : undefined;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-IN");
}

function compareNewestFirst(left: Inspiration, right: Inspiration): number {
  return right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id);
}

function fallsAfterCursor(inspiration: Inspiration, query: InspirationListQuery): boolean {
  if (!query.cursor) return true;
  return (
    inspiration.createdAt < query.cursor.createdAt ||
    (inspiration.createdAt === query.cursor.createdAt && inspiration.id < query.cursor.id)
  );
}

function matchesSearch(inspiration: Inspiration, query: InspirationListQuery): boolean {
  const search = query.search ? normalizeSearchText(query.search) : "";
  if (!search) return true;

  const eventName = inspiration.eventId ? query.eventNamesById?.[inspiration.eventId] : undefined;
  const searchable = normalizeSearchText(
    [
      inspiration.title,
      inspiration.note,
      inspiration.category,
      inspirationCategoryLabels[inspiration.category],
      eventName,
    ]
      .filter(Boolean)
      .join(" "),
  );
  return search.split(" ").every((term) => searchable.includes(term));
}

export function filterAndPageInspirations(
  inspirations: readonly Inspiration[],
  query: InspirationListQuery,
): InspirationPage {
  const weddingId = query.weddingId.trim();
  if (!weddingId) throw new Error("A wedding is required to list inspiration.");

  const requestedLimit = query.limit ?? defaultPageSize;
  const limit = Math.min(Math.max(Math.trunc(requestedLimit), 1), maximumInspirationPageSize);
  const matching = inspirations
    .filter(
      (inspiration) =>
        inspiration.weddingId === weddingId &&
        (!query.category || inspiration.category === query.category) &&
        (!query.favouriteOnly || inspiration.isFavourite) &&
        (!query.eventId || inspiration.eventId === query.eventId) &&
        fallsAfterCursor(inspiration, query) &&
        matchesSearch(inspiration, query),
    )
    .sort(compareNewestFirst)
    .slice(0, limit + 1);

  const hasMore = matching.length > limit;
  const items = matching.slice(0, limit).map(clone);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      hasMore && last
        ? {
            createdAt: last.createdAt,
            id: last.id,
          }
        : undefined,
  };
}

export function createInspirationRecord(
  input: CreateInspirationInput,
  id: string,
  timestamp: string,
): Inspiration {
  const normalized = createInspirationInputSchema.parse({
    ...input,
    title: normalizeOptionalText(input.title),
    note: normalizeOptionalText(input.note),
  });
  return inspirationSchema.parse({
    ...normalized,
    id,
    isFavourite: normalized.isFavourite ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function updateInspirationRecord(
  current: Inspiration,
  input: UpdateInspirationInput,
  timestamp: string,
): Inspiration {
  const normalized = updateInspirationInputSchema.parse({
    ...input,
    title: hasOwn(input, "title") ? normalizeOptionalText(input.title) : undefined,
    note: hasOwn(input, "note") ? normalizeOptionalText(input.note) : undefined,
  });
  if (current.id !== normalized.id || current.weddingId !== normalized.weddingId) {
    throw new Error("Inspiration ownership cannot be changed.");
  }

  const next: Inspiration = { ...current, updatedAt: timestamp };
  for (const key of ["category", "sourceType", "media", "title", "note", "eventId"] as const) {
    if (hasOwn(input, key)) {
      const value = normalized[key];
      if (value === undefined) delete next[key];
      else Object.assign(next, { [key]: value });
    }
  }
  return inspirationSchema.parse(next);
}
