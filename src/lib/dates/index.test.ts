import { formatTimeOfDay, toDateOnly } from "./index";

describe("date-only helpers", () => {
  it("keeps the selected calendar day in local date-only form", () => {
    expect(toDateOnly(new Date(2026, 11, 14, 0, 0, 0))).toBe("2026-12-14");
  });

  it("formats an event time for Indian readers", () => {
    expect(formatTimeOfDay("18:30")).toMatch(/6:30/);
  });
});
