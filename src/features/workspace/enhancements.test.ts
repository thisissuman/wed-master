import {
  createLocalRepositories,
  LocalWorkspaceStore,
  workspaceStorageKey,
} from "./local-repositories";
import { demoWorkspace } from "./seed";
import { categorySpending, homeBudgetSummary, selectDailySpending } from "./selectors";
import { expenseAmountLabel } from "./expense-amount";
import { refundCategory } from "./expense-categories";
import { createDataOnlySnapshot, parseOrMigrateWorkspaceSnapshot } from "./workspace-schema";
import { expensesCsv } from "./backup/backup-data";

function setup() {
  const snapshot = structuredClone(demoWorkspace);
  snapshot.expenses = [];
  let value = JSON.stringify(snapshot);
  const storage = {
    getItem: async (key: string) => (key === workspaceStorageKey ? value : null),
    setItem: async (_key: string, next: string) => {
      value = next;
    },
  };
  return { repositories: createLocalRepositories(new LocalWorkspaceStore(storage)), storage };
}

it("persists refund direction, subtracts it from net spend and preserves it in backups", async () => {
  const { repositories, storage } = setup();
  const paid = await repositories.expenses.createExpense({
    title: "Venue",
    actualPaise: 100000,
    categoryId: "category-core-event",
    date: "2026-09-18",
  });
  const refund = await repositories.expenses.createExpense({
    title: "Venue refund",
    actualPaise: 20000,
    categoryId: refundCategory.id,
    direction: "refund",
    date: "2026-09-18",
  });
  const reloaded = await new LocalWorkspaceStore(storage).getSnapshot();
  expect(homeBudgetSummary(reloaded).spentPaise).toBe(80000);
  expect(reloaded.categories).toContainEqual(refundCategory);
  expect(expenseAmountLabel(paid.expense)).toBe("-₹1,000.00");
  expect(expenseAmountLabel(refund.expense)).toBe("+₹200.00");
  expect(categorySpending(reloaded).reduce((sum, category) => sum + category.actualPaise, 0)).toBe(
    100000,
  );
  expect(selectDailySpending(reloaded.expenses, "all", "2026-09-18")[0].actualPaise).toBe(100000);
  const backup = parseOrMigrateWorkspaceSnapshot(createDataOnlySnapshot(reloaded));
  expect(backup.expenses.find((item) => item.id === refund.expense.id)?.direction).toBe("refund");
  expect(expensesCsv(backup)).toContain('"Got back"');
  await repositories.expenses.deleteExpense(refund.expense.id);
  expect(homeBudgetSummary(await repositories.snapshot()).spentPaise).toBe(100000);
  await repositories.expenses.restoreExpense(refund.expense);
  expect(homeBudgetSummary(await repositories.snapshot()).spentPaise).toBe(80000);
});

it("timestamps create, edits and completion without inventing activity for old tasks", async () => {
  const { repositories, storage } = setup();
  expect((await repositories.snapshot()).tasks[0].updatedAt).toBeUndefined();
  const snapshot = await repositories.tasks.createTask({
    title: "Recent task",
    priority: "Medium",
    status: "Not Started",
  });
  const task = snapshot.tasks.find((item) => item.title === "Recent task")!;
  expect(task.updatedAt).toBeDefined();
  const stale = { ...task, updatedAt: "2000-01-01T00:00:00.000Z" };
  const edited = await repositories.tasks.updateTask(stale);
  expect(edited.tasks.find((item) => item.id === task.id)?.updatedAt).not.toBe(stale.updatedAt);
  await repositories.tasks.updateTaskStatus(task.id, "Completed");
  const persisted = (await new LocalWorkspaceStore(storage).getSnapshot()).tasks.find(
    (item) => item.id === task.id,
  );
  expect(persisted?.status).toBe("Completed");
  expect(persisted?.updatedAt).toBeDefined();
});
