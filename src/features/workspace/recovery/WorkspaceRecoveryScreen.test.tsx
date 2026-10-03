import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useInspirationRepository } from "@/features/inspire/provider";
import { WorkspaceCorruptionError } from "../local-repositories";
import { useDeleteWorkspaceMutation, useWorkspaceMutation } from "../provider";
import { WorkspaceRecoveryScreen } from "./WorkspaceRecoveryScreen";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

jest.mock("../provider", () => ({
  useDeleteWorkspaceMutation: jest.fn(),
  useWorkspaceMutation: jest.fn(),
}));

jest.mock("@/features/inspire/provider", () => ({
  inspirationQueryKeys: { all: ["local-inspirations"] },
  useInspirationRepository: jest.fn(),
}));
jest.mock("@/features/inspire/media", () => ({ clearInspirationMedia: jest.fn(() => true) }));
jest.mock("../files/workspace-files", () => ({
  clearWeddingCoverPhotos: jest.fn(() => true),
  clearWorkspaceAttachments: jest.fn(() => true),
  clearWorkspaceExports: jest.fn(() => true),
  createWorkspaceRecoveryFile: jest.fn(),
  pickWorkspaceBackup: jest.fn(),
  shareWorkspaceFile: jest.fn(),
}));

const mockUseDeleteWorkspaceMutation = jest.mocked(useDeleteWorkspaceMutation);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mockUseInspirationRepository = jest.mocked(useInspirationRepository);
const deleteMutateAsync = jest.fn();
const clearInspirations = jest.fn();
const mutate = jest.fn();
const error = new WorkspaceCorruptionError("Unreadable", "{broken-json");

function renderRecovery() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WorkspaceRecoveryScreen error={error} />
    </QueryClientProvider>,
  );
}

describe("WorkspaceRecoveryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkspaceMutation.mockReturnValue({
      isPending: false,
      mutate,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
    mockUseDeleteWorkspaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: deleteMutateAsync,
    } as unknown as ReturnType<typeof useDeleteWorkspaceMutation>);
    mockUseInspirationRepository.mockReturnValue({
      clear: clearInspirations,
    } as unknown as ReturnType<typeof useInspirationRepository>);
    deleteMutateAsync.mockResolvedValue({ authoritative: true, residualKeys: [] });
    clearInspirations.mockResolvedValue([]);
  });

  it("never creates demo data from corruption recovery", async () => {
    const screen = await renderRecovery();

    expect(screen.queryByRole("button", { name: "Reset to current demo" })).toBeNull();
    expect(screen.getByRole("button", { name: "Delete unreadable data" })).toBeTruthy();
  });

  it("confirms deletion before returning to fresh setup", async () => {
    const screen = await renderRecovery();

    await fireEvent.press(screen.getByRole("button", { name: "Delete unreadable data" }));
    expect(deleteMutateAsync).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Delete local data" }));

    await waitFor(() => {
      expect(deleteMutateAsync).toHaveBeenCalledTimes(1);
      expect(clearInspirations).toHaveBeenCalledTimes(1);
    });
    expect(mutate).not.toHaveBeenCalled();
  });
});
