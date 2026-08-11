import type { PaymentStatus } from "./types";

export function derivePaymentStatus(actualPaise: number, paidPaise: number): PaymentStatus {
  if (paidPaise <= 0) return "Not Paid";
  if (actualPaise > 0 && paidPaise >= actualPaise) return "Paid";
  return "Partially Paid";
}
