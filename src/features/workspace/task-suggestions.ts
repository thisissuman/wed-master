import { toDateOnly, todayDateOnly } from "@/lib/dates";

import type { ISODate, StarterTaskKey, Task } from "./types";

export type SuggestedTaskDefinition = {
  aliases: readonly string[];
  dayOffset: number;
  key: StarterTaskKey;
  title: string;
};

export const suggestedTaskDefinitions: readonly SuggestedTaskDefinition[] = [
  {
    key: "venue",
    title: "Shortlist and book venue",
    dayOffset: -180,
    aliases: ["shortlist and book venue", "book venue", "shortlist venue", "finalize venue"],
  },
  {
    key: "photography",
    title: "Book photographer and videographer",
    dayOffset: -150,
    aliases: [
      "book photographer and videographer",
      "book photographer",
      "book photography",
      "finalize photographer",
    ],
  },
  {
    key: "guestList",
    title: "Prepare guest list",
    dayOffset: -120,
    aliases: ["prepare guest list", "finalize guest list", "wedding guest list"],
  },
  {
    key: "catering",
    title: "Book caterer and plan menu",
    dayOffset: -120,
    aliases: [
      "book caterer and plan menu",
      "book caterer",
      "finalize caterer",
      "plan wedding menu",
    ],
  },
  {
    key: "makeup",
    title: "Book makeup artist",
    dayOffset: -90,
    aliases: ["book makeup artist", "finalize makeup artist", "wedding makeup artist"],
  },
  {
    key: "outfits",
    title: "Finalize wedding outfits",
    dayOffset: -75,
    aliases: [
      "finalize wedding outfits",
      "wedding outfits",
      "buy wedding outfits",
      "wedding dress",
    ],
  },
  {
    key: "accommodation",
    title: "Arrange guest accommodation",
    dayOffset: -60,
    aliases: ["arrange guest accommodation", "book guest accommodation", "book rooms"],
  },
  {
    key: "invitations",
    title: "Send invitations",
    dayOffset: -45,
    aliases: [
      "send invitations",
      "send wedding invitations",
      "send invites",
      "wedding invitations",
    ],
  },
  {
    key: "decor",
    title: "Finalize décor and flowers",
    dayOffset: -30,
    aliases: [
      "finalize décor and flowers",
      "finalize decor and flowers",
      "book decorator",
      "wedding decor",
    ],
  },
  {
    key: "transport",
    title: "Arrange guest transport",
    dayOffset: -21,
    aliases: [
      "arrange guest transport",
      "book guest transport",
      "guest transport",
      "wedding transport",
    ],
  },
] as const;

export const normalizeSuggestedTaskTitle = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");

export function starterTaskKeyForTitle(title: string): StarterTaskKey | undefined {
  const normalized = normalizeSuggestedTaskTitle(title);
  return suggestedTaskDefinitions.find((definition) =>
    definition.aliases.some((alias) => normalizeSuggestedTaskTitle(alias) === normalized),
  )?.key;
}

export function missingSuggestedTasks(tasks: readonly Task[]): SuggestedTaskDefinition[] {
  const existingKeys = new Set(tasks.flatMap((task) => task.starterTaskKey ?? []));
  const existingTitles = new Set(tasks.map((task) => normalizeSuggestedTaskTitle(task.title)));

  return suggestedTaskDefinitions.filter(
    (definition) =>
      !existingKeys.has(definition.key) &&
      !definition.aliases.some((alias) => existingTitles.has(normalizeSuggestedTaskTitle(alias))),
  );
}

export function suggestedTaskDueDate(
  weddingDate: ISODate,
  dayOffset: number,
  today: ISODate,
): ISODate {
  const dueDate = new Date(`${weddingDate}T12:00:00`);
  dueDate.setDate(dueDate.getDate() + dayOffset);
  const proposedDate = toDateOnly(dueDate) as ISODate;
  return proposedDate < today ? today : proposedDate;
}

export function createSuggestedTasks(
  weddingDate: ISODate,
  selectedKeys: readonly StarterTaskKey[],
  existingTasks: readonly Task[] = [],
  today = todayDateOnly() as ISODate,
  createdAt = Date.now(),
): Task[] {
  const availableKeys = new Set(missingSuggestedTasks(existingTasks).map((task) => task.key));
  const selected = new Set(selectedKeys);

  return suggestedTaskDefinitions
    .filter((definition) => selected.has(definition.key) && availableKeys.has(definition.key))
    .map((definition) => ({
      attachments: [],
      checklist: [],
      dueDate: suggestedTaskDueDate(weddingDate, definition.dayOffset, today),
      id: `task-${definition.key}-${createdAt}`,
      priority: "Medium",
      starterTaskKey: definition.key,
      status: "Not Started",
      title: definition.title,
    }));
}
