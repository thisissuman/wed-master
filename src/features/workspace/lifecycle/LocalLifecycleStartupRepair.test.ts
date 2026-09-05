import AsyncStorage from "@react-native-async-storage/async-storage";

import { cleanupOrphanedInspirationMedia } from "@/features/inspire/media";
import type { InspirationRepository } from "@/features/inspire/types";

import { cleanupOrphanedWorkspaceFiles } from "../files/workspace-files";
import { demoWorkspace } from "../seed";
import { pendingLocalCleanupStorageKey, writePendingLocalCleanup } from "./local-lifecycle";
import { repairLocalWorkspaceState } from "./LocalLifecycleStartupRepair";

jest.mock("@/features/inspire/media", () => ({
  cleanupOrphanedInspirationMedia: jest.fn(),
  clearInspirationMedia: jest.fn(() => true),
}));
jest.mock("@/features/inspire/demo-seed", () => ({ installDemoInspirationPack: jest.fn() }));
jest.mock("../files/workspace-files", () => ({
  cleanupOrphanedWorkspaceFiles: jest.fn(),
  clearWeddingCoverPhotos: jest.fn(() => true),
  clearWorkspaceAttachments: jest.fn(() => true),
  clearWorkspaceExports: jest.fn(() => true),
}));

const mockCleanupInspiration = jest.mocked(cleanupOrphanedInspirationMedia);
const mockCleanupWorkspace = jest.mocked(cleanupOrphanedWorkspaceFiles);

function repository(overrides: Partial<InspirationRepository> = {}): InspirationRepository {
  return {
    repairEventLinks: jest.fn(async () => 0),
    snapshot: jest.fn(async () => ({ inspirations: [], version: 1 as const })),
    ...overrides,
  } as InspirationRepository;
}

describe("local lifecycle startup repair", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCleanupInspiration.mockReturnValue({ failed: 0, removed: 2 });
    mockCleanupWorkspace.mockReturnValue({ failedAreas: [], removedCount: 3 });
  });
  afterEach(async () => {
    await AsyncStorage.removeItem(pendingLocalCleanupStorageKey);
  });

  it("repairs orphan files and stale event links idempotently", async () => {
    const repairEventLinks = jest.fn(async () => 1);
    const inspirationRepository = repository({ repairEventLinks });

    await expect(repairLocalWorkspaceState(demoWorkspace, inspirationRepository)).resolves.toEqual({
      failedAreas: [],
      removedInspirationFiles: 2,
      removedWorkspaceFiles: 3,
      repairedEventLinks: 1,
    });
    expect(repairEventLinks).toHaveBeenCalledWith(
      demoWorkspace.wedding.id,
      demoWorkspace.events.map(({ id }) => id),
    );
  });

  it("continues independent repairs and returns only static failure areas", async () => {
    const inspirationRepository = repository({
      repairEventLinks: jest.fn(async () => {
        throw new Error("private event path");
      }),
      snapshot: jest.fn(async () => {
        throw new Error("private inspiration content");
      }),
    });
    mockCleanupWorkspace.mockReturnValue({
      failedAreas: ["attachments", "exports"],
      removedCount: 1,
    });

    await expect(repairLocalWorkspaceState(demoWorkspace, inspirationRepository)).resolves.toEqual({
      failedAreas: [
        "inspire-media",
        "workspace-attachments",
        "workspace-exports",
        "inspire-event-links",
      ],
      removedInspirationFiles: 0,
      removedWorkspaceFiles: 1,
      repairedEventLinks: 0,
    });
  });

  it("retries committed cleanup after deletion when no workspace remains", async () => {
    const clearRecords = jest.fn(async () => []);
    const inspirationRepository = repository({ clear: clearRecords });
    await writePendingLocalCleanup({
      areas: ["inspire-records", "inspire-media"],
      committed: true,
    });

    await expect(
      repairLocalWorkspaceState(undefined, inspirationRepository),
    ).resolves.toMatchObject({
      failedAreas: [],
    });
    expect(clearRecords).toHaveBeenCalledTimes(1);
    await expect(AsyncStorage.getItem(pendingLocalCleanupStorageKey)).resolves.toBeNull();
  });

  it("retains a prepared marker after an ambiguous crash instead of deleting current files", async () => {
    await writePendingLocalCleanup({ areas: ["workspace-covers"], committed: false });

    await expect(repairLocalWorkspaceState(demoWorkspace, repository())).resolves.toMatchObject({
      failedAreas: ["workspace-covers"],
    });
    expect(mockCleanupWorkspace).not.toHaveBeenCalled();
    await expect(AsyncStorage.getItem(pendingLocalCleanupStorageKey)).resolves.toContain(
      "workspace-covers",
    );
  });
});
