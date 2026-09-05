import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import {
  cleanupOrphanedInspirationMedia,
  createInspirationMediaDraftFromSource,
  derivativeDimensions,
  isManagedInspirationMediaUri,
  pickInspirationFromCamera,
  pickInspirationFromGallery,
  removeInspirationMedia,
} from "./media";
import type { Inspiration } from "./types";

jest.mock("expo-image-picker", () => ({
  PermissionStatus: { DENIED: "denied", GRANTED: "granted" },
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { WEBP: "webp" },
  manipulateAsync: jest.fn(),
}));

jest.mock("expo-file-system", () => {
  const files = new Map<string, { size: number }>();
  const directories = new Set<string>();
  const zeroSizeDestinations = new Set<string>();

  const pathOf = (part: unknown) =>
    typeof part === "string" ? part : ((part as { uri?: string } | undefined)?.uri ?? "");
  const join = (...parts: unknown[]) => parts.map(pathOf).filter(Boolean).join("/");

  class File {
    uri: string;

    constructor(...parts: unknown[]) {
      this.uri = join(...parts);
    }

    get exists() {
      return files.has(this.uri);
    }

    get size() {
      return files.get(this.uri)?.size ?? 0;
    }

    async copy(destination: File) {
      files.set(destination.uri, {
        size: zeroSizeDestinations.has(destination.uri) ? 0 : (files.get(this.uri)?.size ?? 0),
      });
    }

    delete() {
      files.delete(this.uri);
    }
  }

  class Directory {
    uri: string;

    constructor(...parts: unknown[]) {
      this.uri = join(...parts);
    }

    get exists() {
      return directories.has(this.uri);
    }

    create() {
      directories.add(this.uri);
    }

    list() {
      return [...files.keys()]
        .filter((uri) => uri.startsWith(`${this.uri}/`))
        .map((uri) => new File(uri));
    }

    delete() {
      directories.delete(this.uri);
      for (const uri of files.keys()) {
        if (uri.startsWith(`${this.uri}/`)) files.delete(uri);
      }
    }
  }

  return {
    Directory,
    File,
    Paths: { document: { uri: "file:///documents" } },
    __directories: directories,
    __files: files,
    __zeroSizeDestinations: zeroSizeDestinations,
  };
});

const mockImagePicker = jest.mocked(ImagePicker);
const mockManipulate = jest.mocked(ImageManipulator.manipulateAsync);
const mockFileSystem = jest.requireMock("expo-file-system") as {
  __directories: Set<string>;
  __files: Map<string, { size: number }>;
  __zeroSizeDestinations: Set<string>;
};

const grantedPermission = {
  canAskAgain: true,
  expires: "never" as const,
  granted: true,
  status: ImagePicker.PermissionStatus.GRANTED,
};

const selectedAsset: ImagePicker.ImagePickerAsset = {
  fileName: "mandap.heic",
  fileSize: 12_000_000,
  height: 4_000,
  type: "image",
  uri: "file:///picked.heic",
  width: 6_000,
};

function queueDerivatives() {
  mockFileSystem.__files.set("file:///cache/detail.webp", { size: 900_000 });
  mockFileSystem.__files.set("file:///cache/thumbnail.webp", { size: 90_000 });
  mockManipulate
    .mockResolvedValueOnce({
      uri: "file:///cache/detail.webp",
      width: 2_400,
      height: 1_600,
    })
    .mockResolvedValueOnce({
      uri: "file:///cache/thumbnail.webp",
      width: 720,
      height: 480,
    });
}

describe("Inspire media pipeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem.__directories.clear();
    mockFileSystem.__files.clear();
    mockFileSystem.__zeroSizeDestinations.clear();
    mockFileSystem.__files.set(selectedAsset.uri, { size: selectedAsset.fileSize ?? 1 });
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue(grantedPermission);
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue(grantedPermission);
  });

  it("calculates natural-ratio derivatives without upscaling", () => {
    expect(derivativeDimensions(6_000, 4_000, 2_400)).toEqual({ width: 2_400, height: 1_600 });
    expect(derivativeDimensions(400, 600, 720)).toEqual({ width: 400, height: 600 });
    expect(derivativeDimensions(12_000, 1_000, 720)).toEqual({ width: 720, height: 60 });
    expect(derivativeDimensions(1_080, 10_000, 2_400)).toEqual({ width: 259, height: 2_400 });
    expect(() => derivativeDimensions(0, 600, 720)).toThrow("invalid dimensions");
  });

  it.each(["picked.heic", "picked.jpg", "picked.png"])(
    "processes supported image source %s through the same orientation-safe pipeline",
    async (fileName) => {
      mockFileSystem.__files.set(`file:///${fileName}`, { size: selectedAsset.fileSize ?? 1 });
      queueDerivatives();

      await expect(
        createInspirationMediaDraftFromSource(
          { ...selectedAsset, fileName, uri: `file:///${fileName}` },
          "gallery",
          { createId: () => fileName },
        ),
      ).resolves.toMatchObject({ media: { mimeType: "image/webp" } });
    },
  );

  it("rejects oversized sources before processing and rolls back oversized derivatives", async () => {
    mockFileSystem.__files.set(selectedAsset.uri, { size: 50 * 1024 * 1024 + 1 });
    await expect(
      createInspirationMediaDraftFromSource({
        ...selectedAsset,
      }),
    ).rejects.toThrow("50 MB or smaller");
    expect(mockManipulate).not.toHaveBeenCalled();

    mockFileSystem.__files.set(selectedAsset.uri, { size: selectedAsset.fileSize ?? 1 });

    for (const attempt of [1, 2, 3]) {
      const uri = `file:///cache/too-large-${attempt}.webp`;
      mockFileSystem.__files.set(uri, { size: 15 * 1024 * 1024 + 1 });
      mockManipulate.mockResolvedValueOnce({ uri, width: 2_400, height: 1_600 });
    }
    await expect(
      createInspirationMediaDraftFromSource(selectedAsset, "gallery", {
        createId: () => "oversized-derivative",
      }),
    ).rejects.toThrow("15 MB or smaller");
    expect(
      [...mockFileSystem.__files.keys()].filter((uri) => uri.includes("oversized-derivative")),
    ).toEqual([]);
  });

  it("rejects unreadable and over-100-megapixel sources before decoding", async () => {
    mockFileSystem.__files.delete(selectedAsset.uri);
    await expect(createInspirationMediaDraftFromSource(selectedAsset)).rejects.toThrow(
      "could not read the selected image",
    );

    mockFileSystem.__files.set(selectedAsset.uri, { size: selectedAsset.fileSize ?? 1 });
    await expect(
      createInspirationMediaDraftFromSource({
        ...selectedAsset,
        height: 10_001,
        width: 10_000,
      }),
    ).rejects.toThrow("smaller than 100 megapixels");
    expect(mockManipulate).not.toHaveBeenCalled();
  });

  it("returns permission and cancellation states without creating files", async () => {
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
      ...grantedPermission,
      canAskAgain: false,
      granted: false,
      status: ImagePicker.PermissionStatus.DENIED,
    });
    await expect(pickInspirationFromGallery()).resolves.toEqual({
      status: "permission-denied",
      source: "gallery",
      canAskAgain: false,
    });

    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: null });
    await expect(pickInspirationFromGallery()).resolves.toEqual({ status: "cancelled" });
    expect(mockManipulate).not.toHaveBeenCalled();
    expect([...mockFileSystem.__files.keys()]).toEqual([selectedAsset.uri]);
  });

  it("creates WebP detail and thumbnail files with natural aspect ratios", async () => {
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [selectedAsset],
    });
    queueDerivatives();

    const result = await pickInspirationFromGallery({
      createId: () => "draft-one",
      now: () => "2026-08-24T10:00:00.000Z",
    });

    expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsEditing: false, quality: 1, selectionLimit: 1 }),
    );
    expect(mockManipulate).toHaveBeenNthCalledWith(
      1,
      selectedAsset.uri,
      [{ resize: { width: 2_400 } }],
      { compress: 0.86, format: "webp" },
    );
    expect(mockManipulate).toHaveBeenNthCalledWith(
      2,
      selectedAsset.uri,
      [{ resize: { width: 720 } }],
      { compress: 0.78, format: "webp" },
    );
    expect(result.status).toBe("selected");
    if (result.status === "selected") {
      expect(result.draft).toMatchObject({
        id: "draft-one",
        sourceType: "gallery",
        media: {
          detailWidth: 2_400,
          detailHeight: 1_600,
          detailSizeBytes: 900_000,
          thumbnailWidth: 720,
          thumbnailHeight: 480,
          thumbnailSizeBytes: 90_000,
          mimeType: "image/webp",
        },
      });
      expect(isManagedInspirationMediaUri(result.draft.media.detailUri)).toBe(true);
      expect(mockFileSystem.__files.has(result.draft.media.detailUri)).toBe(true);
      expect(mockFileSystem.__files.has("file:///cache/detail.webp")).toBe(false);
    }
  });

  it("uses the camera permission and camera picker for a camera draft", async () => {
    mockImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [selectedAsset],
    });
    queueDerivatives();

    const result = await pickInspirationFromCamera({ createId: () => "camera-one" });

    expect(mockImagePicker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockImagePicker.launchCameraAsync).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: "selected", draft: { sourceType: "camera" } });
  });

  it("opens the Android system gallery without requesting broad library permission", async () => {
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: null });

    await expect(pickInspirationFromGallery({ platform: "android" })).resolves.toEqual({
      status: "cancelled",
    });
    expect(mockImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
  });

  it("uses the runtime Android platform when no pipeline override is provided", async () => {
    const platform = jest.replaceProperty(Platform, "OS", "android");
    try {
      mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });
      await expect(pickInspirationFromGallery()).resolves.toEqual({ status: "cancelled" });
      expect(mockImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    } finally {
      platform.restore();
    }
  });

  it("retains the verified cache size when Android briefly reports a zero-byte copy", async () => {
    queueDerivatives();
    mockFileSystem.__zeroSizeDestinations.add(
      "file:///documents/mangalya/inspiration-media/android-zero-size-detail.webp",
    );

    const result = await createInspirationMediaDraftFromSource(selectedAsset, "gallery", {
      createId: () => "android-zero-size",
    });

    expect(result.media.detailSizeBytes).toBe(900_000);
    expect(mockFileSystem.__files.has(result.media.detailUri)).toBe(true);
  });

  it("retries an oversized detail derivative at a lower WebP quality", async () => {
    const oversizedUri = "file:///cache/detail-oversized.webp";
    const compressedUri = "file:///cache/detail-compressed.webp";
    const thumbnailUri = "file:///cache/thumbnail.webp";
    mockFileSystem.__files.set(oversizedUri, { size: 15 * 1024 * 1024 + 1 });
    mockFileSystem.__files.set(compressedUri, { size: 2_000_000 });
    mockFileSystem.__files.set(thumbnailUri, { size: 90_000 });
    mockManipulate
      .mockResolvedValueOnce({ uri: oversizedUri, width: 2_400, height: 1_600 })
      .mockResolvedValueOnce({ uri: compressedUri, width: 2_400, height: 1_600 })
      .mockResolvedValueOnce({ uri: thumbnailUri, width: 720, height: 480 });

    const result = await createInspirationMediaDraftFromSource(selectedAsset, "gallery", {
      createId: () => "adaptive-compression",
    });

    expect(mockManipulate).toHaveBeenNthCalledWith(
      2,
      selectedAsset.uri,
      [{ resize: { width: 2_400 } }],
      { compress: 0.72, format: "webp" },
    );
    expect(result.media.detailSizeBytes).toBe(2_000_000);
    expect(mockFileSystem.__files.has(oversizedUri)).toBe(false);
  });

  it("rolls back a partial derivative failure", async () => {
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [selectedAsset],
    });
    mockFileSystem.__files.set("file:///cache/detail.webp", { size: 900_000 });
    mockManipulate
      .mockResolvedValueOnce({
        uri: "file:///cache/detail.webp",
        width: 2_400,
        height: 1_600,
      })
      .mockRejectedValueOnce(new Error("Thumbnail failed"));

    await expect(pickInspirationFromGallery({ createId: () => "failed-draft" })).rejects.toThrow(
      "Thumbnail failed",
    );
    expect(
      [...mockFileSystem.__files.keys()].filter((uri) => uri.includes("failed-draft")),
    ).toEqual([]);
    expect(mockFileSystem.__files.has("file:///cache/detail.webp")).toBe(false);
  });

  it("does not overwrite or remove media when a draft ID collides", async () => {
    const existingDetail = "file:///documents/mangalya/inspiration-media/existing-detail.webp";
    const existingThumbnail =
      "file:///documents/mangalya/inspiration-media/existing-thumbnail.webp";
    mockFileSystem.__directories.add("file:///documents/mangalya/inspiration-media");
    mockFileSystem.__files.set(existingDetail, { size: 123_000 });
    mockFileSystem.__files.set(existingThumbnail, { size: 12_000 });
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [selectedAsset],
    });

    await expect(pickInspirationFromGallery({ createId: () => "existing" })).rejects.toThrow(
      "unique inspiration media",
    );
    expect(mockManipulate).not.toHaveBeenCalled();
    expect(mockFileSystem.__files.get(existingDetail)?.size).toBe(123_000);
    expect(mockFileSystem.__files.get(existingThumbnail)?.size).toBe(12_000);
  });

  it("removes only managed files and cleans orphans without touching active media", async () => {
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [selectedAsset],
    });
    queueDerivatives();
    const result = await pickInspirationFromGallery({ createId: () => "active" });
    if (result.status !== "selected") throw new Error("Expected a selected draft.");
    const inspiration: Inspiration = {
      id: "inspiration-active",
      weddingId: "wedding-1",
      category: "stage",
      sourceType: "gallery",
      media: result.draft.media,
      isFavourite: false,
      createdAt: "2026-08-24T10:00:00.000Z",
      updatedAt: "2026-08-24T10:00:00.000Z",
    };
    const orphanUri = "file:///documents/mangalya/inspiration-media/orphan.webp";
    mockFileSystem.__files.set(orphanUri, { size: 10_000 });

    expect(cleanupOrphanedInspirationMedia([inspiration])).toEqual({ removed: 1, failed: 0 });
    expect(mockFileSystem.__files.has(orphanUri)).toBe(false);
    expect(mockFileSystem.__files.has(inspiration.media.detailUri)).toBe(true);
    expect(
      removeInspirationMedia({ ...inspiration.media, detailUri: "file:///outside.webp" }),
    ).toBe(false);
    expect(mockFileSystem.__files.has(inspiration.media.thumbnailUri)).toBe(true);
    expect(removeInspirationMedia(inspiration.media)).toBe(true);
  });

  it("rejects normalized and encoded traversal paths before deletion", () => {
    const directory = "file:///documents/mangalya/inspiration-media";
    expect(isManagedInspirationMediaUri(`${directory}/../private.webp`)).toBe(false);
    expect(isManagedInspirationMediaUri(`${directory}/%2e%2e/private.webp`)).toBe(false);
    expect(isManagedInspirationMediaUri(`${directory}/nested/../safe.webp`)).toBe(false);
  });

  it("does not delete a valid sibling when one media URI escapes its directory", () => {
    const managedDetail = "file:///documents/mangalya/inspiration-media/managed-detail.webp";
    const managedThumbnail = "file:///documents/mangalya/inspiration-media/managed-thumbnail.webp";
    mockFileSystem.__files.set(managedDetail, { size: 100 });
    mockFileSystem.__files.set(managedThumbnail, { size: 100 });

    expect(
      removeInspirationMedia({
        detailUri: "file:///documents/mangalya/inspiration-media/../private.webp",
        detailWidth: 1,
        detailHeight: 1,
        detailSizeBytes: 100,
        thumbnailUri: managedThumbnail,
        thumbnailWidth: 1,
        thumbnailHeight: 1,
        thumbnailSizeBytes: 100,
        mimeType: "image/webp",
      }),
    ).toBe(false);
    expect(mockFileSystem.__files.has(managedDetail)).toBe(true);
    expect(mockFileSystem.__files.has(managedThumbnail)).toBe(true);
  });
});
