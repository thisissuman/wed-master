import { expenseFormSchema, toPaise } from "./forms";

describe("expense validation", () => {
  it("rejects paid amount higher than actual amount", () => {
    const result = expenseFormSchema.safeParse({
      title: "Venue",
      categoryId: "venue",
      estimated: "200",
      actual: "100",
      paid: "101",
      paymentStatus: "Partially Paid",
      vendorName: "",
      dueDate: "",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
  it("converts rupee text to integer paise", () => expect(toPaise("12.34")).toBe(1234));
});
