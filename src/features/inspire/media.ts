import { Directory, File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat, type Action } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { maximumInspirationMediaBytes } from "./schemas";
import type {
  Inspiration,
  InspirationMedia,
  InspirationMediaDraft,
  InspirationMediaPickResult,
  InspirationSourceType,
} from "./types";

export const inspirationDetailMaxLongEdge = 2_400;
export const inspirationThumbnailMaxLongEdge = 720;
export const maximumInspirationSourceBytes = 50 * 1024 * 1024;
export const maximumInspirationSourcePixels = 100_000_000;

const detailCompressionAttempts = [0.86, 0.72, 0.58] as const;
const thumbnailCompressionAttempts = [0.78, 0.64] as const;

const inspirationMediaDirectory = () =>
  new Directory(new Directory(Paths.document, "mangalya"), "inspiration-media");

function ensureMediaDirectory(): Directory {
  const directory = inspirationMediaDirectory();
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  return directory;
}

function defaultDraftId(): string {
  return `inspiration-media-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type InspirationMediaPipelineOptions = {
  createId?: () => string;
  now?: () => string;
  platform?: "android" | "ios" | "web";
};

export type InspirationMediaSource = Pick<
  ImagePicker.ImagePickerAsset,
  "fileName" | "fileSize" | "height" | "mimeType" | "type" | "uri" | "width"
>;

export function derivativeDimensions(
  width: number,
  height: number,
  maxLongEdge: number,
): { width: number; height: number } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(maxLongEdge) ||
    width <= 0 ||
    height <= 0 ||
    maxLongEdge <= 0
  ) {
    throw new Error("The selected image has invalid dimensions.");
  }
  const scale = Math.min(1, maxLongEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function resizeAction(
  sourceWidth: number,
  sourceHeight: number,
  target: { width: number; height: number },
): Action[] {
  if (target.width === sourceWidth && target.height === sourceHeight) return [];
  return sourceWidth >= sourceHeight
    ? [{ resize: { width: target.width } }]
    : [{ resize: { height: target.height } }];
}

function tryDeleteFile(uri?: string): boolean {
  if (!uri) return true;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
    return true;
  } catch {
    return false;
  }
}

function readableFileSize(file: File): number {
  const size = file.size;
  if (!file.exists || !Number.isFinite(size) || size <= 0) {
    throw new Error("Mangalya could not read the processed inspiration image.");
  }
  return size;
}

function sourceFileSize(source: InspirationMediaSource): number {
  const file = new File(source.uri);
  const size = file.size;
  if (!file.exists || !Number.isFinite(size) || size <= 0) {
    throw new Error("Mangalya could not read the selected image.");
  }
  if (size > maximumInspirationSourceBytes) {
    throw new Error("Choose an image that is 50 MB or smaller.");
  }
  return size;
}

function assertSourcePixels(source: InspirationMediaSource): void {
  const pixels = source.width * source.height;
  if (!Number.isSafeInteger(pixels) || pixels > maximumInspirationSourcePixels) {
    throw new Error("Choose an image smaller than 100 megapixels.");
  }
}

async function copyDerivative(
  sourceUri: string,
  destination: File,
  sourceSize: number,
): Promise<number> {
  await new File(sourceUri).copy(destination);
  if (!destination.exists) {
    throw new Error("Mangalya could not save the processed inspiration image.");
  }

  // Android can briefly report a zero size immediately after a successful copy.
  // The source and destination bytes are identical, so retain the verified source
  // size instead of misreporting a normal image as oversized.
  const copiedSize = destination.size;
  const size = Number.isFinite(copiedSize) && copiedSize > 0 ? copiedSize : sourceSize;
  if (size > maximumInspirationMediaBytes) {
    tryDeleteFile(destination.uri);
    throw new Error("Processed inspiration images must be 15 MB or smaller.");
  }
  return size;
}

async function createDerivative(
  source: InspirationMediaSource,
  dimensions: { width: number; height: number },
  compressionAttempts: readonly number[],
): Promise<{
  height: number;
  sizeBytes: number;
  uri: string;
  width: number;
}> {
  for (const compress of compressionAttempts) {
    const result = await manipulateAsync(
      source.uri,
      resizeAction(source.width, source.height, dimensions),
      { compress, format: SaveFormat.WEBP },
    );
    const file = new File(result.uri);
    let sizeBytes: number;
    try {
      sizeBytes = readableFileSize(file);
    } catch (error) {
      tryDeleteFile(result.uri);
      throw error;
    }
    if (sizeBytes <= maximumInspirationMediaBytes) {
      return {
        height: result.height,
        sizeBytes,
        uri: result.uri,
        width: result.width,
      };
    }
    tryDeleteFile(result.uri);
  }

  throw new Error("Processed inspiration images must be 15 MB or smaller.");
}

async function createDraftFromAsset(
  asset: InspirationMediaSource,
  sourceType: InspirationSourceType,
  options: InspirationMediaPipelineOptions,
): Promise<InspirationMediaDraft> {
  if (asset.type && asset.type !== "image") {
    throw new Error("Choose an image for your inspiration board.");
  }
  sourceFileSize(asset);
  assertSourcePixels(asset);

  const detailDimensions = derivativeDimensions(
    asset.width,
    asset.height,
    inspirationDetailMaxLongEdge,
  );
  const thumbnailDimensions = derivativeDimensions(
    asset.width,
    asset.height,
    inspirationThumbnailMaxLongEdge,
  );
  const draftId = (options.createId ?? defaultDraftId)();
  const directory = ensureMediaDirectory();
  const detailFile = new File(directory, `${draftId}-detail.webp`);
  const thumbnailFile = new File(directory, `${draftId}-thumbnail.webp`);
  if (detailFile.exists || thumbnailFile.exists) {
    throw new Error("Could not create unique inspiration media files.");
  }
  let detailCacheUri: string | undefined;
  let thumbnailCacheUri: string | undefined;

  try {
    const detailResult = await createDerivative(asset, detailDimensions, detailCompressionAttempts);
    detailCacheUri = detailResult.uri;
    const detailSizeBytes = await copyDerivative(
      detailResult.uri,
      detailFile,
      detailResult.sizeBytes,
    );

    const thumbnailResult = await createDerivative(
      asset,
      thumbnailDimensions,
      thumbnailCompressionAttempts,
    );
    thumbnailCacheUri = thumbnailResult.uri;
    const thumbnailSizeBytes = await copyDerivative(
      thumbnailResult.uri,
      thumbnailFile,
      thumbnailResult.sizeBytes,
    );

    return {
      id: draftId,
      sourceType,
      createdAt: (options.now ?? (() => new Date().toISOString()))(),
      media: {
        detailUri: detailFile.uri,
        detailWidth: detailResult.width,
        detailHeight: detailResult.height,
        detailSizeBytes,
        thumbnailUri: thumbnailFile.uri,
        thumbnailWidth: thumbnailResult.width,
        thumbnailHeight: thumbnailResult.height,
        thumbnailSizeBytes,
        mimeType: "image/webp",
      },
    };
  } catch (error) {
    tryDeleteFile(detailFile.uri);
    tryDeleteFile(thumbnailFile.uri);
    throw error;
  } finally {
    tryDeleteFile(detailCacheUri);
    tryDeleteFile(thumbnailCacheUri);
  }
}

export function createInspirationMediaDraftFromSource(
  source: InspirationMediaSource,
  sourceType: InspirationSourceType = "gallery",
  options: InspirationMediaPipelineOptions = {},
): Promise<InspirationMediaDraft> {
  return createDraftFromAsset(source, sourceType, options);
}

async function pickInspirationMedia(
  sourceType: InspirationSourceType,
  options: InspirationMediaPipelineOptions = {},
): Promise<InspirationMediaPickResult> {
  // Android's system photo picker does not require broad media-library access.
  // Requesting it first can produce a denial even though the picker is available.
  const platform = options.platform ?? Platform.OS;
  if (sourceType === "camera" || platform !== "android") {
    const permission =
      sourceType === "gallery"
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return {
        status: "permission-denied",
        source: sourceType,
        canAskAgain: permission.canAskAgain,
      };
    }
  }

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    allowsEditing: false,
    mediaTypes: ["images"],
    quality: 1,
    selectionLimit: 1,
  };
  const result =
    sourceType === "gallery"
      ? await ImagePicker.launchImageLibraryAsync(pickerOptions)
      : await ImagePicker.launchCameraAsync(pickerOptions);
  if (result.canceled) return { status: "cancelled" };
  const asset = result.assets[0];
  if (!asset) return { status: "cancelled" };
  return { status: "selected", draft: await createDraftFromAsset(asset, sourceType, options) };
}

export function pickInspirationFromGallery(
  options?: InspirationMediaPipelineOptions,
): Promise<InspirationMediaPickResult> {
  return pickInspirationMedia("gallery", options);
}

export function pickInspirationFromCamera(
  options?: InspirationMediaPipelineOptions,
): Promise<InspirationMediaPickResult> {
  return pickInspirationMedia("camera", options);
}

export function isManagedInspirationMediaUri(uri: string): boolean {
  return managedInspirationMediaFile(uri) !== undefined;
}

/**
 * Normalize a file URI before comparing or deleting it. Managed media files
 * are flat children of one app-owned directory; rejecting nested segments
 * also prevents encoded `..` traversal from reaching another directory.
 */
function canonicalFileUri(uri: string): string | undefined {
  if (typeof uri !== "string" || !uri || uri.includes("?") || uri.includes("#")) {
    return undefined;
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(uri);
  } catch {
    return undefined;
  }
  const schemeSeparator = decoded.indexOf("://");
  if (schemeSeparator <= 0) return undefined;
  const scheme = decoded.slice(0, schemeSeparator + 3);
  const rest = decoded.slice(schemeSeparator + 3);
  const leadingSlash = rest.startsWith("/");
  const segments = rest.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) return undefined;
  const normalized: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (!normalized.length) return undefined;
      normalized.pop();
      continue;
    }
    normalized.push(segment);
  }
  return `${scheme}${leadingSlash ? "/" : ""}${normalized.join("/")}`;
}

function managedInspirationMediaFile(uri: string): File | undefined {
  const canonicalUri = canonicalFileUri(uri);
  const directoryUri = canonicalFileUri(inspirationMediaDirectory().uri);
  if (!canonicalUri || !directoryUri) return undefined;
  const prefix = `${directoryUri}/`;
  if (!canonicalUri.startsWith(prefix)) return undefined;
  const relativePath = canonicalUri.slice(prefix.length);
  if (!relativePath || /[\\/]/u.test(relativePath)) return undefined;
  try {
    return new File(canonicalUri);
  } catch {
    return undefined;
  }
}

function mediaValue(value: InspirationMedia | InspirationMediaDraft): InspirationMedia {
  return "media" in value ? value.media : value;
}

export function removeInspirationMedia(value: InspirationMedia | InspirationMediaDraft): boolean {
  const media = mediaValue(value);
  const uris = [media.detailUri, media.thumbnailUri];
  const files = uris.map(managedInspirationMediaFile);
  const managedFiles = files.filter((file): file is File => file !== undefined);
  if (managedFiles.length !== uris.length) return false;
  return managedFiles.every((file) => {
    try {
      if (file.exists) file.delete();
      return true;
    } catch {
      return false;
    }
  });
}

export function clearInspirationMedia(): boolean {
  try {
    const directory = inspirationMediaDirectory();
    if (directory.exists) directory.delete();
    return true;
  } catch {
    return false;
  }
}

export function cleanupOrphanedInspirationMedia(
  inspirations: readonly (Inspiration | InspirationMediaDraft)[],
): {
  removed: number;
  failed: number;
} {
  const directory = inspirationMediaDirectory();
  if (!directory.exists) return { removed: 0, failed: 0 };
  const retained = new Set(
    inspirations.flatMap((inspiration) => [
      inspiration.media.detailUri,
      inspiration.media.thumbnailUri,
    ]),
  );
  let removed = 0;
  let failed = 0;
  for (const entry of directory.list()) {
    if (!(entry instanceof File) || retained.has(entry.uri)) continue;
    if (tryDeleteFile(entry.uri)) removed += 1;
    else failed += 1;
  }
  return { removed, failed };
}
