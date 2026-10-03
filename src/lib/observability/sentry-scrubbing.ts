import type { ErrorEvent, Event, TransactionEvent } from "@sentry/react-native";

import { appErrorMessages } from "@/lib/errors";

const redactedErrorMessage = "An application error occurred.";

const allowedExceptionTypes = new Set([
  "AppError",
  "BackupFileTooLargeError",
  "BackupFileUnreadableError",
  "CleanupFailureError",
  "Error",
  "InspirationCapacityError",
  "InvalidBackupError",
  "RangeError",
  "ReferenceError",
  "StorageWriteError",
  "SyntaxError",
  "TypeError",
  "UnsupportedSharingError",
  "WorkspaceAlreadyExistsError",
  "WorkspaceCapacityError",
]);

const allowedOperations = new Set([
  "app_startup",
  "backup_export",
  "backup_import",
  "lifecycle_cleanup",
  "workspace_read",
  "workspace_write",
]);
const allowedErrorCodes = new Set(Object.keys(appErrorMessages));
type SentryTagValue = NonNullable<Event["tags"]>[string];

function sanitizeTags(tags: Event["tags"]): Event["tags"] {
  if (!tags) return undefined;
  const sanitized: Record<string, SentryTagValue> = {};
  if (typeof tags.operation === "string" && allowedOperations.has(tags.operation)) {
    sanitized.operation = tags.operation;
  }
  if (typeof tags.error_code === "string" && allowedErrorCodes.has(tags.error_code)) {
    sanitized.error_code = tags.error_code;
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent;
export function sanitizeSentryEvent(event: TransactionEvent): TransactionEvent;
export function sanitizeSentryEvent(event: Event): Event;
export function sanitizeSentryEvent(event: Event): Event {
  return {
    ...event,
    breadcrumbs: undefined,
    contexts: undefined,
    debug_meta: undefined,
    exception: event.exception
      ? {
          values: event.exception.values?.map((exception) => ({
            type:
              exception.type && allowedExceptionTypes.has(exception.type)
                ? exception.type
                : "Error",
            value: redactedErrorMessage,
            stacktrace: exception.stacktrace
              ? {
                  frames: exception.stacktrace.frames?.map((frame) => ({
                    addr_mode: frame.addr_mode,
                    colno: frame.colno,
                    debug_id: frame.debug_id,
                    filename: frame.filename ? "[source file]" : undefined,
                    in_app: frame.in_app,
                    instruction_addr: frame.instruction_addr,
                    lineno: frame.lineno,
                    platform: frame.platform,
                  })),
                  frames_omitted: exception.stacktrace.frames_omitted,
                }
              : undefined,
          })),
        }
      : undefined,
    extra: undefined,
    fingerprint: undefined,
    logger: undefined,
    logentry: undefined,
    measurements: undefined,
    message: event.message ? redactedErrorMessage : undefined,
    modules: undefined,
    request: undefined,
    sdkProcessingMetadata: undefined,
    server_name: undefined,
    spans: undefined,
    start_timestamp: undefined,
    tags: sanitizeTags(event.tags),
    threads: undefined,
    transaction: undefined,
    transaction_info: undefined,
    user: undefined,
  };
}
