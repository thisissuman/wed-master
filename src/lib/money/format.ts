const PAISA_PER_RUPEE = 100;
const RUPEES_PER_LAKH = 100_000;
const RUPEES_PER_CRORE = 10_000_000;

const assertIntegerPaise = (paise: number) => {
  if (!Number.isInteger(paise)) {
    throw new Error("INR values must be represented as integer paise.");
  }
};

export function formatInr(paise: number): string {
  assertIntegerPaise(paise);

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(paise / PAISA_PER_RUPEE);
}

export function formatInrCompact(paise: number): string {
  assertIntegerPaise(paise);
  const absoluteRupees = Math.abs(paise) / PAISA_PER_RUPEE;
  const sign = paise < 0 ? "-" : "";
  const compactNumber = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      useGrouping: false,
    }).format(value);

  if (absoluteRupees >= RUPEES_PER_CRORE) {
    return `${sign}₹${compactNumber(absoluteRupees / RUPEES_PER_CRORE)}Cr`;
  }
  if (absoluteRupees >= RUPEES_PER_LAKH) {
    return `${sign}₹${compactNumber(absoluteRupees / RUPEES_PER_LAKH)}L`;
  }
  return formatInr(paise);
}
