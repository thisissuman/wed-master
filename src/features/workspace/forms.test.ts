import {
  eventFormSchema,
  contactFormSchema,
  expenseDetailsFormSchema,
  expenseFormSchema,
  giftFormSchema,
  householdFormSchema,
  quickExpenseFormSchema,
  settingsFormSchema,
  taskFormSchema,
  toPaise,
} from "./forms";

describe("expense validation", () => {
  it("requires a title, category, and positive paise-safe amount", () => {
    expect(
      quickExpenseFormSchema.safeParse({ title: "", categoryId: "", amount: "0" }).success,
    ).toBe(false);
    expect(
      quickExpenseFormSchema.safeParse({
        title: "Venue advance",
        categoryId: "category-core-advance",
        amount: "25000.50",
      }).success,
    ).toBe(true);
    expect(
      quickExpenseFormSchema.safeParse({
        title: "Venue advance",
        categoryId: "category-core-advance",
        amount: "12.345",
      }).success,
    ).toBe(false);
    expect(
      quickExpenseFormSchema.safeParse({
        title: "Venue advance",
        categoryId: "category-core-advance",
        amount: "90071992547409.92",
      }).success,
    ).toBe(false);
  });

  it("keeps edit fields to title, category, amount, date, and note", () => {
    expect(
      expenseFormSchema.safeParse({
        title: "Wedding invitations",
        categoryId: "category-core-shopping",
        amount: "25000",
        date: "2026-07-15",
        notes: "Collect on Friday",
      }).success,
    ).toBe(true);
  });

  it("requires a valid expense date for optional post-save details", () => {
    expect(expenseDetailsFormSchema.safeParse({ date: "", notes: "" }).success).toBe(false);
    expect(
      expenseDetailsFormSchema.safeParse({ date: "2026-07-15", notes: "Paid at venue" }).success,
    ).toBe(true);
  });

  it("converts rupee text to integer paise", () => expect(toPaise("12.34")).toBe(1234));

  it("rejects an event end time before its start time", () => {
    const result = eventFormSchema.safeParse({
      name: "Family dinner",
      date: "2026-12-10",
      time: "20:00",
      endTime: "19:00",
      location: "",
      notes: "",
      colorToken: "botanical",
      iconKey: "calendar",
    });
    expect(result.success).toBe(false);
  });

  it("requires a positive household guest count", () => {
    const result = householdFormSchema.safeParse({
      name: "Patnaik Family",
      side: "both",
      guestCount: "",
      rsvpStatus: "Pending",
      invitationStatus: "Not Sent",
      accommodationStatus: "Not Needed",
      transportStatus: "Not Needed",
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows a household count with one household RSVP status", () => {
    const result = householdFormSchema.safeParse({
      name: "Patnaik Family",
      side: "both",
      guestCount: "5",
      rsvpStatus: "Pending",
      invitationStatus: "Not Sent",
      accommodationStatus: "Not Needed",
      transportStatus: "Not Needed",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts 999 household guests and rejects 1,000", () => {
    const values = {
      name: "Patnaik Family",
      side: "both" as const,
      guestCount: "999",
      rsvpStatus: "Pending" as const,
      invitationStatus: "Not Sent" as const,
      accommodationStatus: "Not Needed" as const,
      transportStatus: "Not Needed" as const,
      notes: "",
    };
    expect(householdFormSchema.safeParse(values).success).toBe(true);
    expect(householdFormSchema.safeParse({ ...values, guestCount: "1000" }).success).toBe(false);
  });

  it("enforces the shared exact text and currency limits", () => {
    const taskValues = {
      title: "t".repeat(120),
      notes: "n".repeat(2_000),
      description: "d".repeat(2_000),
      category: "c".repeat(120),
      eventId: "",
      dueDate: "",
      priority: "Medium" as const,
      status: "Not Started" as const,
      responsiblePerson: "a".repeat(120),
    };
    expect(taskFormSchema.safeParse(taskValues).success).toBe(true);
    expect(taskFormSchema.safeParse({ ...taskValues, title: "t".repeat(121) }).success).toBe(false);
    expect(taskFormSchema.safeParse({ ...taskValues, notes: "n".repeat(2_001) }).success).toBe(
      false,
    );

    expect(
      quickExpenseFormSchema.safeParse({
        title: "Expense",
        categoryId: "venue",
        amount: `${"9".repeat(13)}.99`,
      }).success,
    ).toBe(true);
    expect(
      quickExpenseFormSchema.safeParse({
        title: "Expense",
        categoryId: "venue",
        amount: "1".repeat(17),
      }).success,
    ).toBe(false);
  });

  it("enforces contact, gift, and settings field limits", () => {
    expect(
      contactFormSchema.safeParse({
        name: "n".repeat(120),
        role: "r".repeat(120),
        phone: `+91${"1".repeat(17)}`,
      }).success,
    ).toBe(true);
    expect(
      contactFormSchema.safeParse({ name: "Name", role: "Role", phone: "1".repeat(21) }).success,
    ).toBe(false);

    expect(
      giftFormSchema.safeParse({
        personName: "n".repeat(120),
        relationship: "r".repeat(120),
        itemName: "g".repeat(240),
        value: "",
      }).success,
    ).toBe(true);
    expect(
      giftFormSchema.safeParse({
        personName: "Name",
        relationship: "",
        itemName: "g".repeat(241),
        value: "",
      }).success,
    ).toBe(false);

    expect(
      settingsFormSchema.safeParse({
        name: "Wedding",
        date: "2026-12-14",
        location: "l".repeat(240),
        type: "t".repeat(120),
        keepsakeMessage: "",
      }).success,
    ).toBe(true);
  });

  it("requires a supported household RSVP status", () => {
    const result = householdFormSchema.safeParse({
      name: "Patnaik Family",
      side: "both",
      guestCount: "1",
      rsvpStatus: "Partial",
      invitationStatus: "Not Sent",
      accommodationStatus: "Not Needed",
      transportStatus: "Not Needed",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
});
