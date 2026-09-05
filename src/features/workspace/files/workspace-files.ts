import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import type { Action } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import {
  BackupFileTooLargeError,
  BackupFileUnreadableError,
  UnsupportedSharingError,
} from "@/lib/errors";

import {
  expensesCsv,
  guestsCsv,
  maximumBackupBytes,
  parseDataBackup,
  serializeDataBackup,
  tasksCsv,
} from "../backup/backup-data";
import { makeWorkspaceId } from "../local-repositories";
import type { AttachmentRef, BackupHistoryEntry, WorkspaceSnapshot } from "../types";

const maximumAttachmentBytes = 5 * 1024 * 1024;
const maximumCoverPhotoBytes = 15 * 1024 * 1024;
const maximumCoverPhotoPixels = 100_000_000;
const maximumStoredCoverPhotoBytes = 5 * 1024 * 1024;
const maximumStoredCoverPhotoLongEdge = 2_400;
const coverPhotoCompressionAttempts = [0.86, 0.72, 0.58] as const;
const supportedAttachmentMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
const safeCoverPhotoErrorMessages = new Set([
  "Choose an image for the event cover.",
  "Choose an image for the wedding cover.",
  "Cover photos must be 15 MB or smaller.",
  "Cover photos must be no larger than 100 megapixels.",
  "Mangalya could not make this cover photo small enough. Choose another image.",
  "Mangalya could not save this cover photo. Choose another image.",
]);

const attachmentsDirectory = () =>
  new Directory(new Directory(Paths.document, "mangalya"), "attachments");
const coverPhotosDirectory = () =>
  new Directory(new Directory(Paths.document, "mangalya"), "cover-photos");
const exportsDirectory = () => new Directory(new Directory(Paths.document, "mangalya"), "exports");

function ensureDirectory(directory: Directory) {
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function checkedSourceFile(uri: string, maximumBytes: number, tooLargeMessage: string): File {
  const source = new File(uri);
  let exists: boolean;
  let size: number;
  try {
    exists = source.exists;
    size = source.size;
  } catch (error) {
    throw new BackupFileUnreadableError(error);
  }
  if (!exists || !Number.isFinite(size) || size <= 0) throw new BackupFileUnreadableError();
  if (size > maximumBytes) throw new Error(tooLargeMessage);
  return source;
}

function deleteFileSafely(file: File | undefined) {
  if (!file) return;
  try {
    if (file.exists) file.delete();
  } catch {
    // Best-effort rollback. Startup repair will retry app-owned leftovers.
  }
}

function managedFile(uri: string, directory: Directory): File | null {
  try {
    const file = new File(uri);
    const prefix = `${directory.uri}/`;
    const relativePath = file.uri.startsWith(prefix) ? file.uri.slice(prefix.length) : "";
    if (
      !relativePath ||
      relativePath.includes("/") ||
      relativePath === "." ||
      relativePath === ".."
    ) {
      return null;
    }
    return file;
  } catch {
    return null;
  }
}

function coverResizeAction(width: number, height: number): Action[] {
  if (Math.max(width, height) <= maximumStoredCoverPhotoLongEdge) return [];
  return width >= height
    ? [{ resize: { width: maximumStoredCoverPhotoLongEdge } }]
    : [{ resize: { height: maximumStoredCoverPhotoLongEdge } }];
}

export type CoverPhotoPickResult =
  | { status: "cancelled" }
  | { canAskAgain: boolean; status: "permission-denied" }
  | { status: "selected"; uri: string };

export function coverPhotoErrorMessage(error: unknown): string | undefined {
  return error instanceof Error && safeCoverPhotoErrorMessages.has(error.message)
    ? error.message
    : undefined;
}

async function pickCoverPhoto(
  filePrefix: "event-cover" | "wedding-cover",
  subject: "event" | "wedding",
): Promise<CoverPhotoPickResult> {
  if (Platform.OS !== "android") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return { canAskAgain: permission.canAskAgain, status: "permission-denied" };
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [16, 9],
    mediaTypes: ["images"],
    quality: 0.82,
    selectionLimit: 1,
  });
  if (result.canceled) return { status: "cancelled" };

  const asset = result.assets[0];
  if (!asset) return { status: "cancelled" };
  if (asset.type && asset.type !== "image")
    throw new Error(`Choose an image for the ${subject} cover.`);
  if (
    !Number.isFinite(asset.width) ||
    !Number.isFinite(asset.height) ||
    asset.width <= 0 ||
    asset.height <= 0 ||
    asset.width > maximumCoverPhotoPixels / asset.height
  ) {
    throw new Error("Cover photos must be no larger than 100 megapixels.");
  }
  checkedSourceFile(asset.uri, maximumCoverPhotoBytes, "Cover photos must be 15 MB or smaller.");

  let destination: File | undefined;
  let generated: File | undefined;
  try {
    const actions = coverResizeAction(asset.width, asset.height);
    for (const compress of coverPhotoCompressionAttempts) {
      const result = await manipulateAsync(asset.uri, actions, {
        compress,
        format: SaveFormat.WEBP,
      });
      generated = checkedSourceFile(result.uri, Number.MAX_SAFE_INTEGER, "");
      if (generated.size <= maximumStoredCoverPhotoBytes) break;
      deleteFileSafely(generated);
      generated = undefined;
    }
    if (!generated) {
      throw new Error(
        "Mangalya could not make this cover photo small enough. Choose another image.",
      );
    }

    const directory = coverPhotosDirectory();
    ensureDirectory(directory);
    destination = new File(directory, `${makeWorkspaceId(filePrefix)}.webp`);
    await generated.copy(destination);
    if (
      !destination.exists ||
      !Number.isFinite(destination.size) ||
      destination.size <= 0 ||
      destination.size > maximumStoredCoverPhotoBytes
    ) {
      throw new Error("Mangalya could not save this cover photo. Choose another image.");
    }
    return { status: "selected", uri: destination.uri };
  } catch (error) {
    deleteFileSafely(destination);
    throw error;
  } finally {
    deleteFileSafely(generated);
  }
}

export function pickWeddingCoverPhoto(): Promise<CoverPhotoPickResult> {
  return pickCoverPhoto("wedding-cover", "wedding");
}

export function pickEventCoverPhoto(): Promise<CoverPhotoPickResult> {
  return pickCoverPhoto("event-cover", "event");
}

export function removeWeddingCoverPhoto(uri?: string) {
  if (!uri) return true;
  try {
    const file = managedFile(uri, coverPhotosDirectory());
    if (!file) return false;
    if (file.exists) file.delete();
    return true;
  } catch {
    return false;
  }
}

export const removeEventCoverPhoto = removeWeddingCoverPhoto;

export function clearWeddingCoverPhotos() {
  try {
    const directory = coverPhotosDirectory();
    if (directory.exists) directory.delete();
    return true;
  } catch {
    return false;
  }
}

function attachmentMimeType(name: string, provided?: string): string {
  if (provided && supportedAttachmentMimeTypes.includes(provided)) return provided;
  const extension = name.toLowerCase().split(".").pop();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "pdf") return "application/pdf";
  return provided ?? "application/octet-stream";
}

export async function pickWorkspaceAttachment(): Promise<AttachmentRef | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: supportedAttachmentMimeTypes,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;
  const mimeType = attachmentMimeType(asset.name, asset.mimeType);
  if (!supportedAttachmentMimeTypes.includes(mimeType)) {
    throw new Error("Choose a JPG, PNG, or PDF file.");
  }
  const source = checkedSourceFile(
    asset.uri,
    maximumAttachmentBytes,
    "Attachments must be 5 MB or smaller.",
  );

  const directory = attachmentsDirectory();
  ensureDirectory(directory);
  const id = makeWorkspaceId("attachment");
  const destination = new File(directory, `${id}-${safeFileName(asset.name)}`);
  try {
    await source.copy(destination);
    if (
      !destination.exists ||
      !Number.isFinite(destination.size) ||
      destination.size <= 0 ||
      destination.size > maximumAttachmentBytes
    ) {
      throw new Error("Attachments must be 5 MB or smaller.");
    }
  } catch (error) {
    deleteFileSafely(destination);
    throw error;
  }
  return {
    id,
    name: asset.name,
    uri: destination.uri,
    mimeType,
    size: destination.size,
    createdAt: new Date().toISOString(),
  };
}

export function removeWorkspaceAttachment(attachment?: AttachmentRef) {
  if (!attachment) return false;
  try {
    const file = managedFile(attachment.uri, attachmentsDirectory());
    if (!file) return false;
    if (file.exists) file.delete();
    return true;
  } catch {
    return false;
  }
}

export function clearWorkspaceAttachments() {
  try {
    const directory = attachmentsDirectory();
    if (directory.exists) directory.delete();
    return true;
  } catch {
    return false;
  }
}

export function clearWorkspaceExports() {
  try {
    const directory = exportsDirectory();
    if (directory.exists) directory.delete();
    return true;
  } catch {
    return false;
  }
}

export function removeWorkspaceExport(uri?: string) {
  if (!uri) return false;
  try {
    const file = managedFile(uri, exportsDirectory());
    if (!file) return false;
    if (file.exists) file.delete();
    return true;
  } catch {
    return false;
  }
}

function writeExportFile(fileName: string, content: string): File {
  const directory = exportsDirectory();
  ensureDirectory(directory);
  const file = new File(directory, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(content, { encoding: "utf8" });
  return file;
}

function exportStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function createWorkspaceBackupFile(snapshot: WorkspaceSnapshot): BackupHistoryEntry {
  const fileName = `mangalya-data-backup-${exportStamp()}.json`;
  const createdAt = new Date().toISOString();
  const file = writeExportFile(fileName, serializeDataBackup(snapshot, createdAt));
  return {
    id: makeWorkspaceId("backup-file"),
    kind: "backup",
    fileName,
    sizeBytes: file.size,
    createdAt,
    uri: file.uri,
  };
}

export function createWorkspaceRecoveryFile(rawText: string): string {
  const fileName = `mangalya-recovery-copy-${exportStamp()}.json`;
  return writeExportFile(fileName, rawText).uri;
}

export async function pickWorkspaceBackup(): Promise<WorkspaceSnapshot | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  const file = new File(asset.uri);
  let exists: boolean;
  let size: number;
  try {
    exists = file.exists;
    size = file.size;
  } catch (error) {
    throw new BackupFileUnreadableError(error);
  }
  if (!exists || !Number.isFinite(size) || size <= 0) {
    throw new BackupFileUnreadableError();
  }
  if (size > maximumBackupBytes) {
    throw new BackupFileTooLargeError();
  }
  let text: string;
  try {
    text = await file.text();
  } catch (error) {
    throw new BackupFileUnreadableError(error);
  }
  return parseDataBackup(text);
}

export async function shareWorkspaceFile(uri: string) {
  const file = managedFile(uri, exportsDirectory());
  if (!file) throw new BackupFileUnreadableError();
  try {
    if (!file.exists || !Number.isFinite(file.size) || file.size <= 0) {
      throw new BackupFileUnreadableError();
    }
  } catch (error) {
    if (error instanceof BackupFileUnreadableError) throw error;
    throw new BackupFileUnreadableError(error);
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new UnsupportedSharingError();
  }
  await Sharing.shareAsync(uri);
}

export function createExpensesCsv(snapshot: WorkspaceSnapshot): BackupHistoryEntry {
  return createCsvEntry("expenses", "expenses-csv", expensesCsv(snapshot));
}

export function createTasksCsv(snapshot: WorkspaceSnapshot): BackupHistoryEntry {
  return createCsvEntry("tasks", "tasks-csv", tasksCsv(snapshot));
}

export function createGuestsCsv(snapshot: WorkspaceSnapshot): BackupHistoryEntry {
  return createCsvEntry("guests", "guests-csv", guestsCsv(snapshot));
}

function createCsvEntry(
  label: string,
  kind: BackupHistoryEntry["kind"],
  content: string,
): BackupHistoryEntry {
  const fileName = `mangalya-${label}-${exportStamp()}.csv`;
  const file = writeExportFile(fileName, content);
  return {
    id: makeWorkspaceId("export-file"),
    kind,
    fileName,
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
    uri: file.uri,
  };
}

export type WorkspaceFileCleanupArea = "attachments" | "covers" | "exports";

export type WorkspaceFileCleanupReport = {
  failedAreas: WorkspaceFileCleanupArea[];
  removedCount: number;
};

function cleanupDirectoryOrphans(
  area: WorkspaceFileCleanupArea,
  directory: Directory,
  referencedUris: ReadonlySet<string>,
): Pick<WorkspaceFileCleanupReport, "failedAreas" | "removedCount"> {
  if (!directory.exists) return { failedAreas: [], removedCount: 0 };
  let removedCount = 0;
  try {
    for (const entry of directory.list()) {
      if (!(entry instanceof File) || referencedUris.has(entry.uri)) continue;
      entry.delete();
      removedCount += 1;
    }
    return { failedAreas: [], removedCount };
  } catch {
    return { failedAreas: [area], removedCount };
  }
}

export function cleanupOrphanedWorkspaceFiles(
  snapshot: WorkspaceSnapshot,
): WorkspaceFileCleanupReport {
  const attachmentUris = new Set<string>();
  for (const task of snapshot.tasks) {
    for (const attachment of task.attachments) attachmentUris.add(attachment.uri);
  }
  for (const expense of snapshot.expenses) {
    if (expense.receipt) attachmentUris.add(expense.receipt.uri);
  }

  const coverUris = new Set<string>();
  if (snapshot.wedding.coverPhotoUri) coverUris.add(snapshot.wedding.coverPhotoUri);
  for (const event of snapshot.events) {
    if (event.coverPhotoUri) coverUris.add(event.coverPhotoUri);
  }
  const exportUris = new Set(snapshot.backupHistory.map((entry) => entry.uri));

  const reports = [
    cleanupDirectoryOrphans("attachments", attachmentsDirectory(), attachmentUris),
    cleanupDirectoryOrphans("covers", coverPhotosDirectory(), coverUris),
    cleanupDirectoryOrphans("exports", exportsDirectory(), exportUris),
  ];
  return {
    failedAreas: reports.flatMap((report) => report.failedAreas),
    removedCount: reports.reduce((total, report) => total + report.removedCount, 0),
  };
}
