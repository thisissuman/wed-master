export const inspirationCategories = [
  "decor",
  "outfits",
  "stage",
  "mehendi",
  "jewellery",
  "photography",
  "invitations",
  "flowers",
  "food",
  "venue",
  "other",
] as const;

export type InspirationCategory = (typeof inspirationCategories)[number];

export const inspirationCategoryLabels: Record<InspirationCategory, string> = {
  decor: "Décor",
  outfits: "Outfits",
  stage: "Stage",
  mehendi: "Mehendi",
  jewellery: "Jewellery",
  photography: "Photography",
  invitations: "Invitations",
  flowers: "Flowers",
  food: "Food",
  venue: "Venue",
  other: "Other",
};

export const inspirationSourceTypes = ["gallery", "camera"] as const;
export type InspirationSourceType = (typeof inspirationSourceTypes)[number];

export type InspirationMedia = {
  detailUri: string;
  detailWidth: number;
  detailHeight: number;
  detailSizeBytes: number;
  thumbnailUri: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailSizeBytes: number;
  mimeType: "image/webp";
};

/**
 * App-owned derivatives created before the save form is submitted. Keep this value in form state
 * after a failed save and remove it only when the user cancels or the saved record is deleted.
 */
export type InspirationMediaDraft = {
  id: string;
  sourceType: InspirationSourceType;
  media: InspirationMedia;
  createdAt: string;
};

export type Inspiration = {
  id: string;
  weddingId: string;
  category: InspirationCategory;
  sourceType: InspirationSourceType;
  media: InspirationMedia;
  title?: string;
  note?: string;
  eventId?: string;
  isFavourite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateInspirationInput = Pick<
  Inspiration,
  "weddingId" | "category" | "sourceType" | "media" | "title" | "note" | "eventId"
> &
  Partial<Pick<Inspiration, "isFavourite">>;

export type UpdateInspirationInput = Pick<Inspiration, "id" | "weddingId"> &
  Partial<Pick<Inspiration, "category" | "sourceType" | "media" | "title" | "note" | "eventId">>;

export type InspirationCursor = {
  createdAt: string;
  id: string;
};

export type InspirationListQuery = {
  weddingId: string;
  category?: InspirationCategory;
  favouriteOnly?: boolean;
  eventId?: string;
  search?: string;
  /** Event names remain workspace-owned; callers may provide them without duplicating them here. */
  eventNamesById?: Readonly<Record<string, string>>;
  cursor?: InspirationCursor;
  limit?: number;
};

export type InspirationPage = {
  items: Inspiration[];
  nextCursor?: InspirationCursor;
};

export type InspirationSnapshot = {
  version: 1;
  inspirations: Inspiration[];
};

export type InspirationMediaPickResult =
  | { status: "cancelled" }
  | {
      status: "permission-denied";
      source: InspirationSourceType;
      canAskAgain: boolean;
    }
  | { status: "selected"; draft: InspirationMediaDraft };

export type InspirationRepository = {
  list(query: InspirationListQuery): Promise<InspirationPage>;
  get(weddingId: string, id: string): Promise<Inspiration | null>;
  create(input: CreateInspirationInput): Promise<Inspiration>;
  update(input: UpdateInspirationInput): Promise<Inspiration>;
  setFavourite(weddingId: string, id: string, isFavourite: boolean): Promise<Inspiration>;
  delete(weddingId: string, id: string): Promise<Inspiration>;
  restore(inspiration: Inspiration): Promise<Inspiration>;
  unlinkEvent(weddingId: string, eventId: string): Promise<number>;
  repairEventLinks(weddingId: string, validEventIds: readonly string[]): Promise<number>;
  deleteWedding(weddingId: string): Promise<Inspiration[]>;
  clear(): Promise<Inspiration[]>;
  snapshot(): Promise<InspirationSnapshot>;
};
