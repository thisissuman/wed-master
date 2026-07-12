import { formatInr } from "./format";

describe("formatInr", () => {
  it("formats integer paise as Indian rupees", () => {
    expect(formatInr(123456)).toBe("₹1,234.56");
  });

  it("rejects fractional paise", () => {
    expect(() => formatInr(1.5)).toThrow("integer paise");
  });
});
