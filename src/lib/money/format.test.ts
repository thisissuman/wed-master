import { formatInr, formatInrCompact } from "./format";

describe("formatInr", () => {
  it("formats integer paise as Indian rupees", () => {
    expect(formatInr(123456)).toBe("₹1,234.56");
  });

  it("rejects fractional paise", () => {
    expect(() => formatInr(1.5)).toThrow("integer paise");
    expect(() => formatInrCompact(1.5)).toThrow("integer paise");
  });

  it("formats large home-screen values in lakh and crore units", () => {
    expect(formatInrCompact(280_000_000)).toBe("₹28.00L");
    expect(formatInrCompact(1_250_000_000)).toBe("₹1.25Cr");
    expect(formatInrCompact(-10_000_000)).toBe("-₹1.00L");
    expect(formatInrCompact(123_456)).toBe("₹1,234.56");
  });
});
