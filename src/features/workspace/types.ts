export type ISODate = `${number}-${number}-${number}`;

export type Wedding = {
  id: string;
  name: string;
  type: string;
  date: ISODate;
  location: string;
  currency: "INR";
};

export type WeddingEvent = {
  id: string;
  name: string;
  date: ISODate;
  time?: string;
  location?: string;
  notes?: string;
  sortOrder: number;
};

export const taskPriorities = ["Low", "Medium", "High", "Critical"] as const;
export type TaskPriority = (typeof taskPriorities)[number];
export const taskStatuses = ["Not Started", "In Progress", "Completed", "Cancelled"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export type Task = {
  id: string;
  title: string;
  notes?: string;
  eventId?: string;
  dueDate?: ISODate;
  priority: TaskPriority;
  status: TaskStatus;
  responsiblePerson?: string;
};

export type BudgetCategory = { id: string; name: string; sortOrder: number };
export const paymentStatuses = ["Not Paid", "Partially Paid", "Paid"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type Expense = {
  id: string;
  title: string;
  categoryId: string;
  estimatedPaise?: number;
  actualPaise: number;
  paidPaise: number;
  paymentStatus: PaymentStatus;
  vendorName?: string;
  dueDate?: ISODate;
  notes?: string;
};

export type WorkspaceSnapshot = {
  version: 1;
  wedding: Wedding;
  events: WeddingEvent[];
  tasks: Task[];
  categories: BudgetCategory[];
  expenses: Expense[];
};

export type WeddingRepository = {
  getWedding(): Promise<Wedding>;
  updateWedding(wedding: Wedding): Promise<WorkspaceSnapshot>;
};
export type EventRepository = {
  listEvents(): Promise<WeddingEvent[]>;
  createEvent(event: Omit<WeddingEvent, "id" | "sortOrder">): Promise<WorkspaceSnapshot>;
  updateEvent(event: WeddingEvent): Promise<WorkspaceSnapshot>;
  deleteEvent(id: string): Promise<WorkspaceSnapshot>;
};
export type TaskRepository = {
  listTasks(): Promise<Task[]>;
  createTask(task: Omit<Task, "id">): Promise<WorkspaceSnapshot>;
  updateTask(task: Task): Promise<WorkspaceSnapshot>;
  deleteTask(id: string): Promise<WorkspaceSnapshot>;
};
export type BudgetRepository = {
  listCategories(): Promise<BudgetCategory[]>;
  createCategory(category: Omit<BudgetCategory, "id" | "sortOrder">): Promise<WorkspaceSnapshot>;
  updateCategory(category: BudgetCategory): Promise<WorkspaceSnapshot>;
  deleteCategory(id: string): Promise<WorkspaceSnapshot>;
};
export type ExpenseRepository = {
  listExpenses(): Promise<Expense[]>;
  createExpense(expense: Omit<Expense, "id">): Promise<WorkspaceSnapshot>;
  updateExpense(expense: Expense): Promise<WorkspaceSnapshot>;
  deleteExpense(id: string): Promise<WorkspaceSnapshot>;
};

export type Repositories = {
  wedding: WeddingRepository;
  events: EventRepository;
  tasks: TaskRepository;
  budget: BudgetRepository;
  expenses: ExpenseRepository;
  snapshot(): Promise<WorkspaceSnapshot>;
};
