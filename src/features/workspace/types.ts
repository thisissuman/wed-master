export type ISODate = `${number}-${number}-${number}`;

export type AttachmentRef = {
  id: string;
  name: string;
  uri: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type Wedding = {
  id: string;
  name: string;
  type: string;
  date: ISODate;
  location: string;
  currency: "INR";
  coverPhotoUri?: string;
  guestEstimate?: number;
  budgetTargetPaise?: number;
};

export const eventColorKeys = ["botanical", "gold", "terracotta", "sage"] as const;
export type EventColorKey = (typeof eventColorKeys)[number];
export const starterEventKeys = [
  "engagement",
  "mehendi",
  "haldi",
  "sangeet",
  "wedding",
  "reception",
  "gruhapravesh",
] as const;
export type StarterEventKey = (typeof starterEventKeys)[number];
export const eventIconKeys = [
  "calendar",
  "rings",
  "sparkles",
  "hand",
  "mandap",
  "music",
  "home",
  "lamp",
] as const;
export type EventIconKey = (typeof eventIconKeys)[number];

export type EventRequiredItem = {
  id: string;
  label: string;
  completed: number;
  total: number;
};

export type WeddingEvent = {
  id: string;
  name: string;
  date: ISODate;
  starterEventKey?: StarterEventKey;
  coverPhotoUri?: string;
  time?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  colorToken?: EventColorKey;
  iconKey?: EventIconKey;
  requiredItems: EventRequiredItem[];
  sortOrder: number;
};

export const taskPriorities = ["Low", "Medium", "High", "Critical"] as const;
export type TaskPriority = (typeof taskPriorities)[number];
export const taskStatuses = ["Not Started", "In Progress", "Completed", "Cancelled"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export type TaskChecklistItem = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  notes?: string;
  description?: string;
  category?: string;
  eventId?: string;
  dueDate?: ISODate;
  priority: TaskPriority;
  status: TaskStatus;
  responsiblePerson?: string;
  checklist: TaskChecklistItem[];
  attachments: AttachmentRef[];
};

export const budgetCategoryIconKeys = [
  "event",
  "task",
  "shopping",
  "commute",
  "gift",
  "advance",
  "other",
] as const;
export type BudgetCategoryIconKey = (typeof budgetCategoryIconKeys)[number];

export type BudgetCategory = {
  id: string;
  name: string;
  sortOrder: number;
  iconKey: BudgetCategoryIconKey;
  archived: boolean;
};
export const paymentStatuses = ["Not Paid", "Partially Paid", "Paid"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type Expense = {
  id: string;
  title: string;
  categoryId: string;
  createdAt: string;
  actualPaise: number;
  date?: ISODate;
  notes?: string;
  receipt?: AttachmentRef;
  /** Legacy payment-planning metadata retained for backup compatibility only. */
  estimatedPaise?: number;
  paidPaise?: number;
  paymentStatus?: PaymentStatus;
  eventId?: string;
  vendorName?: string;
  dueDate?: ISODate;
};

export const householdSides = ["partnerOne", "partnerTwo", "both", "other"] as const;
export type HouseholdSide = (typeof householdSides)[number];
export const rsvpStatuses = ["Pending", "Confirmed", "Declined"] as const;
export type RsvpStatus = (typeof rsvpStatuses)[number];
export const invitationStatuses = ["Not Sent", "Sent", "Delivered"] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];
export const serviceStatuses = ["Not Needed", "Needed", "Booked"] as const;
export type ServiceStatus = (typeof serviceStatuses)[number];

export type Guest = {
  id: string;
  name: string;
  rsvpStatus: RsvpStatus;
};

export type Household = {
  id: string;
  name: string;
  side: HouseholdSide;
  /** Optional only for backward compatibility with workspace v2 records. New forms always persist it. */
  guestCount?: number;
  rsvpStatus: RsvpStatus;
  invitationStatus: InvitationStatus;
  accommodationStatus: ServiceStatus;
  transportStatus: ServiceStatus;
  notes?: string;
  guests: Guest[];
};

export const giftKinds = ["Given", "Received", "Return Gift"] as const;
export type GiftKind = (typeof giftKinds)[number];
export const giftProgressStatuses = ["Pending", "Done"] as const;
export type GiftProgressStatus = (typeof giftProgressStatuses)[number];

export type GiftRecord = {
  id: string;
  /** Legacy classification retained for restored records. New gifts are received gifts. */
  kind?: GiftKind;
  personName: string;
  relationship?: string;
  itemName?: string;
  valuePaise?: number;
  valueIsEstimated?: boolean;
  date?: ISODate;
  thankedStatus?: GiftProgressStatus;
  thankedDate?: ISODate;
  returnGiftStatus?: GiftProgressStatus;
  returnGiftDate?: ISODate;
  notes?: string;
};

export type EmergencyContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  iconKey?: string;
};

export type BackupHistoryEntry = {
  id: string;
  kind: "backup" | "expenses-csv" | "tasks-csv" | "guests-csv";
  fileName: string;
  sizeBytes: number;
  createdAt: string;
  uri: string;
};

export type LegacyBudgetCategory = Pick<BudgetCategory, "id" | "name" | "sortOrder">;
export type WorkspaceExpenseV2 = Omit<Expense, "createdAt" | "paidPaise" | "paymentStatus"> & {
  paidPaise: number;
  paymentStatus: PaymentStatus;
};

export type WorkspaceSnapshotV1 = {
  version: 1;
  wedding: Omit<Wedding, "budgetTargetPaise" | "coverPhotoUri" | "guestEstimate">;
  events: Omit<
    WeddingEvent,
    "coverPhotoUri" | "endTime" | "colorToken" | "iconKey" | "requiredItems"
  >[];
  tasks: Omit<Task, "description" | "category" | "checklist" | "attachments">[];
  categories: LegacyBudgetCategory[];
  expenses: Omit<WorkspaceExpenseV2, "date" | "eventId" | "receipt">[];
};

export type WorkspaceSnapshotV2 = {
  version: 2;
  wedding: Wedding;
  events: WeddingEvent[];
  tasks: Task[];
  categories: LegacyBudgetCategory[];
  expenses: WorkspaceExpenseV2[];
  households: Omit<Household, "rsvpStatus">[];
  gifts: (GiftRecord & {
    kind: GiftKind;
    itemName: string;
    thankedStatus: GiftProgressStatus;
    returnGiftStatus: GiftProgressStatus;
  })[];
  emergencyContacts: EmergencyContact[];
  backupHistory: BackupHistoryEntry[];
};

export type WorkspaceSnapshotV3 = Omit<
  WorkspaceSnapshotV2,
  "categories" | "expenses" | "version"
> & {
  version: 3;
  categories: BudgetCategory[];
  expenses: Expense[];
};

export type WorkspaceSnapshot = Omit<
  WorkspaceSnapshotV3,
  "events" | "gifts" | "households" | "version"
> & {
  version: 4;
  events: WeddingEvent[];
  households: Household[];
  gifts: GiftRecord[];
};

export type CreateExpenseInput = Pick<
  Expense,
  "actualPaise" | "categoryId" | "date" | "eventId" | "notes" | "receipt" | "title"
>;

export type CreateExpenseResult = {
  expense: Expense;
  snapshot: WorkspaceSnapshot;
};

export type WeddingRepository = {
  getWedding(): Promise<Wedding>;
  updateWedding(wedding: Wedding): Promise<WorkspaceSnapshot>;
};
export type EventRepository = {
  listEvents(): Promise<WeddingEvent[]>;
  createEvent(
    event: Omit<WeddingEvent, "id" | "requiredItems" | "sortOrder"> &
      Partial<Pick<WeddingEvent, "requiredItems">>,
  ): Promise<WorkspaceSnapshot>;
  updateEvent(event: WeddingEvent): Promise<WorkspaceSnapshot>;
  deleteEvent(id: string): Promise<WorkspaceSnapshot>;
  moveEvent(id: string, direction: "earlier" | "later"): Promise<WorkspaceSnapshot>;
};
export type TaskRepository = {
  listTasks(): Promise<Task[]>;
  createTask(
    task: Omit<Task, "attachments" | "checklist" | "id"> &
      Partial<Pick<Task, "attachments" | "checklist">>,
  ): Promise<WorkspaceSnapshot>;
  updateTask(task: Task): Promise<WorkspaceSnapshot>;
  deleteTask(id: string): Promise<WorkspaceSnapshot>;
  restoreTask(task: Task): Promise<WorkspaceSnapshot>;
};
export type BudgetRepository = {
  listCategories(): Promise<BudgetCategory[]>;
  createCategory(category: Omit<BudgetCategory, "id" | "sortOrder">): Promise<WorkspaceSnapshot>;
  updateCategory(category: BudgetCategory): Promise<WorkspaceSnapshot>;
  deleteCategory(id: string): Promise<WorkspaceSnapshot>;
};
export type ExpenseRepository = {
  listExpenses(): Promise<Expense[]>;
  createExpense(expense: CreateExpenseInput): Promise<CreateExpenseResult>;
  updateExpense(expense: Expense): Promise<WorkspaceSnapshot>;
  deleteExpense(id: string): Promise<WorkspaceSnapshot>;
  restoreExpense(expense: Expense): Promise<WorkspaceSnapshot>;
};
export type HouseholdRepository = {
  listHouseholds(): Promise<Household[]>;
  createHousehold(household: Omit<Household, "id">): Promise<WorkspaceSnapshot>;
  updateHousehold(household: Household): Promise<WorkspaceSnapshot>;
  deleteHousehold(id: string): Promise<WorkspaceSnapshot>;
  restoreHousehold(household: Household): Promise<WorkspaceSnapshot>;
};
export type GiftRepository = {
  listGifts(): Promise<GiftRecord[]>;
  createGift(gift: Omit<GiftRecord, "id">): Promise<WorkspaceSnapshot>;
  updateGift(gift: GiftRecord): Promise<WorkspaceSnapshot>;
  deleteGift(id: string): Promise<WorkspaceSnapshot>;
  restoreGift(gift: GiftRecord): Promise<WorkspaceSnapshot>;
};
export type EmergencyContactRepository = {
  listContacts(): Promise<EmergencyContact[]>;
  createContact(contact: Omit<EmergencyContact, "id">): Promise<WorkspaceSnapshot>;
  updateContact(contact: EmergencyContact): Promise<WorkspaceSnapshot>;
  deleteContact(id: string): Promise<WorkspaceSnapshot>;
  restoreContact(contact: EmergencyContact): Promise<WorkspaceSnapshot>;
};
export type BackupRepository = {
  addHistory(entry: BackupHistoryEntry): Promise<WorkspaceSnapshot>;
  clearHistory(): Promise<WorkspaceSnapshot>;
};
export type WorkspaceRepository = {
  replaceSnapshot(snapshot: WorkspaceSnapshot): Promise<WorkspaceSnapshot>;
  resetDemo(): Promise<WorkspaceSnapshot>;
  createSnapshot(snapshot: WorkspaceSnapshot): Promise<WorkspaceSnapshot>;
  deleteLocalData(): Promise<void>;
  getRecoveryText(): Promise<string | null>;
};

export type Repositories = {
  wedding: WeddingRepository;
  events: EventRepository;
  tasks: TaskRepository;
  budget: BudgetRepository;
  expenses: ExpenseRepository;
  households: HouseholdRepository;
  gifts: GiftRepository;
  emergencyContacts: EmergencyContactRepository;
  backup: BackupRepository;
  workspace: WorkspaceRepository;
  snapshot(): Promise<WorkspaceSnapshot>;
};
