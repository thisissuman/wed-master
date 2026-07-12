const PAISA_PER_RUPEE = 100;

export function formatInr(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new Error("INR values must be represented as integer paise.");
  }

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(paise / PAISA_PER_RUPEE);
}
