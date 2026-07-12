import { z } from "zod";

import { paymentStatuses, taskPriorities, taskStatuses } from "./types";

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .or(z.literal(""));
const optionalText = z.string().trim();
const paiseText = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+(\.\d{1,2})?$/.test(value),
    "Enter a valid non-negative amount.",
  );

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Task title is required."),
  notes: optionalText,
  eventId: z.string(),
  dueDate: optionalDate,
  priority: z.enum(taskPriorities),
  status: z.enum(taskStatuses),
  responsiblePerson: optionalText,
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;
export const eventFormSchema = z.object({
  name: z.string().trim().min(1, "Event name is required."),
  date: optionalDate.refine(Boolean, "Date is required."),
  time: optionalText,
  location: optionalText,
  notes: optionalText,
});
export type EventFormValues = z.infer<typeof eventFormSchema>;
export const expenseFormSchema = z
  .object({
    title: z.string().trim().min(1, "Expense title is required."),
    categoryId: z.string().min(1, "Choose a category."),
    estimated: paiseText,
    actual: paiseText.refine(Boolean, "Actual amount is required."),
    paid: paiseText.refine(Boolean, "Paid amount is required."),
    paymentStatus: z.enum(paymentStatuses),
    vendorName: optionalText,
    dueDate: optionalDate,
    notes: optionalText,
  })
  .superRefine((values, context) => {
    if (toPaise(values.paid) > toPaise(values.actual))
      context.addIssue({
        code: "custom",
        path: ["paid"],
        message: "Paid amount cannot exceed actual amount.",
      });
  });
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
export function toPaise(value: string): number {
  const [whole = "0", fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function fromPaise(paise?: number): string {
  if (paise === undefined) return "";
  return (paise / 100).toFixed(2);
}
