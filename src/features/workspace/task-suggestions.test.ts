import { daysUntilDateOnly } from "@/lib/dates";

import {
  createSuggestedTasks,
  missingSuggestedTasks,
  starterTaskKeyForTitle,
  suggestedTaskDefinitions,
} from "./task-suggestions";
import type { Task } from "./types";

describe("task suggestions", () => {
  it("defines ten editable planning suggestions with their agreed offsets", () => {
    expect(suggestedTaskDefinitions).toHaveLength(10);
    expect(
      suggestedTaskDefinitions.map(({ dayOffset, key, title }) => ({ dayOffset, key, title })),
    ).toEqual([
      { dayOffset: -180, key: "venue", title: "Shortlist and book venue" },
      {
        dayOffset: -150,
        key: "photography",
        title: "Book photographer and videographer",
      },
      { dayOffset: -120, key: "guestList", title: "Prepare guest list" },
      { dayOffset: -120, key: "catering", title: "Book caterer and plan menu" },
      { dayOffset: -90, key: "makeup", title: "Book makeup artist" },
      { dayOffset: -75, key: "outfits", title: "Finalize wedding outfits" },
      { dayOffset: -60, key: "accommodation", title: "Arrange guest accommodation" },
      { dayOffset: -45, key: "invitations", title: "Send invitations" },
      { dayOffset: -30, key: "decor", title: "Finalize décor and flowers" },
      { dayOffset: -21, key: "transport", title: "Arrange guest transport" },
    ]);
  });

  it("creates medium general tasks with wedding-relative dates", () => {
    const tasks = createSuggestedTasks(
      "2030-12-01",
      suggestedTaskDefinitions.map((task) => task.key),
      [],
      "2030-01-01",
      42,
    );

    expect(tasks).toHaveLength(10);
    tasks.forEach((task, index) => {
      expect(task).toMatchObject({
        attachments: [],
        checklist: [],
        id: `task-${suggestedTaskDefinitions[index]?.key}-42`,
        priority: "Medium",
        starterTaskKey: suggestedTaskDefinitions[index]?.key,
        status: "Not Started",
      });
      expect(task.eventId).toBeUndefined();
      expect(daysUntilDateOnly(task.dueDate ?? "", "2030-12-01")).toBe(
        suggestedTaskDefinitions[index]?.dayOffset,
      );
    });
  });

  it("clamps past milestones to today", () => {
    const tasks = createSuggestedTasks(
      "2026-08-29",
      suggestedTaskDefinitions.map((task) => task.key),
      [],
      "2026-08-22",
    );

    expect(new Set(tasks.map((task) => task.dueDate))).toEqual(new Set(["2026-08-22"]));
  });

  it("deduplicates by stable key and normalized exact aliases", () => {
    const existing: Task[] = [
      {
        attachments: [],
        checklist: [],
        id: "task-venue",
        priority: "Medium",
        status: "Not Started",
        title: "  BOOK   VENUE ",
      },
      {
        attachments: [],
        checklist: [],
        id: "task-photo",
        priority: "Medium",
        starterTaskKey: "photography",
        status: "Completed",
        title: "A renamed photography task",
      },
    ];

    expect(missingSuggestedTasks(existing).map((task) => task.key)).not.toEqual(
      expect.arrayContaining(["venue", "photography"]),
    );
    expect(starterTaskKeyForTitle("Send invites")).toBe("invitations");
    expect(starterTaskKeyForTitle("Discuss venue ideas with family")).toBeUndefined();
    expect(createSuggestedTasks("2030-12-01", ["venue", "photography"], existing)).toEqual([]);
  });
});
