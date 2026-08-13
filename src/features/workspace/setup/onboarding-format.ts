export const digitsOnly = (value: string) => value.replace(/\D/g, "");

/**
 * Formats rupee input using the Indian 3-2-2 grouping pattern without ever
 * coercing the value to Number or BigInt. Keeping this string-only avoids
 * precision loss for pasted values and Hermes' BigInt/Intl incompatibility.
 */
export function formatBudgetInput(value: string) {
  const digits = digitsOnly(value).replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  if (digits.length <= 3) return digits;

  const finalThree = digits.slice(-3);
  const leadingDigits = digits.slice(0, -3);
  const groupedLeadingDigits = leadingDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${groupedLeadingDigits},${finalThree}`;
}
