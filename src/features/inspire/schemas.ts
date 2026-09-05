import { z } from "zod";

import {
  inspirationCategories,
  inspirationSourceTypes,
  type CreateInspirationInput,
  type Inspiration,
  type InspirationMedia,
  type InspirationSnapshot,
  type UpdateInspirationInput,
} from "./types";

export const inspirationTitleMaxLength = 120;
export const inspirationNoteMaxLength = 2_000;
export const maximumInspirationsPerWedding = 10_000;
export const maximumInspirationMediaBytes = 15 * 1024 * 1024;

const idSchema = z.string().trim().min(1).max(200);
const localUriSchema = z.string().trim().min(1).max(4_096);
const optionalTitleSchema = z.string().trim().min(1).max(inspirationTitleMaxLength).optional();
const optionalNoteSchema = z.string().trim().min(1).max(inspirationNoteMaxLength).optional();
const dimensionSchema = z.number().int().positive().max(100_000);
const sizeSchema = z.number().int().positive().max(maximumInspirationMediaBytes);

export const inspirationMediaSchema: z.ZodType<InspirationMedia> = z
  .object({
    detailUri: localUriSchema,
    detailWidth: dimensionSchema,
    detailHeight: dimensionSchema,
    detailSizeBytes: sizeSchema,
    thumbnailUri: localUriSchema,
    thumbnailWidth: dimensionSchema,
    thumbnailHeight: dimensionSchema,
    thumbnailSizeBytes: sizeSchema,
    mimeType: z.literal("image/webp"),
  })
  .strict();

export const inspirationSchema: z.ZodType<Inspiration> = z
  .object({
    id: idSchema,
    weddingId: idSchema,
    category: z.enum(inspirationCategories),
    sourceType: z.enum(inspirationSourceTypes),
    media: inspirationMediaSchema,
    title: optionalTitleSchema,
    note: optionalNoteSchema,
    eventId: idSchema.optional(),
    isFavourite: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .refine((value) => value.updatedAt >= value.createdAt, {
    message: "Updated time cannot be before creation time.",
    path: ["updatedAt"],
  });

export const createInspirationInputSchema: z.ZodType<CreateInspirationInput> = z
  .object({
    weddingId: idSchema,
    category: z.enum(inspirationCategories),
    sourceType: z.enum(inspirationSourceTypes),
    media: inspirationMediaSchema,
    title: optionalTitleSchema,
    note: optionalNoteSchema,
    eventId: idSchema.optional(),
    isFavourite: z.boolean().optional(),
  })
  .strict();

export const updateInspirationInputSchema: z.ZodType<UpdateInspirationInput> = z
  .object({
    id: idSchema,
    weddingId: idSchema,
    category: z.enum(inspirationCategories).optional(),
    sourceType: z.enum(inspirationSourceTypes).optional(),
    media: inspirationMediaSchema.optional(),
    title: optionalTitleSchema,
    note: optionalNoteSchema,
    eventId: idSchema.optional(),
  })
  .strict();

export const inspirationSnapshotSchema: z.ZodType<InspirationSnapshot> = z
  .object({
    version: z.literal(1),
    inspirations: z.array(inspirationSchema).max(maximumInspirationsPerWedding),
  })
  .strict()
  .superRefine((snapshot, context) => {
    const ids = new Set<string>();
    const mediaUris = new Set<string>();
    const weddingCounts = new Map<string, number>();

    snapshot.inspirations.forEach((inspiration, index) => {
      if (ids.has(inspiration.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inspirations", index, "id"],
          message: "Inspiration IDs must be unique.",
        });
      }
      ids.add(inspiration.id);

      for (const [field, uri] of [
        ["detailUri", inspiration.media.detailUri],
        ["thumbnailUri", inspiration.media.thumbnailUri],
      ] as const) {
        if (mediaUris.has(uri)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["inspirations", index, "media", field],
            message: "Inspiration media files must not be shared by multiple records.",
          });
        }
        mediaUris.add(uri);
      }

      const count = (weddingCounts.get(inspiration.weddingId) ?? 0) + 1;
      weddingCounts.set(inspiration.weddingId, count);
      if (count > maximumInspirationsPerWedding) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inspirations", index],
          message: "This wedding has too many inspiration records.",
        });
      }
    });
  });

export function parseInspirationSnapshot(value: unknown): InspirationSnapshot {
  return inspirationSnapshotSchema.parse(value);
}
