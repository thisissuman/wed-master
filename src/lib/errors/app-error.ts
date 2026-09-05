export const appErrorMessages = {
  cleanup_failure:
    "The main change was saved, but Mangalya could not finish cleaning up local files. It will retry safely.",
  file_too_large: "This file is too large. Choose a file that is 5 MB or smaller.",
  file_unreadable: "Mangalya could not read that file. Choose another file and try again.",
  inspiration_capacity:
    "Inspire storage is full. Remove some inspiration items before adding more.",
  invalid_backup: "This file is not a valid or supported Mangalya backup.",
  sharing_unsupported: "Sharing is not available on this device.",
  storage_write: "Mangalya could not save this change. Free some device storage and try again.",
  workspace_already_exists:
    "A local wedding workspace already exists. Open it or delete it before starting again.",
  workspace_capacity:
    "Your local workspace is full. Export a backup, then remove some items before trying again.",
} as const;

export type AppErrorCode = keyof typeof appErrorMessages;

/**
 * An application error whose user-facing copy is selected from a static allowlist.
 * The original cause is retained for local debugging but must never be rendered.
 */
export class AppError extends Error {
  readonly safeMessage: string;

  constructor(
    readonly code: AppErrorCode,
    readonly cause?: unknown,
  ) {
    super(appErrorMessages[code]);
    this.name = "AppError";
    this.safeMessage = appErrorMessages[code];
  }
}

export class InvalidBackupError extends AppError {
  constructor(cause?: unknown) {
    super("invalid_backup", cause);
    this.name = "InvalidBackupError";
  }
}

export class BackupFileTooLargeError extends AppError {
  constructor(cause?: unknown) {
    super("file_too_large", cause);
    this.name = "BackupFileTooLargeError";
  }
}

export class BackupFileUnreadableError extends AppError {
  constructor(cause?: unknown) {
    super("file_unreadable", cause);
    this.name = "BackupFileUnreadableError";
  }
}

export class WorkspaceCapacityError extends AppError {
  constructor(cause?: unknown) {
    super("workspace_capacity", cause);
    this.name = "WorkspaceCapacityError";
  }
}

export class InspirationCapacityError extends AppError {
  constructor(cause?: unknown) {
    super("inspiration_capacity", cause);
    this.name = "InspirationCapacityError";
  }
}

export class StorageWriteError extends AppError {
  constructor(cause?: unknown) {
    super("storage_write", cause);
    this.name = "StorageWriteError";
  }
}

export class WorkspaceAlreadyExistsError extends AppError {
  constructor() {
    super("workspace_already_exists");
    this.name = "WorkspaceAlreadyExistsError";
  }
}

export class UnsupportedSharingError extends AppError {
  constructor(cause?: unknown) {
    super("sharing_unsupported", cause);
    this.name = "UnsupportedSharingError";
  }
}

export class CleanupFailureError extends AppError {
  constructor(cause?: unknown) {
    super("cleanup_failure", cause);
    this.name = "CleanupFailureError";
  }
}
