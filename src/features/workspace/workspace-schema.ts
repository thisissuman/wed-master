import { z } from "zod";

import type { ISODate, WorkspaceSnapshot, WorkspaceSnapshotV1 } from "./types";
import {
  eventColorKeys,
  eventIconKeys,
  giftKinds,
  giftProgressStatuses,
  householdSides,
  invitationStatuses,
  paymentStatuses,
  rsvpStatuses,
  serviceStatuses,
  taskPriorities,
  taskStatuses,
} from "./types";

const isoDateSchema = z.custom<ISODate>(
  (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value),
  "Use YYYY-MM-DD.",
);
const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  uri: z.string(),
  mimeType: z.string(),
  size: z.number().nonnegative(),
  createdAt: z.string(),
});
const weddingSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  date: isoDateSchema,
  location: z.string(),
  currency: z.literal("INR"),
  coverPhotoUri: z.string().optional(),
  guestEstimate: z.number().int().nonnegative().optional(),
  budgetTargetPaise: z.number().int().nonnegative().optional(),
});
const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: isoDateSchema,
  coverPhotoUri: z.string().optional(),
  time: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  colorToken: z.enum(eventColorKeys).optional(),
  iconKey: z.enum(eventIconKeys).optional(),
  requiredItems: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      completed: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
  ),
  sortOrder: z.number().int(),
});
const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  notes: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  eventId: z.string().optional(),
  dueDate: isoDateSchema.optional(),
  priority: z.enum(taskPriorities),
  status: z.enum(taskStatuses),
  responsiblePerson: z.string().optional(),
  checklist: z.array(z.object({ id: z.string(), title: z.string(), completed: z.boolean() })),
  attachments: z.array(attachmentSchema),
});
const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
});
const expenseSchema = z.object({
  id: z.string(),
  title: z.string(),
  categoryId: z.string(),
  estimatedPaise: z.number().int().nonnegative().optional(),
  actualPaise: z.number().int().nonnegative(),
  paidPaise: z.number().int().nonnegative(),
  paymentStatus: z.enum(paymentStatuses),
  date: isoDateSchema.optional(),
  eventId: z.string().optional(),
  vendorName: z.string().optional(),
  dueDate: isoDateSchema.optional(),
  notes: z.string().optional(),
  receipt: attachmentSchema.optional(),
});
const householdSchema = z.object({
  id: z.string(),
  name: z.string(),
  side: z.enum(householdSides),
  guestCount: z.number().int().positive().optional(),
  invitationStatus: z.enum(invitationStatuses),
  accommodationStatus: z.enum(serviceStatuses),
  transportStatus: z.enum(serviceStatuses),
  notes: z.string().optional(),
  guests: z.array(z.object({ id: z.string(), name: z.string(), rsvpStatus: z.enum(rsvpStatuses) })),
});
const giftSchema = z.object({
  id: z.string(),
  kind: z.enum(giftKinds),
  personName: z.string(),
  relationship: z.string().optional(),
  itemName: z.string(),
  valuePaise: z.number().int().nonnegative().optional(),
  valueIsEstimated: z.boolean().optional(),
  date: isoDateSchema.optional(),
  thankedStatus: z.enum(giftProgressStatuses),
  thankedDate: isoDateSchema.optional(),
  returnGiftStatus: z.enum(giftProgressStatuses),
  returnGiftDate: isoDateSchema.optional(),
  notes: z.string().optional(),
});
const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  phone: z.string(),
  iconKey: z.string().optional(),
});
const backupHistorySchema = z.object({
  id: z.string(),
  kind: z.enum(["backup", "expenses-csv", "tasks-csv", "guests-csv"]),
  fileName: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: z.string(),
  uri: z.string(),
});

export const workspaceSnapshotSchema: z.ZodType<WorkspaceSnapshot> = z.object({
  version: z.literal(2),
  wedding: weddingSchema,
  events: z.array(eventSchema),
  tasks: z.array(taskSchema),
  categories: z.array(categorySchema),
  expenses: z.array(expenseSchema),
  households: z.array(householdSchema),
  gifts: z.array(giftSchema),
  emergencyContacts: z.array(contactSchema),
  backupHistory: z.array(backupHistorySchema),
});

const legacyEventSchema = eventSchema.omit({
  coverPhotoUri: true,
  endTime: true,
  colorToken: true,
  iconKey: true,
  requiredItems: true,
});
const legacyTaskSchema = taskSchema.omit({
  description: true,
  category: true,
  checklist: true,
  attachments: true,
});
const legacyExpenseSchema = expenseSchema.omit({ date: true, eventId: true, receipt: true });

export const workspaceSnapshotV1Schema: z.ZodType<WorkspaceSnapshotV1> = z.object({
  version: z.literal(1),
  wedding: weddingSchema.omit({
    budgetTargetPaise: true,
    coverPhotoUri: true,
    guestEstimate: true,
  }),
  events: z.array(legacyEventSchema),
  tasks: z.array(legacyTaskSchema),
  categories: z.array(categorySchema),
  expenses: z.array(legacyExpenseSchema),
});

export function migrateWorkspaceSnapshot(snapshot: WorkspaceSnapshotV1): WorkspaceSnapshot {
  return {
    version: 2,
    wedding: snapshot.wedding,
    events: snapshot.events.map((event) => ({ ...event, requiredItems: [] })),
    tasks: snapshot.tasks.map((task) => ({ ...task, checklist: [], attachments: [] })),
    categories: snapshot.categories,
    expenses: snapshot.expenses,
    households: [],
    gifts: [],
    emergencyContacts: [],
    backupHistory: [],
  };
}

export function parseOrMigrateWorkspaceSnapshot(value: unknown): WorkspaceSnapshot {
  const current = workspaceSnapshotSchema.safeParse(value);
  if (current.success) return current.data;
  const legacy = workspaceSnapshotV1Schema.safeParse(value);
  if (legacy.success) return migrateWorkspaceSnapshot(legacy.data);
  throw new Error("This backup is not a supported Mangalya workspace file.");
}

export function createDataOnlySnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  const wedding = { ...snapshot.wedding };
  delete wedding.coverPhotoUri;

  return {
    ...snapshot,
    wedding,
    events: snapshot.events.map((event) => {
      const dataOnlyEvent = { ...event };
      delete dataOnlyEvent.coverPhotoUri;
      return dataOnlyEvent;
    }),
    tasks: snapshot.tasks.map((task) => ({ ...task, attachments: [] })),
    expenses: snapshot.expenses.map((expense) => {
      const dataOnlyExpense = { ...expense };
      delete dataOnlyExpense.receipt;
      return dataOnlyExpense;
    }),
    backupHistory: [],
  };
}
