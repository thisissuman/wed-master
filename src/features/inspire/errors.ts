import { InspirationCorruptionError, InspirationNotFoundError } from "./local-inspiration-store";

export function inspirationErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (error instanceof InspirationCorruptionError) return error.message;
  if (error instanceof InspirationNotFoundError) return error.message;
  if (!(error instanceof Error)) return fallback;

  if (error.message.includes("50 MB or smaller")) {
    return "Choose an image that is 50 MB or smaller.";
  }
  if (error.message.includes("15 MB or smaller")) {
    return "This image stayed above 15 MB after several compression attempts. Try a smaller copy.";
  }
  if (/could not (read|save) the processed inspiration image/i.test(error.message)) {
    return "Mangalya could not finish saving this image. Check device storage and try again.";
  }
  if (error.message.includes("invalid dimensions")) {
    return "Mangalya could not read this image's dimensions. Try another copy.";
  }
  if (/disk|space|storage/i.test(error.message)) {
    return "There is not enough device storage to save this inspiration.";
  }
  return fallback;
}
