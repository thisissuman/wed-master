import { inspirationFormSchema } from "./forms";

describe("inspiration form schema", () => {
  it("requires a known category while keeping planning context optional", () => {
    expect(
      inspirationFormSchema.safeParse({ category: "decor", eventId: "", note: "", title: "" })
        .success,
    ).toBe(true);
    expect(
      inspirationFormSchema.safeParse({ category: "unknown", eventId: "", note: "", title: "" })
        .success,
    ).toBe(false);
  });

  it("enforces bounded title and note copy", () => {
    expect(
      inspirationFormSchema.safeParse({
        category: "decor",
        eventId: "",
        note: "n".repeat(2_001),
        title: "t".repeat(121),
      }).success,
    ).toBe(false);
  });
});
