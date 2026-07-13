import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { useWorkspace, useWorkspaceMutation } from "@/features/workspace";
import { demoWorkspace } from "@/features/workspace/seed";
import PlanScreen from "@/app/(app)/(tabs)/plan";

let mockSearchParams: Record<string, string | undefined> = {};
const mockSetParamsCalls: Record<string, string>[] = [];

function mockSetParams(params: Record<string, string>) {
  mockSetParamsCalls.push(params);
  mockSearchParams = { ...mockSearchParams, ...params };
}

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: mockSetParams,
  },
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock("@/features/workspace", () => {
  const actual = jest.requireActual("@/features/workspace");

  return {
    ...actual,
    useWorkspace: jest.fn(),
    useWorkspaceMutation: jest.fn(),
  };
});

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);

describe("PlanScreen", () => {
  beforeEach(() => {
    mockSearchParams = {};
    mockSetParamsCalls.length = 0;
    mockUseWorkspace.mockReturnValue({
      data: demoWorkspace,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
    mockUseWorkspaceMutation.mockReturnValue({
      mutate: jest.fn(),
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
  });

  it("starts on events when no view route param is provided", async () => {
    const screen = await render(<PlanScreen />);

    expect(screen.getByText("Wedding events")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
  });

  it("starts on tasks when the route param asks for tasks", async () => {
    mockSearchParams = { view: "tasks" };

    const screen = await render(<PlanScreen />);

    expect(screen.getAllByText("Tasks").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
  });

  it("routes segmented control changes through the plan view param", async () => {
    const screen = await render(<PlanScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Tasks" }));
    expect(mockSetParamsCalls).toContainEqual({ view: "tasks" });
  });

  it("clears task filters after switching to tasks", async () => {
    mockSearchParams = { view: "tasks" };

    const screen = await render(<PlanScreen />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
    });
    fireEvent.press(screen.getByRole("button", { name: "Filter" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Status: All statuses" })).toBeTruthy();
    });
    fireEvent.press(screen.getByRole("button", { name: "Status: All statuses" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "In Progress" })).toBeTruthy();
    });
    fireEvent.press(screen.getByRole("button", { name: "In Progress" }));

    await waitFor(() => {
      expect(screen.getByText("In Progress")).toBeTruthy();
    });

    fireEvent.press(screen.getByRole("button", { name: "Clear" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Status: All statuses" })).toBeTruthy();
    });
  });
});
