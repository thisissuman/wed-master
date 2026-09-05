import * as DocumentPicker from "expo-document-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { BackupFileTooLargeError, BackupFileUnreadableError } from "@/lib/errors";
import { utf8ByteLength } from "@/lib/storage/utf8-byte-length";

import {
  clearWeddingCoverPhotos,
  clearWorkspaceAttachments,
  clearWorkspaceExports,
  cleanupOrphanedWorkspaceFiles,
  pickEventCoverPhoto,
  pickWorkspaceAttachment,
  pickWorkspaceBackup,
  pickWeddingCoverPhoto,
  removeWorkspaceAttachment,
  removeWorkspaceExport,
  removeWeddingCoverPhoto,
} from "./workspace-files";
import { maximumBackupBytes, serializeDataBackup } from "../backup/backup-data";
import { demoWorkspace } from "../seed";

jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { WEBP: "webp" },
}));
jest.mock("expo-image-picker", () => ({
  PermissionStatus: { DENIED: "denied", GRANTED: "granted" },
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));
jest.mock("expo-file-system", () => {
  const files = new Map<string, { size: number; text?: string; textError?: Error }>();
  const directories = new Set<string>();
  let copyError: Error | undefined;

  const pathOf = (part: unknown) =>
    typeof part === "string" ? part : ((part as { uri?: string } | undefined)?.uri ?? "");
  const join = (...parts: unknown[]) => parts.map(pathOf).filter(Boolean).join("/");

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

    delete() {
      directories.delete(this.uri);
      for (const uri of files.keys()) {
        if (uri.startsWith(`${this.uri}/`)) files.delete(uri);
      }
    }

    list() {
      const prefix = `${this.uri}/`;
      return [...files.keys()]
        .filter((uri) => uri.startsWith(prefix) && !uri.slice(prefix.length).includes("/"))
        .map((uri) => new File(uri));
    }
  }

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
      if (copyError) throw copyError;
      files.set(destination.uri, { ...files.get(this.uri), size: files.get(this.uri)?.size ?? 0 });
    }

    create() {
      files.set(this.uri, { size: 0, text: "" });
    }

    delete() {
      files.delete(this.uri);
    }

    async text() {
      const stored = files.get(this.uri);
      if (stored?.textError) throw stored.textError;
      return stored?.text ?? "";
    }

    write(content: string) {
      files.set(this.uri, { size: new TextEncoder().encode(content).byteLength, text: content });
    }
  }

  return {
    Directory,
    File,
    Paths: { document: { uri: "file:///documents" } },
    __directories: directories,
    __files: files,
    __setCopyError: (error?: Error) => {
      copyError = error;
    },
  };
});

const mockImagePicker = jest.mocked(ImagePicker);
const mockManipulateAsync = jest.mocked(manipulateAsync);
const mockDocumentPicker = jest.mocked(DocumentPicker);
const mockFileSystem = jest.requireMock("expo-file-system") as {
  __directories: Set<string>;
  __files: Map<string, { size: number; text?: string; textError?: Error }>;
  __setCopyError: (error?: Error) => void;
};

describe("wedding cover files", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem.__directories.clear();
    mockFileSystem.__files.clear();
    mockFileSystem.__setCopyError();
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      canAskAgain: true,
      granted: true,
      expires: "never",
      status: ImagePicker.PermissionStatus.GRANTED,
    });
    mockManipulateAsync.mockImplementation(async (uri, actions) => ({
      height: actions?.length ? 1_800 : 1_200,
      uri: `${uri}.generated.webp`,
      width: 2_400,
    }));
  });

  it("returns cancellation and permission denial without writing a file", async () => {
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
      canAskAgain: false,
      granted: false,
      expires: "never",
      status: ImagePicker.PermissionStatus.DENIED,
    });
    await expect(pickWeddingCoverPhoto()).resolves.toEqual({
      canAskAgain: false,
      status: "permission-denied",
    });

    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: null });
    await expect(pickWeddingCoverPhoto()).resolves.toEqual({ status: "cancelled" });
    expect(mockFileSystem.__files.size).toBe(0);
  });

  it("opens the Android system gallery without requesting broad storage permission", async () => {
    const platform = jest.replaceProperty(Platform, "OS", "android");
    try {
      mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      await expect(pickWeddingCoverPhoto()).resolves.toEqual({ status: "cancelled" });
      expect(mockImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    } finally {
      platform.restore();
    }
  });

  it("copies a selected image into app-owned document storage", async () => {
    mockFileSystem.__files.set("file:///picked.jpg", { size: 2_000_000 });
    mockFileSystem.__files.set("file:///picked.jpg.generated.webp", { size: 700_000 });
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          assetId: "asset",
          fileName: "family.jpg",
          fileSize: 2_000_000,
          height: 1200,
          type: "image",
          uri: "file:///picked.jpg",
          width: 1600,
        },
      ],
    });

    const result = await pickWeddingCoverPhoto();

    expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsEditing: true, aspect: [16, 9] }),
    );
    expect(result.status).toBe("selected");
    if (result.status === "selected") {
      expect(result.uri).toContain("/mangalya/cover-photos/wedding-cover-");
      expect(result.uri).toMatch(/\.webp$/);
      expect(mockFileSystem.__files.get(result.uri)?.size).toBe(700_000);
    }
    expect(mockManipulateAsync).toHaveBeenCalledWith(
      "file:///picked.jpg",
      [],
      expect.objectContaining({ compress: 0.86, format: SaveFormat.WEBP }),
    );
    expect(mockFileSystem.__files.has("file:///picked.jpg.generated.webp")).toBe(false);
  });

  it("uses a distinct app-owned name for an event cover", async () => {
    mockFileSystem.__files.set("file:///event.jpg", { size: 1_000_000 });
    mockFileSystem.__files.set("file:///event.jpg.generated.webp", { size: 400_000 });
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          fileName: "event.jpg",
          fileSize: 1_000_000,
          height: 900,
          type: "image",
          uri: "file:///event.jpg",
          width: 1200,
        },
      ],
    });

    const result = await pickEventCoverPhoto();

    expect(result.status).toBe("selected");
    if (result.status === "selected") {
      expect(result.uri).toContain("/mangalya/cover-photos/event-cover-");
    }
  });

  it("surfaces copy errors without replacing existing media", async () => {
    mockFileSystem.__files.set("file:///picked.jpg", { size: 1_000 });
    mockFileSystem.__files.set("file:///picked.jpg.generated.webp", { size: 800 });
    mockFileSystem.__files.set("file:///documents/mangalya/cover-photos/current.jpg", {
      size: 1_000,
    });
    mockFileSystem.__setCopyError(new Error("Copy failed"));
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          height: 100,
          type: "image",
          uri: "file:///picked.jpg",
          width: 100,
        },
      ],
    });

    await expect(pickWeddingCoverPhoto()).rejects.toThrow("Copy failed");
    expect(mockFileSystem.__files.has("file:///documents/mangalya/cover-photos/current.jpg")).toBe(
      true,
    );
  });

  it("rejects oversized picker assets before copying them", async () => {
    mockFileSystem.__files.set("file:///large.jpg", { size: 16 * 1024 * 1024 });
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          fileSize: 16 * 1024 * 1024,
          height: 100,
          type: "image",
          uri: "file:///large.jpg",
          width: 100,
        },
      ],
    });

    await expect(pickWeddingCoverPhoto()).rejects.toThrow("15 MB or smaller");
    expect(mockFileSystem.__directories.size).toBe(0);
  });

  it("rejects images above 100 megapixels before decoding", async () => {
    mockFileSystem.__files.set("file:///huge-pixels.jpg", { size: 1_000 });
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          height: 10_001,
          type: "image",
          uri: "file:///huge-pixels.jpg",
          width: 10_000,
        },
      ],
    });

    await expect(pickWeddingCoverPhoto()).rejects.toThrow("100 megapixels");
    expect(mockManipulateAsync).not.toHaveBeenCalled();
  });

  it("resizes the long edge to 2400 pixels before writing bounded WebP", async () => {
    mockFileSystem.__files.set("file:///panorama.jpg", { size: 4_000_000 });
    mockFileSystem.__files.set("file:///panorama.jpg.generated.webp", { size: 900_000 });
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          height: 2_000,
          type: "image",
          uri: "file:///panorama.jpg",
          width: 8_000,
        },
      ],
    });

    await expect(pickWeddingCoverPhoto()).resolves.toMatchObject({ status: "selected" });
    expect(mockManipulateAsync).toHaveBeenCalledWith(
      "file:///panorama.jpg",
      [{ resize: { width: 2_400 } }],
      expect.objectContaining({ format: SaveFormat.WEBP }),
    );
  });

  it("removes individual covers and clears all workspace media", () => {
    const coverDirectory = "file:///documents/mangalya/cover-photos";
    const attachmentDirectory = "file:///documents/mangalya/attachments";
    const exportDirectory = "file:///documents/mangalya/exports";
    mockFileSystem.__directories.add(coverDirectory);
    mockFileSystem.__directories.add(attachmentDirectory);
    mockFileSystem.__directories.add(exportDirectory);
    mockFileSystem.__files.set(`${coverDirectory}/current.jpg`, { size: 1_000 });
    mockFileSystem.__files.set(`${attachmentDirectory}/receipt.pdf`, { size: 1_000 });
    mockFileSystem.__files.set(`${exportDirectory}/backup.json`, { size: 1_000 });

    expect(removeWeddingCoverPhoto(`${coverDirectory}/current.jpg`)).toBe(true);
    expect(mockFileSystem.__files.has(`${coverDirectory}/current.jpg`)).toBe(false);
    mockFileSystem.__files.set(`${coverDirectory}/replacement.jpg`, { size: 1_000 });

    expect(clearWorkspaceAttachments()).toBe(true);
    expect(clearWeddingCoverPhotos()).toBe(true);
    expect(clearWorkspaceExports()).toBe(true);
    expect(mockFileSystem.__directories.has(coverDirectory)).toBe(false);
    expect(mockFileSystem.__directories.has(attachmentDirectory)).toBe(false);
    expect(mockFileSystem.__directories.has(exportDirectory)).toBe(false);
    expect(mockFileSystem.__files.size).toBe(0);
  });

  it("rejects deletion outside managed directories", () => {
    mockFileSystem.__files.set("file:///private/user-photo.jpg", { size: 1_000 });

    expect(removeWeddingCoverPhoto("file:///private/user-photo.jpg")).toBe(false);
    expect(removeWorkspaceExport("file:///private/user-photo.jpg")).toBe(false);
    expect(
      removeWorkspaceAttachment({
        createdAt: "2026-08-29T10:00:00.000Z",
        id: "attachment-1",
        mimeType: "image/jpeg",
        name: "photo.jpg",
        size: 1_000,
        uri: "file:///private/user-photo.jpg",
      }),
    ).toBe(false);
    expect(mockFileSystem.__files.has("file:///private/user-photo.jpg")).toBe(true);
  });
});

describe("workspace attachments and orphan repair", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem.__directories.clear();
    mockFileSystem.__files.clear();
    mockFileSystem.__setCopyError();
  });

  it("checks the actual copied source size instead of picker metadata", async () => {
    mockFileSystem.__files.set("file:///cache/receipt.pdf", { size: 5 * 1024 * 1024 + 1 });
    mockDocumentPicker.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          lastModified: 0,
          mimeType: "application/pdf",
          name: "receipt.pdf",
          size: 10,
          uri: "file:///cache/receipt.pdf",
        },
      ],
    });

    await expect(pickWorkspaceAttachment()).rejects.toThrow("5 MB or smaller");
    expect(mockFileSystem.__directories.size).toBe(0);
  });

  it("removes only orphaned managed files", () => {
    const attachmentDirectory = "file:///documents/mangalya/attachments";
    const coverDirectory = "file:///documents/mangalya/cover-photos";
    const exportDirectory = "file:///documents/mangalya/exports";
    mockFileSystem.__directories.add(attachmentDirectory);
    mockFileSystem.__directories.add(coverDirectory);
    mockFileSystem.__directories.add(exportDirectory);
    const referencedAttachment = `${attachmentDirectory}/kept.pdf`;
    const referencedCover = `${coverDirectory}/kept.webp`;
    const referencedExport = `${exportDirectory}/kept.json`;
    for (const uri of [
      referencedAttachment,
      referencedCover,
      referencedExport,
      `${attachmentDirectory}/orphan.pdf`,
      `${coverDirectory}/orphan.webp`,
      `${exportDirectory}/orphan.json`,
    ]) {
      mockFileSystem.__files.set(uri, { size: 100 });
    }
    const snapshot = structuredClone(demoWorkspace);
    snapshot.tasks[0].attachments = [
      {
        createdAt: "2026-08-29T10:00:00.000Z",
        id: "attachment-kept",
        mimeType: "application/pdf",
        name: "kept.pdf",
        size: 100,
        uri: referencedAttachment,
      },
    ];
    snapshot.wedding.coverPhotoUri = referencedCover;
    snapshot.backupHistory = [
      {
        createdAt: "2026-08-29T10:00:00.000Z",
        fileName: "kept.json",
        id: "backup-kept",
        kind: "backup",
        sizeBytes: 100,
        uri: referencedExport,
      },
    ];

    expect(cleanupOrphanedWorkspaceFiles(snapshot)).toEqual({
      failedAreas: [],
      removedCount: 3,
    });
    expect([...mockFileSystem.__files.keys()].sort()).toEqual(
      [referencedAttachment, referencedCover, referencedExport].sort(),
    );
  });
});

describe("workspace backup picker", () => {
  const validBackup = serializeDataBackup(demoWorkspace, "2026-08-29T10:00:00.000Z");

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem.__files.clear();
  });

  function select(uri = "file:///cache/backup.json") {
    mockDocumentPicker.getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "backup.json",
          mimeType: "application/json",
          size: 10,
          lastModified: 0,
          uri,
        },
      ],
    });
  }

  it("returns null when document selection is cancelled", async () => {
    mockDocumentPicker.getDocumentAsync.mockResolvedValueOnce({ canceled: true, assets: null });

    await expect(pickWorkspaceBackup()).resolves.toBeNull();
  });

  it.each([
    ["missing", undefined],
    ["zero-size", { size: 0, text: validBackup }],
    ["non-finite", { size: Number.NaN, text: validBackup }],
  ] as const)("rejects an unreadable %s copied file before reading", async (_case, file) => {
    select();
    if (file) mockFileSystem.__files.set("file:///cache/backup.json", file);

    await expect(pickWorkspaceBackup()).rejects.toBeInstanceOf(BackupFileUnreadableError);
  });

  it("rejects an oversized copied file before reading it", async () => {
    select();
    mockFileSystem.__files.set("file:///cache/backup.json", {
      size: maximumBackupBytes + 1,
      textError: new Error("text() must not run"),
    });

    await expect(pickWorkspaceBackup()).rejects.toBeInstanceOf(BackupFileTooLargeError);
  });

  it("accepts an exact-limit copied file and retains the post-read UTF-8 check", async () => {
    select();
    const exactLimitText = `${validBackup}${" ".repeat(
      maximumBackupBytes - utf8ByteLength(validBackup),
    )}`;
    mockFileSystem.__files.set("file:///cache/backup.json", {
      size: maximumBackupBytes,
      text: exactLimitText,
    });

    await expect(pickWorkspaceBackup()).resolves.toMatchObject({ version: 5 });

    select("file:///cache/multibyte.json");
    mockFileSystem.__files.set("file:///cache/multibyte.json", {
      size: maximumBackupBytes,
      text: "अ".repeat(Math.ceil(maximumBackupBytes / 3)),
    });
    await expect(pickWorkspaceBackup()).rejects.toBeInstanceOf(BackupFileTooLargeError);
  });

  it("wraps copied-file read failures without exposing adapter details", async () => {
    select();
    mockFileSystem.__files.set("file:///cache/backup.json", {
      size: validBackup.length,
      textError: new Error("/private/cache path"),
    });

    await expect(pickWorkspaceBackup()).rejects.toBeInstanceOf(BackupFileUnreadableError);
  });
});
