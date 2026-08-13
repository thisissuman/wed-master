export const defaultKeepsakeMessage =
  "Every little plan is bringing us closer to a day we will remember forever.";

export const keepsakeMessageMaxLength = 180;

export function displayedKeepsakeMessage(message?: string) {
  return message?.trim() || defaultKeepsakeMessage;
}
