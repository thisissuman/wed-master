import type { BudgetCategory, BudgetCategoryIconKey, LegacyBudgetCategory } from "./types";

export const coreBudgetCategories = [
  { id: "category-core-event", name: "Event", iconKey: "event" },
  { id: "category-core-task", name: "Task", iconKey: "task" },
  { id: "category-core-shopping", name: "Shopping", iconKey: "shopping" },
  { id: "category-core-commute", name: "Commute", iconKey: "commute" },
  { id: "category-core-gift", name: "Gift", iconKey: "gift" },
  { id: "category-core-advance", name: "Advance", iconKey: "advance" },
  { id: "category-core-other", name: "Other", iconKey: "other" },
] as const satisfies readonly Pick<BudgetCategory, "iconKey" | "id" | "name">[];

const eventPattern =
  /venue|cater|food|decor|flower|photo|ritual|invitation|accommodation|ceremony|event|music|artist/;

export function inferBudgetCategoryIconKey(name: string): BudgetCategoryIconKey {
  const normalized = name.trim().toLowerCase();
  if (/task|checklist|todo/.test(normalized)) return "task";
  if (/shop|bride|groom|jewel|cloth|outfit|beauty/.test(normalized)) return "shopping";
  if (/commute|transport|travel|car|taxi|bus/.test(normalized)) return "commute";
  if (/gift|return gift/.test(normalized)) return "gift";
  if (/advance|deposit|booking amount/.test(normalized)) return "advance";
  if (eventPattern.test(normalized)) return "event";
  return "other";
}

function uniqueCoreId(preferredId: string, usedIds: Set<string>): string {
  if (!usedIds.has(preferredId)) return preferredId;
  let suffix = 2;
  while (usedIds.has(`${preferredId}-${suffix}`)) suffix += 1;
  return `${preferredId}-${suffix}`;
}

export function migrateBudgetCategories(categories: LegacyBudgetCategory[]): BudgetCategory[] {
  const migrated: BudgetCategory[] = categories.map((category) => ({
    ...category,
    archived: true,
    iconKey: inferBudgetCategoryIconKey(category.name),
  }));
  const usedIds = new Set(migrated.map((category) => category.id));

  coreBudgetCategories.forEach((category, index) => {
    const id = uniqueCoreId(category.id, usedIds);
    usedIds.add(id);
    migrated.push({
      ...category,
      id,
      archived: false,
      sortOrder: migrated.length + index,
    });
  });

  return migrated.map((category, sortOrder) => ({ ...category, sortOrder }));
}

export function createCoreBudgetCategories(): BudgetCategory[] {
  return coreBudgetCategories.map((category, sortOrder) => ({
    ...category,
    archived: false,
    sortOrder,
  }));
}

export function selectableBudgetCategories(categories: BudgetCategory[]): BudgetCategory[] {
  return categories
    .filter((category) => !category.archived)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
