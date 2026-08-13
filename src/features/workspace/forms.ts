import { z } from "zod";

import {
  eventColorKeys,
  householdSides,
  invitationStatuses,
  rsvpStatuses,
  serviceStatuses,
  taskPriorities,
  taskStatuses,
} from "./types";
import { keepsakeMessageMaxLength } from "./wedding-profile";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .or(z.literal(""));
const requiredDate = optionalDate.refine(Boolean, "Date is required.");
const optionalText = z.string().trim();
const positiveWholeNumberText = z
  .string()
  .trim()
  .regex(/^\d+$/, "Enter a whole number.")
  .refine((value) => Number(value) > 0, "Enter at least 1.");
const optionalTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time.")
  .or(z.literal(""));
const paiseText = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value),
    "Enter a valid non-negative amount.",
  )
  .refine(
    (value) => value === "" || Number.isSafeInteger(toPaise(value)),
    "Enter a smaller amount.",
  );

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Task title is required."),
  notes: optionalText,
  description: optionalText,
  category: optionalText,
  eventId: z.string(),
  dueDate: optionalDate,
  priority: z.enum(taskPriorities),
  status: z.enum(taskStatuses),
  responsiblePerson: optionalText,
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const eventFormSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required."),
    date: requiredDate,
    time: optionalTime,
    endTime: optionalTime,
    location: optionalText,
    notes: optionalText.max(500, "Keep notes under 500 characters."),
    colorToken: z.enum(eventColorKeys),
  })
  .superRefine((values, context) => {
    if (values.time && values.endTime && values.endTime <= values.time) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be later than start time.",
      });
    }
  });
export type EventFormValues = z.infer<typeof eventFormSchema>;

const positivePaiseText = paiseText.refine(
  (value) => toPaise(value) > 0,
  "Enter an amount greater than zero.",
);

export const quickExpenseFormSchema = z.object({
  title: z.string().trim().min(1, "Expense title is required."),
  categoryId: z.string().min(1, "Choose a category."),
  amount: positivePaiseText,
});
export type QuickExpenseFormValues = z.infer<typeof quickExpenseFormSchema>;

export const expenseDetailsFormSchema = z.object({
  date: requiredDate,
  notes: optionalText,
});
export type ExpenseDetailsFormValues = z.infer<typeof expenseDetailsFormSchema>;

export const expenseFormSchema = quickExpenseFormSchema.extend({
  date: requiredDate,
  notes: optionalText,
});
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const householdFormSchema = z.object({
  name: z.string().trim().min(1, "Household name is required."),
  side: z.enum(householdSides),
  guestCount: positiveWholeNumberText,
  rsvpStatus: z.enum(rsvpStatuses),
  invitationStatus: z.enum(invitationStatuses),
  accommodationStatus: z.enum(serviceStatuses),
  transportStatus: z.enum(serviceStatuses),
  notes: optionalText,
});
export type HouseholdFormValues = z.infer<typeof householdFormSchema>;

export const giftFormSchema = z.object({
  personName: z.string().trim().min(1, "Name is required."),
  relationship: optionalText,
  itemName: optionalText,
  value: paiseText,
});
export type GiftFormValues = z.infer<typeof giftFormSchema>;

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required."),
  role: z.string().trim().min(1, "Role is required."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{2,18}$/, "Enter a valid phone number."),
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const settingsFormSchema = z.object({
  name: z.string().trim().min(1, "Couple or wedding name is required."),
  date: requiredDate,
  location: z.string().trim().min(1, "City or location is required."),
  type: z.string().trim().min(1, "Wedding style or tradition is required."),
  keepsakeMessage: optionalText.max(
    keepsakeMessageMaxLength,
    `Keep the message under ${keepsakeMessageMaxLength} characters.`,
  ),
});
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export const setupFormSchema = z.object({
  name: z.string().trim().min(1, "Couple names are required."),
  date: requiredDate,
  budgetTarget: paiseText,
});
export type SetupFormValues = z.infer<typeof setupFormSchema>;

export function toPaise(value: string): number {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  return Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
}

export function fromPaise(paise?: number): string {
  if (paise === undefined) return "";
  return (paise / 100).toFixed(2);
}
