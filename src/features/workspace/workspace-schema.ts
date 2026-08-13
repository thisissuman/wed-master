import { z } from "zod";

import type {
  ISODate,
  RsvpStatus,
  StarterEventKey,
  WorkspaceSnapshot,
  WorkspaceSnapshotV1,
  WorkspaceSnapshotV2,
  WorkspaceSnapshotV3,
} from "./types";
import { derivePaymentStatus } from "./domain";
import { migrateBudgetCategories } from "./expense-categories";
import { keepsakeMessageMaxLength } from "./wedding-profile";
import {
  budgetCategoryIconKeys,
  eventColorKeys,
  eventIconKeys,
  giftKinds,
  giftProgressStatuses,
  householdSides,
  invitationStatuses,
  paymentStatuses,
  rsvpStatuses,
  serviceStatuses,
  starterEventKeys,
  taskPriorities,
  taskStatuses,
} from "./types";

const maximumRecordsPerCollection = 10_000;
const maximumTextLength = 20_000;

function isValidIsoDate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

const isoDateSchema = z.custom<ISODate>(isValidIsoDate, "Use a valid date in YYYY-MM-DD format.");
const idSchema = z.string().min(1).max(200);
const textSchema = z.string().max(maximumTextLength);
const nonBlankTextSchema = textSchema.refine((value) => value.trim().length > 0, "Required.");
const optionalTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .optional();
const attachmentSchema = z
  .object({
    id: idSchema,
    name: nonBlankTextSchema,
    uri: z.string().min(1).max(4_096),
    mimeType: z.string().min(1).max(200),
    size: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
  })
  .strict();
const weddingSchema = z
  .object({
    id: idSchema,
    name: nonBlankTextSchema,
    type: nonBlankTextSchema,
    date: isoDateSchema,
    location: nonBlankTextSchema,
    currency: z.literal("INR"),
    coverPhotoUri: z.string().min(1).max(4_096).optional(),
    keepsakeMessage: z.string().trim().min(1).max(keepsakeMessageMaxLength).optional(),
    guestEstimate: z.number().int().nonnegative().optional(),
    budgetTargetPaise: z.number().int().nonnegative().optional(),
  })
  .strict();
const eventSchema = z
  .object({
    id: idSchema,
    name: nonBlankTextSchema,
    date: isoDateSchema,
    starterEventKey: z.enum(starterEventKeys).optional(),
    coverPhotoUri: z.string().min(1).max(4_096).optional(),
    time: optionalTimeSchema,
    endTime: optionalTimeSchema,
    location: textSchema.optional(),
    notes: textSchema.optional(),
    colorToken: z.enum(eventColorKeys).optional(),
    iconKey: z.enum(eventIconKeys).optional(),
    requiredItems: z
      .array(
        z
          .object({
            id: idSchema,
            label: nonBlankTextSchema,
            completed: z.number().int().nonnegative(),
            total: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .max(maximumRecordsPerCollection),
    sortOrder: z.number().int().nonnegative(),
  })
  .strict();
const taskSchema = z
  .object({
    id: idSchema,
    title: nonBlankTextSchema,
    notes: textSchema.optional(),
    description: textSchema.optional(),
    category: textSchema.optional(),
    eventId: idSchema.optional(),
    dueDate: isoDateSchema.optional(),
    priority: z.enum(taskPriorities),
    status: z.enum(taskStatuses),
    responsiblePerson: textSchema.optional(),
    checklist: z
      .array(z.object({ id: idSchema, title: nonBlankTextSchema, completed: z.boolean() }).strict())
      .max(maximumRecordsPerCollection),
    attachments: z.array(attachmentSchema).max(maximumRecordsPerCollection),
  })
  .strict();
const legacyCategorySchema = z
  .object({ id: idSchema, name: nonBlankTextSchema, sortOrder: z.number().int().nonnegative() })
  .strict();
const categorySchema = legacyCategorySchema
  .extend({
    archived: z.boolean(),
    iconKey: z.enum(budgetCategoryIconKeys),
  })
  .strict();
const legacyExpenseSchemaV2 = z
  .object({
    id: idSchema,
    title: nonBlankTextSchema,
    categoryId: idSchema,
    estimatedPaise: z.number().int().nonnegative().optional(),
    actualPaise: z.number().int().nonnegative(),
    paidPaise: z.number().int().nonnegative(),
    paymentStatus: z.enum(paymentStatuses),
    date: isoDateSchema.optional(),
    eventId: idSchema.optional(),
    vendorName: textSchema.optional(),
    dueDate: isoDateSchema.optional(),
    notes: textSchema.optional(),
    receipt: attachmentSchema.optional(),
  })
  .strict();
const expenseSchema = z
  .object({
    id: idSchema,
    title: nonBlankTextSchema,
    categoryId: idSchema,
    createdAt: z.string().datetime(),
    estimatedPaise: z.number().int().nonnegative().optional(),
    actualPaise: z.number().int().nonnegative(),
    paidPaise: z.number().int().nonnegative().optional(),
    paymentStatus: z.enum(paymentStatuses).optional(),
    date: isoDateSchema.optional(),
    eventId: idSchema.optional(),
    vendorName: textSchema.optional(),
    dueDate: isoDateSchema.optional(),
    notes: textSchema.optional(),
    receipt: attachmentSchema.optional(),
  })
  .strict();
const householdSchema = z
  .object({
    id: idSchema,
    name: nonBlankTextSchema,
    side: z.enum(householdSides),
    guestCount: z.number().int().positive().optional(),
    rsvpStatus: z.enum(rsvpStatuses),
    invitationStatus: z.enum(invitationStatuses),
    accommodationStatus: z.enum(serviceStatuses),
    transportStatus: z.enum(serviceStatuses),
    notes: textSchema.optional(),
    guests: z
      .array(
        z
          .object({ id: idSchema, name: nonBlankTextSchema, rsvpStatus: z.enum(rsvpStatuses) })
          .strict(),
      )
      .max(maximumRecordsPerCollection),
  })
  .strict();
const giftSchema = z
  .object({
    id: idSchema,
    kind: z.enum(giftKinds).optional(),
    personName: nonBlankTextSchema,
    relationship: textSchema.optional(),
    itemName: nonBlankTextSchema.optional(),
    valuePaise: z.number().int().nonnegative().optional(),
    valueIsEstimated: z.boolean().optional(),
    date: isoDateSchema.optional(),
    thankedStatus: z.enum(giftProgressStatuses).optional(),
    thankedDate: isoDateSchema.optional(),
    returnGiftStatus: z.enum(giftProgressStatuses).optional(),
    returnGiftDate: isoDateSchema.optional(),
    notes: textSchema.optional(),
  })
  .strict();
const contactSchema = z
  .object({
    id: idSchema,
    name: nonBlankTextSchema,
    role: nonBlankTextSchema,
    phone: nonBlankTextSchema,
    iconKey: z.string().max(100).optional(),
  })
  .strict();
const backupHistorySchema = z
  .object({
    id: idSchema,
    kind: z.enum(["backup", "expenses-csv", "tasks-csv", "guests-csv"]),
    fileName: nonBlankTextSchema,
    sizeBytes: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    uri: z.string().min(1).max(4_096),
  })
  .strict();

function addDuplicateIssues(
  values: { id: string }[],
  collection: string,
  context: z.RefinementCtx,
) {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [collection, index, "id"],
        message: `Duplicate ${collection} ID.`,
      });
    }
    seen.add(value.id);
  });
}

const workspaceSnapshotObjectSchema = z
  .object({
    version: z.literal(4),
    wedding: weddingSchema,
    events: z.array(eventSchema).max(maximumRecordsPerCollection),
    tasks: z.array(taskSchema).max(maximumRecordsPerCollection),
    categories: z.array(categorySchema).max(maximumRecordsPerCollection),
    expenses: z.array(expenseSchema).max(maximumRecordsPerCollection),
    households: z.array(householdSchema).max(maximumRecordsPerCollection),
    gifts: z.array(giftSchema).max(maximumRecordsPerCollection),
    emergencyContacts: z.array(contactSchema).max(maximumRecordsPerCollection),
    backupHistory: z.array(backupHistorySchema).max(20),
  })
  .strict();

export const workspaceSnapshotSchema: z.ZodType<WorkspaceSnapshot> =
  workspaceSnapshotObjectSchema.superRefine((snapshot, context) => {
    addDuplicateIssues(snapshot.events, "events", context);
    addDuplicateIssues(snapshot.tasks, "tasks", context);
    addDuplicateIssues(snapshot.categories, "categories", context);
    addDuplicateIssues(snapshot.expenses, "expenses", context);
    addDuplicateIssues(snapshot.households, "households", context);
    addDuplicateIssues(snapshot.gifts, "gifts", context);
    addDuplicateIssues(snapshot.emergencyContacts, "emergencyContacts", context);
    addDuplicateIssues(snapshot.backupHistory, "backupHistory", context);

    const ids = new Set<string>();
    const registerId = (id: string, path: (number | string)[]) => {
      if (ids.has(id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path,
          message: "IDs must be unique across the workspace.",
        });
      }
      ids.add(id);
    };
    registerId(snapshot.wedding.id, ["wedding", "id"]);
    snapshot.events.forEach((event, index) => {
      registerId(event.id, ["events", index, "id"]);
      event.requiredItems.forEach((item, itemIndex) =>
        registerId(item.id, ["events", index, "requiredItems", itemIndex, "id"]),
      );
    });
    snapshot.tasks.forEach((task, index) => {
      registerId(task.id, ["tasks", index, "id"]);
      task.checklist.forEach((item, itemIndex) =>
        registerId(item.id, ["tasks", index, "checklist", itemIndex, "id"]),
      );
      task.attachments.forEach((attachment, attachmentIndex) =>
        registerId(attachment.id, ["tasks", index, "attachments", attachmentIndex, "id"]),
      );
    });
    snapshot.categories.forEach((category, index) =>
      registerId(category.id, ["categories", index, "id"]),
    );
    snapshot.expenses.forEach((expense, index) => {
      registerId(expense.id, ["expenses", index, "id"]);
      if (expense.receipt) registerId(expense.receipt.id, ["expenses", index, "receipt", "id"]);
    });
    snapshot.households.forEach((household, index) => {
      registerId(household.id, ["households", index, "id"]);
      household.guests.forEach((guest, guestIndex) =>
        registerId(guest.id, ["households", index, "guests", guestIndex, "id"]),
      );
    });
    snapshot.gifts.forEach((gift, index) => registerId(gift.id, ["gifts", index, "id"]));
    snapshot.emergencyContacts.forEach((contact, index) =>
      registerId(contact.id, ["emergencyContacts", index, "id"]),
    );
    snapshot.backupHistory.forEach((entry, index) =>
      registerId(entry.id, ["backupHistory", index, "id"]),
    );

    const eventIds = new Set(snapshot.events.map((event) => event.id));
    const categoryIds = new Set(snapshot.categories.map((category) => category.id));
    const eventDates = new Map(snapshot.events.map((event) => [event.id, event.date]));

    snapshot.events.forEach((event, index) => {
      addDuplicateIssues(event.requiredItems, `events.${index}.requiredItems`, context);
      event.requiredItems.forEach((item, itemIndex) => {
        if (item.completed > item.total) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["events", index, "requiredItems", itemIndex, "completed"],
            message: "Completed count cannot exceed total count.",
          });
        }
      });
      if (event.endTime && !event.time) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index, "endTime"],
          message: "An end time requires a start time.",
        });
      } else if (event.time && event.endTime && event.endTime <= event.time) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["events", index, "endTime"],
          message: "End time must be later than start time.",
        });
      }
    });

    snapshot.tasks.forEach((task, index) => {
      addDuplicateIssues(task.checklist, `tasks.${index}.checklist`, context);
      addDuplicateIssues(task.attachments, `tasks.${index}.attachments`, context);
      if (task.eventId && !eventIds.has(task.eventId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tasks", index, "eventId"],
          message: "Linked event does not exist.",
        });
      }
      const eventDate = task.eventId ? eventDates.get(task.eventId) : undefined;
      if (task.dueDate && eventDate && task.dueDate > eventDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tasks", index, "dueDate"],
          message: "Task due date cannot be after its linked event.",
        });
      }
    });

    snapshot.expenses.forEach((expense, index) => {
      if (!categoryIds.has(expense.categoryId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expenses", index, "categoryId"],
          message: "Expense category does not exist.",
        });
      }
      if (expense.eventId && !eventIds.has(expense.eventId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expenses", index, "eventId"],
          message: "Linked event does not exist.",
        });
      }
      if (
        expense.paidPaise !== undefined &&
        expense.paymentStatus !== undefined &&
        expense.paymentStatus !== derivePaymentStatus(expense.actualPaise, expense.paidPaise)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expenses", index, "paymentStatus"],
          message: "Payment status must match the actual and paid amounts.",
        });
      }
    });

    snapshot.households.forEach((household, index) => {
      addDuplicateIssues(household.guests, `households.${index}.guests`, context);
    });
  });

const legacyEventSchema = eventSchema.omit({
  starterEventKey: true,
  coverPhotoUri: true,
  endTime: true,
  colorToken: true,
  iconKey: true,
  requiredItems: true,
});
const legacyHouseholdSchema = householdSchema.omit({ rsvpStatus: true });
const legacyGiftSchema = giftSchema
  .extend({
    kind: z.enum(giftKinds),
    itemName: nonBlankTextSchema,
    thankedStatus: z.enum(giftProgressStatuses),
    returnGiftStatus: z.enum(giftProgressStatuses),
  })
  .strict();
const legacyTaskSchema = taskSchema.omit({
  description: true,
  category: true,
  checklist: true,
  attachments: true,
});
const legacyExpenseSchema = legacyExpenseSchemaV2.omit({
  date: true,
  eventId: true,
  receipt: true,
});

export const workspaceSnapshotV1Schema: z.ZodType<WorkspaceSnapshotV1> = z
  .object({
    version: z.literal(1),
    wedding: weddingSchema.omit({
      budgetTargetPaise: true,
      coverPhotoUri: true,
      guestEstimate: true,
    }),
    events: z.array(legacyEventSchema),
    tasks: z.array(legacyTaskSchema),
    categories: z.array(legacyCategorySchema),
    expenses: z.array(legacyExpenseSchema),
  })
  .strict();

export const workspaceSnapshotV2Schema: z.ZodType<WorkspaceSnapshotV2> = z
  .object({
    version: z.literal(2),
    wedding: weddingSchema,
    events: z.array(eventSchema).max(maximumRecordsPerCollection),
    tasks: z.array(taskSchema).max(maximumRecordsPerCollection),
    categories: z.array(legacyCategorySchema).max(maximumRecordsPerCollection),
    expenses: z.array(legacyExpenseSchemaV2).max(maximumRecordsPerCollection),
    households: z.array(legacyHouseholdSchema).max(maximumRecordsPerCollection),
    gifts: z.array(legacyGiftSchema).max(maximumRecordsPerCollection),
    emergencyContacts: z.array(contactSchema).max(maximumRecordsPerCollection),
    backupHistory: z.array(backupHistorySchema).max(20),
  })
  .strict();

export const workspaceSnapshotV3Schema: z.ZodType<WorkspaceSnapshotV3> = z
  .object({
    version: z.literal(3),
    wedding: weddingSchema,
    events: z.array(eventSchema).max(maximumRecordsPerCollection),
    tasks: z.array(taskSchema).max(maximumRecordsPerCollection),
    categories: z.array(categorySchema).max(maximumRecordsPerCollection),
    expenses: z.array(expenseSchema).max(maximumRecordsPerCollection),
    households: z.array(legacyHouseholdSchema).max(maximumRecordsPerCollection),
    gifts: z.array(legacyGiftSchema).max(maximumRecordsPerCollection),
    emergencyContacts: z.array(contactSchema).max(maximumRecordsPerCollection),
    backupHistory: z.array(backupHistorySchema).max(20),
  })
  .strict();

function migrateWorkspaceSnapshotV1(snapshot: WorkspaceSnapshotV1): WorkspaceSnapshotV2 {
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

function migrateWorkspaceSnapshotV2(snapshot: WorkspaceSnapshotV2): WorkspaceSnapshotV3 {
  return {
    ...snapshot,
    version: 3,
    categories: migrateBudgetCategories(snapshot.categories),
    expenses: snapshot.expenses.map((expense, index) => ({
      ...expense,
      createdAt: new Date(index).toISOString(),
    })),
  };
}

const starterAliases: Record<StarterEventKey, string[]> = {
  engagement: ["engagement", "ring ceremony"],
  mehendi: ["mehendi", "mehndi"],
  haldi: ["haldi"],
  sangeet: ["sangeet"],
  wedding: ["wedding", "marriage"],
  reception: ["reception"],
  gruhapravesh: ["gruhapravesh", "griha pravesh", "graha pravesh"],
};

const normalizeStarterName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");

function starterKeyForName(name: string): StarterEventKey | undefined {
  const normalized = normalizeStarterName(name);
  return starterEventKeys.find((key) => starterAliases[key].includes(normalized));
}

function deriveHouseholdRsvp(
  guests: WorkspaceSnapshotV3["households"][number]["guests"],
): RsvpStatus {
  if (guests.length > 0 && guests.every((guest) => guest.rsvpStatus === "Confirmed")) {
    return "Confirmed";
  }
  if (guests.length > 0 && guests.every((guest) => guest.rsvpStatus === "Declined")) {
    return "Declined";
  }
  return "Pending";
}

function migrateWorkspaceSnapshotV3(snapshot: WorkspaceSnapshotV3): WorkspaceSnapshot {
  return {
    ...snapshot,
    version: 4,
    events: snapshot.events.map((event) => ({
      ...event,
      starterEventKey: event.starterEventKey ?? starterKeyForName(event.name),
    })),
    households: snapshot.households.map((household) => ({
      ...household,
      rsvpStatus: deriveHouseholdRsvp(household.guests),
    })),
  };
}

export function migrateWorkspaceSnapshot(
  snapshot: WorkspaceSnapshotV1 | WorkspaceSnapshotV2 | WorkspaceSnapshotV3,
): WorkspaceSnapshot {
  const current = snapshot.version === 1 ? migrateWorkspaceSnapshotV1(snapshot) : snapshot;
  const versionThree = current.version === 2 ? migrateWorkspaceSnapshotV2(current) : current;
  return migrateWorkspaceSnapshotV3(versionThree);
}

export function parseOrMigrateWorkspaceSnapshot(value: unknown): WorkspaceSnapshot {
  const current = workspaceSnapshotSchema.safeParse(value);
  if (current.success) return current.data;
  const versionThree = workspaceSnapshotV3Schema.safeParse(value);
  if (versionThree.success) {
    return workspaceSnapshotSchema.parse(migrateWorkspaceSnapshot(versionThree.data));
  }
  const previous = workspaceSnapshotV2Schema.safeParse(value);
  if (previous.success) {
    return workspaceSnapshotSchema.parse(migrateWorkspaceSnapshot(previous.data));
  }
  const legacy = workspaceSnapshotV1Schema.safeParse(value);
  if (legacy.success) return workspaceSnapshotSchema.parse(migrateWorkspaceSnapshot(legacy.data));
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
