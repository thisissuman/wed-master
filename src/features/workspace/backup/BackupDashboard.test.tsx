import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { UnsupportedSharingError } from "@/lib/errors";

import {
  createWorkspaceBackupFile,
  removeWorkspaceExport,
  shareWorkspaceFile,
} from "../files/workspace-files";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { demoWorkspace } from "../seed";
import type { BackupHistoryEntry, Repositories } from "../types";
import { BackupDashboard } from "./BackupDashboard";

jest.mock("../provider", () => ({
  useWorkspace: jest.fn(),
  useWorkspaceMutation: jest.fn(),
}));
jest.mock("@/features/inspire/provider", () => ({
  inspirationQueryKeys: { all: ["local-inspirations"] },
  useInspirationRepository: jest.fn(() => ({ clear: jest.fn(async () => []) })),
}));
jest.mock("@/features/inspire/media", () => ({ clearInspirationMedia: jest.fn(() => true) }));
jest.mock("../files/workspace-files", () => ({
  clearWeddingCoverPhotos: jest.fn(() => true),
  clearWorkspaceAttachments: jest.fn(() => true),
  clearWorkspaceExports: jest.fn(() => true),
  createExpensesCsv: jest.fn(),
  createWorkspaceBackupFile: jest.fn(),
  pickWorkspaceBackup: jest.fn(),
  removeWorkspaceExport: jest.fn(() => true),
  shareWorkspaceFile: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mockCreateBackup = jest.mocked(createWorkspaceBackupFile);
const mockRemoveExport = jest.mocked(removeWorkspaceExport);
const mockShare = jest.mocked(shareWorkspaceFile);
const alertSpy = jest.spyOn(Alert, "alert");
const entry: BackupHistoryEntry = {
  createdAt: "2026-08-29T10:00:00.000Z",
  fileName: "mangalya-data-backup.json",
  id: "backup-1",
  kind: "backup",
  sizeBytes: 1_024,
  uri: "file:///documents/mangalya/exports/mangalya-data-backup.json",
};
const addHistory = jest.fn();
const removeHistory = jest.fn();
const clearHistory = jest.fn();

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BackupDashboard />
    </QueryClientProvider>,
  );
}

describe("BackupDashboard export history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const snapshot = structuredClone(demoWorkspace);
    snapshot.backupHistory = [];
    mockUseWorkspace.mockReturnValue({
      data: snapshot,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
    const repositories = {
      backup: { addHistory, clearHistory, removeHistory },
    } as unknown as Repositories;
    mockUseWorkspaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(async (operation) => operation(repositories)),
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
    mockCreateBackup.mockReturnValue(entry);
    addHistory.mockResolvedValue({ removedEntries: [], snapshot });
    removeHistory.mockResolvedValue({ removedEntries: [entry], snapshot });
    clearHistory.mockResolvedValue({ removedEntries: [entry], snapshot });
    mockShare.mockResolvedValue(undefined);
  });

  it("retains a committed export when the share sheet fails", async () => {
    mockShare.mockRejectedValueOnce(new UnsupportedSharingError());
    const screen = await renderDashboard();
    await fireEvent.press(screen.getByRole("button", { name: "Backup history" }));

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Export data backup" }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(addHistory).toHaveBeenCalledWith(entry);
      expect(alertSpy).toHaveBeenCalledWith(
        "Export created",
        expect.stringContaining("remains in export history"),
      );
    });
    expect(mockRemoveExport).not.toHaveBeenCalledWith(entry.uri);
  });

  it("re-shares and confirms deletion of a history entry", async () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.backupHistory = [entry];
    mockUseWorkspace.mockReturnValue({
      data: snapshot,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
    const screen = await renderDashboard();
    await fireEvent.press(screen.getByRole("button", { name: "Backup history" }));

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: `Share ${entry.fileName} again` }));
      await Promise.resolve();
    });
    await waitFor(() => expect(mockShare).toHaveBeenCalledWith(entry.uri));

    const deleteButton = screen.getByRole("button", { name: `Delete ${entry.fileName}` });
    await waitFor(() => expect(deleteButton.props.accessibilityState.disabled).toBe(false));
    fireEvent.press(deleteButton);
    expect(removeHistory).not.toHaveBeenCalled();
    const confirmDelete = await screen.findByRole("button", { name: "Delete export" });
    await act(async () => {
      fireEvent.press(confirmDelete);
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(removeHistory).toHaveBeenCalledWith(entry.id);
      expect(mockRemoveExport).toHaveBeenCalledWith(entry.uri);
    });
  });
});
