import type { ErrorEvent, Event, TransactionEvent } from "@sentry/react-native";

function scrubText(value: string | undefined): string | undefined {
  return value
    ?.replace(/file:\/\/\S+|\/(?:Users|home)\/\S+|[A-Za-z]:\\\S+/g, "[local path]")
    .replace(/\+?\d[\d\s-]{7,}\d/g, "[phone]")
    .replace(/(?:₹|INR\s*)[\d,.]+/gi, "[financial value]")
    .replace(/\b(?:actual|paid|budget|amount|paise)\s*[:=]\s*[\d,.]+/gi, "[financial value]");
}

export function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent;
export function sanitizeSentryEvent(event: TransactionEvent): TransactionEvent;
export function sanitizeSentryEvent(event: Event): Event;
export function sanitizeSentryEvent(event: Event): Event {
  return {
    ...event,
    breadcrumbs: undefined,
    contexts: undefined,
    exception: event.exception
      ? {
          ...event.exception,
          values: event.exception.values?.map((exception) => ({
            ...exception,
            value: scrubText(exception.value),
            stacktrace: exception.stacktrace
              ? {
                  ...exception.stacktrace,
                  frames: exception.stacktrace.frames?.map((frame) => ({
                    ...frame,
                    abs_path: undefined,
                    filename: scrubText(frame.filename),
                  })),
                }
              : undefined,
          })),
        }
      : undefined,
    extra: undefined,
    message: scrubText(event.message),
    request: undefined,
    user: undefined,
  };
}
