import {
  eventFormSchema,
  expenseDetailsFormSchema,
  expenseFormSchema,
  householdFormSchema,
  quickExpenseFormSchema,
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
