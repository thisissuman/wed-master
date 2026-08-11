import * as ImagePicker from "expo-image-picker";

import {
  clearWorkspaceLocalFiles,
  pickEventCoverPhoto,
  pickWeddingCoverPhoto,
  removeWeddingCoverPhoto,
} from "./workspace-files";

jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock("expo-image-picker", () => ({
  PermissionStatus: { DENIED: "denied", GRANTED: "granted" },
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));
jest.mock("expo-file-system", () => {
  const files = new Map<string, { size: number }>();
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
      files.set(destination.uri, { size: files.get(this.uri)?.size ?? 0 });
    }

    delete() {
      files.delete(this.uri);
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
const mockFileSystem = jest.requireMock("expo-file-system") as {
  __directories: Set<string>;
  __files: Map<string, { size: number }>;
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

  it("copies a selected image into app-owned document storage", async () => {
    mockFileSystem.__files.set("file:///picked.jpg", { size: 2_000_000 });
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
      expect(mockFileSystem.__files.get(result.uri)?.size).toBe(2_000_000);
    }
  });

  it("uses a distinct app-owned name for an event cover", async () => {
    mockFileSystem.__files.set("file:///event.jpg", { size: 1_000_000 });
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

    expect(clearWorkspaceLocalFiles()).toBe(true);
    expect(mockFileSystem.__directories.has(coverDirectory)).toBe(false);
    expect(mockFileSystem.__directories.has(attachmentDirectory)).toBe(false);
    expect(mockFileSystem.__directories.has(exportDirectory)).toBe(false);
    expect(mockFileSystem.__files.size).toBe(0);
  });
});
