import { digitsOnly, formatBudgetInput } from "./onboarding-format";

describe("onboarding budget input", () => {
  it.each([
    ["", ""],
    ["9", "9"],
    ["999", "999"],
    ["1000", "1,000"],
    ["100000", "1,00,000"],
    ["1200000", "12,00,000"],
    ["₹ 12,00,000", "12,00,000"],
    ["0001200000", "12,00,000"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatBudgetInput(input)).toBe(expected);
  });

  it("formats values larger than Number can safely represent without throwing", () => {
    expect(formatBudgetInput("999999999999999999999999")).toBe(
      "9,99,99,99,99,99,99,99,99,99,99,999",
    );
  });

  it("extracts only decimal digits for paise conversion", () => {
    expect(digitsOnly("₹ 12,00,000")).toBe("1200000");
  });
});
