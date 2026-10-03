import { z } from "zod";

import { inspirationCategories } from "./types";
import { inspirationNoteMaxLength, inspirationTitleMaxLength } from "./schemas";

export const inspirationFormSchema = z.object({
  category: z.enum(inspirationCategories, { error: "Choose a category." }),
  eventId: z.string().trim().max(200).optional(),
  note: z.string().trim().max(inspirationNoteMaxLength, "Keep notes under 2,000 characters."),
  title: z.string().trim().max(inspirationTitleMaxLength, "Keep the title under 120 characters."),
});

export type InspirationFormValues = z.infer<typeof inspirationFormSchema>;
