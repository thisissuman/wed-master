import { AppError } from "./app-error";

export const genericErrorMessage = "Something went wrong. Please try again.";

export function toUserMessage(error: unknown): string {
  return error instanceof AppError ? error.safeMessage : genericErrorMessage;
}
