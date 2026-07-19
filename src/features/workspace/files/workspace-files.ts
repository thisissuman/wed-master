import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";

import {
  expensesCsv,
  guestsCsv,
  parseDataBackup,
  serializeDataBackup,
  tasksCsv,
} from "../backup/backup-data";
import { makeWorkspaceId } from "../local-repositories";
import type { AttachmentRef, BackupHistoryEntry, WorkspaceSnapshot } from "../types";

const maximumAttachmentBytes = 5 * 1024 * 1024;
const maximumCoverPhotoBytes = 15 * 1024 * 1024;
const supportedAttachmentMimeTypes = ["image/jpeg", "image/png", "application/pdf"];

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

const coverExtension = (asset: ImagePicker.ImagePickerAsset) => {
  const fromName = asset.fileName?.toLowerCase().split(".").pop();
  if (fromName === "png" || fromName === "webp" || fromName === "heic") return fromName;
  if (fromName === "jpg" || fromName === "jpeg") return "jpg";
  if (asset.mimeType === "image/png") return "png";
  if (asset.mimeType === "image/webp") return "webp";
  if (asset.mimeType === "image/heic") return "heic";
  return "jpg";
};

export type CoverPhotoPickResult =
  | { status: "cancelled" }
  | { canAskAgain: boolean; status: "permission-denied" }
  | { status: "selected"; uri: string };

async function pickCoverPhoto(
  filePrefix: "event-cover" | "wedding-cover",
  subject: "event" | "wedding",
): Promise<CoverPhotoPickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { canAskAgain: permission.canAskAgain, status: "permission-denied" };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    mediaTypes: ["images"],
    quality: 0.82,
    selectionLimit: 1,
  });
  if (result.canceled) return { status: "cancelled" };

  const asset = result.assets[0];
  if (!asset) return { status: "cancelled" };
  if (asset.type && asset.type !== "image")
    throw new Error(`Choose an image for the ${subject} cover.`);
  if ((asset.fileSize ?? 0) > maximumCoverPhotoBytes) {
    throw new Error("Cover photos must be 15 MB or smaller.");
  }

  const directory = coverPhotosDirectory();
  ensureDirectory(directory);
  const destination = new File(
    directory,
    `${makeWorkspaceId(filePrefix)}.${coverExtension(asset)}`,
  );
  await new File(asset.uri).copy(destination);

  if (destination.size > maximumCoverPhotoBytes) {
    destination.delete();
    throw new Error("Cover photos must be 15 MB or smaller.");
  }

  return { status: "selected", uri: destination.uri };
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
    const file = new File(uri);
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
  if ((asset.size ?? 0) > maximumAttachmentBytes) {
    throw new Error("Attachments must be 5 MB or smaller.");
  }

  const directory = attachmentsDirectory();
  ensureDirectory(directory);
  const id = makeWorkspaceId("attachment");
  const destination = new File(directory, `${id}-${safeFileName(asset.name)}`);
  await new File(asset.uri).copy(destination);
  if (destination.size > maximumAttachmentBytes) {
    destination.delete();
    throw new Error("Attachments must be 5 MB or smaller.");
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
    const file = new File(attachment.uri);
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

export function clearWorkspaceLocalFiles() {
  const attachmentsCleared = clearWorkspaceAttachments();
  const coversCleared = clearWeddingCoverPhotos();
  return attachmentsCleared && coversCleared;
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

export async function pickWorkspaceBackup(): Promise<WorkspaceSnapshot | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  const text = await new File(asset.uri).text();
  return parseDataBackup(text);
}

export async function shareWorkspaceFile(uri: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device.");
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
