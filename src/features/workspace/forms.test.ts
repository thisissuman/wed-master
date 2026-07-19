import { eventFormSchema, expenseFormSchema, householdFormSchema, toPaise } from "./forms";

describe("expense validation", () => {
  it("rejects paid amount higher than actual amount", () => {
    const result = expenseFormSchema.safeParse({
      title: "Venue",
      categoryId: "venue",
      estimated: "200",
      actual: "100",
      paid: "101",
      paymentStatus: "Partially Paid",
      date: "2026-07-15",
      eventId: "",
      vendorName: "",
      dueDate: "",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
  it("requires payment status to agree with entered amounts", () => {
    const result = expenseFormSchema.safeParse({
      title: "Venue",
      categoryId: "venue",
      estimated: "",
      actual: "100",
      paid: "100",
      paymentStatus: "Partially Paid",
      date: "2026-07-15",
      eventId: "",
      vendorName: "",
      dueDate: "",
      notes: "",
    });
    expect(result.success).toBe(false);
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
      guestNames: "",
      guestRsvpStatus: "Pending",
      invitationStatus: "Not Sent",
      accommodationStatus: "Not Needed",
      transportStatus: "Not Needed",
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows a household count before individual guest names are known", () => {
    const result = householdFormSchema.safeParse({
      name: "Patnaik Family",
      side: "both",
      guestCount: "5",
      guestNames: "",
      guestRsvpStatus: "Pending",
      invitationStatus: "Not Sent",
      accommodationStatus: "Not Needed",
      transportStatus: "Not Needed",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects more named guests than the household count", () => {
    const result = householdFormSchema.safeParse({
      name: "Patnaik Family",
      side: "both",
      guestCount: "1",
      guestNames: "Asha\nRavi",
      guestRsvpStatus: "Pending",
      invitationStatus: "Not Sent",
      accommodationStatus: "Not Needed",
      transportStatus: "Not Needed",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
});
