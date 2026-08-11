const NETWORK_ERROR_PATTERN = /network|fetch|offline|timeout/i;

export function toUserMessage(error: unknown): string {
  if (error instanceof Error && NETWORK_ERROR_PATTERN.test(error.message)) {
    return "We could not reach the service. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}
