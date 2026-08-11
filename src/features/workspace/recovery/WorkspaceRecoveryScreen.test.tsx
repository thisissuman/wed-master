import { fireEvent, render } from "@testing-library/react-native";

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

const mockUseDeleteWorkspaceMutation = jest.mocked(useDeleteWorkspaceMutation);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const deleteMutate = jest.fn();
const mutate = jest.fn();
const error = new WorkspaceCorruptionError("Unreadable", "{broken-json");

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
      mutate: deleteMutate,
    } as unknown as ReturnType<typeof useDeleteWorkspaceMutation>);
  });

  it("never creates demo data from corruption recovery", async () => {
    const screen = await render(<WorkspaceRecoveryScreen error={error} />);

    expect(screen.queryByRole("button", { name: "Reset to current demo" })).toBeNull();
    expect(screen.getByRole("button", { name: "Delete unreadable data" })).toBeTruthy();
  });

  it("confirms deletion before returning to fresh setup", async () => {
    const screen = await render(<WorkspaceRecoveryScreen error={error} />);

    await fireEvent.press(screen.getByRole("button", { name: "Delete unreadable data" }));
    expect(deleteMutate).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Delete local data" }));

    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(mutate).not.toHaveBeenCalled();
  });
});
