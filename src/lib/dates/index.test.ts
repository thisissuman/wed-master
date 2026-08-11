import { daysUntilDateOnly, formatTimeOfDay, toDateOnly } from "./index";

describe("date-only helpers", () => {
  it("keeps the selected calendar day in local date-only form", () => {
    expect(toDateOnly(new Date(2026, 11, 14, 0, 0, 0))).toBe("2026-12-14");
  });

  it("formats an event time for Indian readers", () => {
    expect(formatTimeOfDay("18:30")).toMatch(/6:30/);
  });

  it("computes future, wedding-day, and past date states by calendar day", () => {
    expect(daysUntilDateOnly("2026-07-20", "2026-07-17")).toBe(3);
    expect(daysUntilDateOnly("2026-07-17", "2026-07-17")).toBe(0);
    expect(daysUntilDateOnly("2026-07-16", "2026-07-17")).toBe(-1);
  });

  it("does not drift across daylight-saving boundaries", () => {
    expect(daysUntilDateOnly("2026-03-09", "2026-03-07")).toBe(2);
  });
});
