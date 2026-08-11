import type {
  EventColorKey,
  EventIconKey,
  StarterEventKey,
  Wedding,
  WeddingEvent,
  WorkspaceSnapshot,
} from "./types";
import { toDateOnly } from "@/lib/dates";
import { createCoreBudgetCategories } from "./expense-categories";

function dateWithOffset(referenceDate: Date, days: number): WorkspaceSnapshot["wedding"]["date"] {
  const date = new Date(referenceDate);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toDateOnly(date) as WorkspaceSnapshot["wedding"]["date"];
}

export type SuggestedEventDefinition = {
  colorToken: EventColorKey;
  dayOffset: number;
  iconKey: EventIconKey;
  key: StarterEventKey;
  name: string;
};

export const suggestedEventDefinitions: readonly SuggestedEventDefinition[] = [
  { key: "engagement", name: "Engagement", dayOffset: -30, colorToken: "gold", iconKey: "rings" },
  { key: "mehendi", name: "Mehendi", dayOffset: -2, colorToken: "botanical", iconKey: "hand" },
  { key: "haldi", name: "Haldi", dayOffset: -1, colorToken: "gold", iconKey: "sparkles" },
  { key: "sangeet", name: "Sangeet", dayOffset: -1, colorToken: "terracotta", iconKey: "music" },
  { key: "wedding", name: "Wedding", dayOffset: 0, colorToken: "terracotta", iconKey: "mandap" },
  { key: "reception", name: "Reception", dayOffset: 1, colorToken: "sage", iconKey: "music" },
  {
    key: "gruhapravesh",
    name: "Gruhapravesh",
    dayOffset: 2,
    colorToken: "botanical",
    iconKey: "home",
  },
] as const;

const starterNameAliases: Record<StarterEventKey, string[]> = {
  engagement: ["engagement", "ring ceremony"],
  mehendi: ["mehendi", "mehndi"],
  haldi: ["haldi"],
  sangeet: ["sangeet"],
  wedding: ["wedding", "marriage"],
  reception: ["reception"],
  gruhapravesh: ["gruhapravesh", "griha pravesh", "graha pravesh"],
};

const normalizedEventName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");

export function missingSuggestedEvents(events: WeddingEvent[]): SuggestedEventDefinition[] {
  const existingKeys = new Set(events.flatMap((event) => event.starterEventKey ?? []));
  const existingNames = new Set(events.map((event) => normalizedEventName(event.name)));
  return suggestedEventDefinitions.filter(
    (definition) =>
      !existingKeys.has(definition.key) &&
      !starterNameAliases[definition.key].some((alias) => existingNames.has(alias)),
  );
}

function dateOffsetFromWedding(weddingDate: WorkspaceSnapshot["wedding"]["date"], days: number) {
  const date = new Date(`${weddingDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateOnly(date) as WorkspaceSnapshot["wedding"]["date"];
}

export function createSuggestedEvents(
  weddingDate: WorkspaceSnapshot["wedding"]["date"],
  selectedKeys: readonly StarterEventKey[],
  existingEvents: WeddingEvent[] = [],
): WeddingEvent[] {
  const availableKeys = new Set(missingSuggestedEvents(existingEvents).map((event) => event.key));
  const selected = new Set(selectedKeys);
  const createdAt = Date.now();

  return suggestedEventDefinitions
    .filter((definition) => selected.has(definition.key) && availableKeys.has(definition.key))
    .map((definition, index) => ({
      id: `event-${definition.key}-${createdAt}`,
      name: definition.name,
      date: dateOffsetFromWedding(weddingDate, definition.dayOffset),
      starterEventKey: definition.key,
      colorToken: definition.colorToken,
      iconKey: definition.iconKey,
      requiredItems: [],
      sortOrder: existingEvents.length + index,
    }));
}

export function createDemoWorkspace(referenceDate = new Date()): WorkspaceSnapshot {
  const date = (days: number) => dateWithOffset(referenceDate, days);

  return {
    version: 4,
    wedding: {
      id: "wedding-1",
      name: "Suman & Sumita",
      type: "Odia Hindu Wedding",
      date: date(150),
      location: "Berhampur, Odisha",
      currency: "INR",
      guestEstimate: 800,
      budgetTargetPaise: 2_800_000_000,
    },
    events: [
      {
        id: "event-engagement",
        name: "Engagement",
        date: date(146),
        time: "18:30",
        endTime: "21:00",
        location: "Berhampur, Odisha",
        notes: "Ring ceremony and family dinner.",
        colorToken: "gold",
        iconKey: "rings",
        requiredItems: [],
        sortOrder: 0,
      },
      {
        id: "event-haldi",
        name: "Haldi",
        date: date(148),
        time: "09:00",
        endTime: "11:00",
        location: "Family home",
        notes: "Keep turmeric and floral jewellery ready.",
        colorToken: "gold",
        iconKey: "sparkles",
        requiredItems: [],
        sortOrder: 1,
      },
      {
        id: "event-mehendi",
        name: "Mehendi",
        date: date(148),
        time: "17:00",
        endTime: "21:00",
        location: "Family home",
        notes: "Green and gold theme. Welcome drinks and light snacks.",
        colorToken: "botanical",
        iconKey: "hand",
        requiredItems: [
          { id: "required-decor", label: "Decor items", completed: 12, total: 16 },
          { id: "required-mehendi", label: "Mehendi items", completed: 5, total: 6 },
          { id: "required-gifts", label: "Return gifts", completed: 8, total: 10 },
        ],
        sortOrder: 2,
      },
      {
        id: "event-wedding",
        name: "Wedding",
        date: date(150),
        time: "19:00",
        endTime: "23:30",
        location: "Berhampur, Odisha",
        notes: "Ceremonies and customs remain editable for the family.",
        colorToken: "terracotta",
        iconKey: "mandap",
        requiredItems: [
          { id: "required-ceremony", label: "Ceremony items", completed: 6, total: 8 },
        ],
        sortOrder: 3,
      },
      {
        id: "event-reception",
        name: "Reception",
        date: date(151),
        time: "19:00",
        endTime: "22:30",
        location: "Berhampur, Odisha",
        colorToken: "sage",
        iconKey: "music",
        requiredItems: [],
        sortOrder: 4,
      },
      {
        id: "event-gruhapravesh",
        name: "Gruhapravesh",
        date: date(152),
        time: "10:00",
        location: "Family home",
        colorToken: "botanical",
        iconKey: "home",
        requiredItems: [],
        sortOrder: 5,
      },
    ],
    tasks: [
      {
        id: "task-1",
        title: "Confirm catering menu",
        description: "Finalize the menu, service plan, and dietary notes.",
        category: "Food & catering",
        eventId: "event-wedding",
        dueDate: date(97),
        priority: "High",
        status: "In Progress",
        responsiblePerson: "Suman",
        checklist: [
          { id: "task-1-check-1", title: "Review tasting notes", completed: true },
          { id: "task-1-check-2", title: "Confirm final guest count", completed: false },
        ],
        attachments: [],
      },
      {
        id: "task-2",
        title: "Collect invitation proof",
        category: "Invitations",
        eventId: "event-engagement",
        dueDate: date(87),
        priority: "Medium",
        status: "Not Started",
        responsiblePerson: "Sumita",
        checklist: [],
        attachments: [],
      },
      {
        id: "task-3",
        title: "Book bridal mehendi artist",
        category: "Artists",
        eventId: "event-mehendi",
        dueDate: date(77),
        priority: "High",
        status: "Completed",
        responsiblePerson: "Sumita",
        checklist: [],
        attachments: [],
      },
      {
        id: "task-4",
        title: "Confirm the final family transport and accommodation pickup schedule",
        category: "Transport",
        eventId: "event-wedding",
        dueDate: date(-10),
        priority: "Critical",
        status: "In Progress",
        responsiblePerson: "Suman",
        notes: "Confirm vehicle count before the next planning call.",
        checklist: [],
        attachments: [],
      },
    ],
    categories: createCoreBudgetCategories(),
    expenses: [
      {
        id: "expense-1",
        title: "Wedding venue advance",
        categoryId: "category-core-advance",
        createdAt: `${date(-14)}T12:00:00.000Z`,
        actualPaise: 360000000,
        date: date(-14),
      },
      {
        id: "expense-2",
        title: "Photography booking",
        categoryId: "category-core-event",
        createdAt: `${date(-25)}T12:00:00.000Z`,
        actualPaise: 150000000,
        date: date(-25),
      },
      {
        id: "expense-3",
        title: "Catering payment",
        categoryId: "category-core-event",
        createdAt: `${date(-10)}T12:00:00.000Z`,
        actualPaise: 450000000,
        date: date(-10),
      },
      {
        id: "expense-4",
        title: "Reception stage, floral installation and lighting package",
        categoryId: "category-core-event",
        createdAt: `${date(-7)}T12:00:00.000Z`,
        actualPaise: 185000000,
        date: date(-7),
        notes: "Final flower selection is pending family approval.",
      },
    ],
    households: [
      {
        id: "household-1",
        name: "Patnaik Family",
        side: "partnerOne",
        guestCount: 3,
        rsvpStatus: "Pending",
        invitationStatus: "Delivered",
        accommodationStatus: "Booked",
        transportStatus: "Booked",
        guests: [
          { id: "guest-1", name: "Rajesh Patnaik", rsvpStatus: "Confirmed" },
          { id: "guest-2", name: "Priyadarshini Patnaik", rsvpStatus: "Confirmed" },
          { id: "guest-3", name: "Ananya Patnaik", rsvpStatus: "Pending" },
        ],
      },
      {
        id: "household-2",
        name: "Mishra Family",
        side: "partnerTwo",
        guestCount: 2,
        rsvpStatus: "Confirmed",
        invitationStatus: "Sent",
        accommodationStatus: "Needed",
        transportStatus: "Not Needed",
        guests: [
          { id: "guest-4", name: "Arun Mishra", rsvpStatus: "Confirmed" },
          { id: "guest-5", name: "Maya Mishra", rsvpStatus: "Confirmed" },
        ],
      },
      {
        id: "household-3",
        name: "Friends Group",
        side: "both",
        guestCount: 2,
        rsvpStatus: "Pending",
        invitationStatus: "Sent",
        accommodationStatus: "Not Needed",
        transportStatus: "Needed",
        guests: [
          { id: "guest-6", name: "Aarav Sahu", rsvpStatus: "Pending" },
          { id: "guest-7", name: "Diya Behera", rsvpStatus: "Declined" },
        ],
      },
    ],
    gifts: [
      {
        id: "gift-1",
        kind: "Received",
        personName: "Rajesh & Priyadarshini Patnaik",
        relationship: "Family",
        itemName: "Silver dinner set",
        valuePaise: 2400000,
        valueIsEstimated: true,
        date: date(-20),
        thankedStatus: "Done",
        thankedDate: date(-19),
        returnGiftStatus: "Done",
        returnGiftDate: date(-20),
      },
      {
        id: "gift-2",
        kind: "Received",
        personName: "Sushant Kumar Sahu",
        relationship: "Cousin",
        itemName: "Cash",
        valuePaise: 1100000,
        date: date(-10),
        thankedStatus: "Done",
        thankedDate: date(-9),
        returnGiftStatus: "Done",
        returnGiftDate: date(-10),
      },
      {
        id: "gift-3",
        kind: "Given",
        personName: "Family elders",
        itemName: "Ceremonial gifts",
        valuePaise: 5100000,
        valueIsEstimated: true,
        date: date(150),
        thankedStatus: "Pending",
        returnGiftStatus: "Pending",
      },
    ],
    emergencyContacts: [
      {
        id: "contact-1",
        name: "Rajat Maharana",
        role: "Family coordinator",
        phone: "+919876543210",
        iconKey: "users",
      },
      {
        id: "contact-2",
        name: "Venue desk",
        role: "Venue manager",
        phone: "+911412385700",
        iconKey: "building",
      },
      {
        id: "contact-3",
        name: "City Hospital",
        role: "Medical assistance",
        phone: "+919829011223",
        iconKey: "medical",
      },
      {
        id: "contact-4",
        name: "Police / Emergency",
        role: "Emergency services",
        phone: "112",
        iconKey: "shield",
      },
    ],
    backupHistory: [],
  };
}

export function createEmptyWorkspace(
  wedding: Omit<Wedding, "currency" | "id">,
  starterEventSelection: readonly StarterEventKey[] = ["wedding"],
): WorkspaceSnapshot {
  const events = createSuggestedEvents(wedding.date, starterEventSelection);
  return {
    version: 4,
    wedding: {
      ...wedding,
      id: `wedding-${Date.now()}`,
      currency: "INR",
    },
    events,
    tasks: [],
    categories: createCoreBudgetCategories(),
    expenses: [],
    households: [],
    gifts: [],
    emergencyContacts: [],
    backupHistory: [],
  };
}

// Stable fixture for tests and previews. New and reset workspaces use the current date.
export const demoWorkspace = createDemoWorkspace(new Date(2026, 6, 15, 12));
