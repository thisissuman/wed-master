import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { demoWorkspace } from "./seed";
import { ExpenseForm } from "./ExpenseForm";
import { TaskForm } from "./TaskForm";
import { useWorkspace, useWorkspaceMutation } from "./provider";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock("./provider", () => ({
  useWorkspace: jest.fn(),
  useWorkspaceMutation: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);

describe("workspace forms", () => {
  beforeEach(() => {
    mockUseWorkspace.mockReturnValue({
      data: demoWorkspace,
    } as ReturnType<typeof useWorkspace>);
    mockUseWorkspaceMutation.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
  });

  it("keeps new expense payment details collapsed until requested", async () => {
    const screen = await render(<ExpenseForm />);

    expect(screen.queryByText("Planned amount (₹)")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Add payment and planning details" }));

    await waitFor(() => {
      expect(screen.getByText("Planned amount (₹)")).toBeTruthy();
    });
  });

  it("keeps new task details collapsed until requested", async () => {
    const screen = await render(<TaskForm />);

    expect(screen.queryByText("Related event")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Add details" }));

    await waitFor(() => {
      expect(screen.getByText("Related event")).toBeTruthy();
    });
  });
});
