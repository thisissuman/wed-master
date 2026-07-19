import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import PlanScreen from "@/app/(app)/(tabs)/plan";
import { demoWorkspace } from "@/features/workspace/seed";

import { useWorkspace, useWorkspaceMutation } from "./provider";

let mockSearchParams: Record<string, string | undefined> = {};

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn((params: Record<string, string>) => {
      mockSearchParams = { ...mockSearchParams, ...params };
    }),
  },
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock("./provider", () => {
  return {
    useWorkspace: jest.fn(),
    useWorkspaceMutation: jest.fn(),
  };
});

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light" },
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mockRouter = jest.mocked(router);
const mockMutate = jest.fn();

describe("PlanScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    mockUseWorkspace.mockReturnValue({
      data: demoWorkspace,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
    mockUseWorkspaceMutation.mockReturnValue({
      isPending: false,
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
  });

  it("starts on events and switches views through the route parameter", async () => {
    const screen = await render(<PlanScreen />);

    expect(screen.getByText("Your wedding events")).toBeTruthy();
    expect(screen.queryByText("Berhampur, Odisha")).toBeNull();
    await fireEvent.press(screen.getByRole("tab", { name: "Tasks" }));

    expect(mockRouter.setParams).toHaveBeenCalledWith({ view: "tasks" });
  });

  it("honours a tasks route parameter and applies quick presets", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Wedding" }));
    expect(screen.getByText("Confirm catering menu")).toBeTruthy();
    expect(
      screen.getByText("Confirm the final family transport and accommodation pickup schedule"),
    ).toBeTruthy();
    expect(screen.queryByText("Collect invitation proof")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "High priority" }));
    expect(screen.getByText("Book bridal mehendi artist")).toBeTruthy();
    expect(screen.queryByText("Collect invitation proof")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Collect invitation proof")).toBeTruthy();
  });

  it("applies an advanced filter and clears it in one action", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));
    await fireEvent.press(screen.getByRole("button", { name: "Status: All statuses" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "Completed" }));

    await waitFor(() => {
      expect(screen.getByText("Book bridal mehendi artist")).toBeTruthy();
      expect(screen.queryByText("Confirm catering menu")).toBeNull();
    });

    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => {
      expect(screen.getByText("Confirm catering menu")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
    });
  });

  it("protects and submits task completion mutations", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    await fireEvent.press(
      screen.getByRole("checkbox", { name: "Mark complete: Confirm catering menu" }),
    );

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();

    const [, mutationOptions] = mockMutate.mock.calls[0] as unknown as [
      unknown,
      { onSuccess: () => void },
    ];
    mutationOptions.onSuccess();

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it("keeps task metadata available to assistive technology", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    const task = screen.getByRole("button", { name: "Open task: Confirm catering menu" });

    expect(task.props.accessibilityHint).toContain("Event: Wedding");
    expect(task.props.accessibilityHint).toContain("Status: High");
  });

  it("shows an actionable task update error", async () => {
    mockSearchParams = { view: "tasks" };
    mockUseWorkspaceMutation.mockReturnValue({
      error: new Error("Network request timed out"),
      isError: true,
      isPending: false,
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useWorkspaceMutation>);

    const screen = await render(<PlanScreen />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Task update failed")).toBeTruthy();
    expect(
      screen.getByText("We could not reach the service. Check your connection and try again."),
    ).toBeTruthy();
  });

  it("opens task detail and creation routes", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Open task: Confirm catering menu" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/tasks/task-1");

    await fireEvent.press(screen.getByRole("button", { name: "Add task" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/tasks/new");
  });

  it("opens event detail, edit, and creation routes", async () => {
    const screen = await render(<PlanScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Open event: Wedding" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/events/event-wedding");

    await fireEvent.press(screen.getByRole("button", { name: "Edit event: Wedding" }));
    expect(mockRouter.push).toHaveBeenCalledWith({
      params: { id: "event-wedding" },
      pathname: "/events/edit",
    });

    await fireEvent.press(screen.getByRole("button", { name: "Add event" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/events/new");
  });
});
