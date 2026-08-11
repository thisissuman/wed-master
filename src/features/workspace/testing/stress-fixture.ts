import { demoWorkspace } from "../seed";
import type { WorkspaceSnapshot } from "../types";

export type StressFixtureScale = {
  expenseCount: number;
  guestCount: number;
  taskCount: number;
};

export const localBetaStressScale: StressFixtureScale = {
  expenseCount: 500,
  guestCount: 1_000,
  taskCount: 500,
};

export function createStressWorkspace(
  scale: StressFixtureScale = localBetaStressScale,
): WorkspaceSnapshot {
  const base = structuredClone(demoWorkspace);
  const eventId = base.events[0]?.id;

  return {
    ...base,
    wedding: {
      ...base.wedding,
      guestEstimate: scale.guestCount,
      name: "Local beta performance wedding",
    },
    households: Array.from({ length: scale.guestCount }, (_, index) => ({
      id: `stress-household-${index}`,
      name:
        index % 20 === 0
          ? `The extended household with a deliberately long family name ${index}`
          : `Household ${index}`,
      side: index % 2 === 0 ? ("partnerOne" as const) : ("partnerTwo" as const),
      guestCount: 1,
      rsvpStatus: index % 3 === 0 ? ("Confirmed" as const) : ("Pending" as const),
      invitationStatus: index % 3 === 0 ? ("Delivered" as const) : ("Sent" as const),
      accommodationStatus: index % 4 === 0 ? ("Booked" as const) : ("Not Needed" as const),
      transportStatus: index % 5 === 0 ? ("Needed" as const) : ("Not Needed" as const),
      guests: [
        {
          id: `stress-guest-${index}`,
          name: index % 25 === 0 ? `Guest ${index} ✨ परिवार` : `Guest ${index}`,
          rsvpStatus: index % 3 === 0 ? ("Confirmed" as const) : ("Pending" as const),
        },
      ],
    })),
    tasks: Array.from({ length: scale.taskCount }, (_, index) => ({
      id: `stress-task-${index}`,
      title:
        index % 20 === 0
          ? `Confirm the complete transport, accommodation, and family coordination plan ${index}`
          : `Planning task ${index}`,
      category: index % 2 === 0 ? "Coordination" : "Family",
      eventId,
      dueDate: "2026-10-01" as const,
      priority: index % 10 === 0 ? ("Critical" as const) : ("Medium" as const),
      status: index % 4 === 0 ? ("Completed" as const) : ("Not Started" as const),
      checklist: [],
      attachments: [],
    })),
    expenses: Array.from({ length: scale.expenseCount }, (_, index) => ({
      id: `stress-expense-${index}`,
      title: `Wedding expense ${index}`,
      categoryId: base.categories[index % base.categories.length].id,
      createdAt: new Date(Date.UTC(2026, 6, 1, 12, 0, index % 60)).toISOString(),
      actualPaise: (index + 1) * 10_000,
      date: "2026-07-23" as const,
    })),
    gifts: [],
    emergencyContacts: [],
    backupHistory: [],
  };
}
