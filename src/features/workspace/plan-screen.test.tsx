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
    navigate: jest.fn(),
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
    } as unknown as ReturnType<typeof useWorkspace>);
    mockUseWorkspaceMutation.mockReturnValue({
      isPending: false,
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
  });

  it("starts on events and switches views immediately without route writes", async () => {
    const screen = await render(<PlanScreen />);

    expect(screen.getByText("Your wedding events")).toBeTruthy();
    expect(screen.queryByText("Berhampur, Odisha")).toBeNull();
    await fireEvent.press(screen.getByRole("tab", { name: "Events" }));
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("tab", { name: "Tasks" }));

    expect(screen.getByText("Confirm catering menu")).toBeTruthy();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(mockRouter.setParams).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("tab", { name: "Events" }));
    expect(screen.getByText("Your wedding events")).toBeTruthy();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);

    await fireEvent.press(screen.getByRole("tab", { name: "Events" }));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
    expect(mockRouter.setParams).not.toHaveBeenCalled();
  });

  it("syncs external view parameters without haptic feedback", async () => {
    const screen = await render(<PlanScreen />);

    mockSearchParams = { view: "tasks" };
    await screen.rerender(<PlanScreen />);

    await waitFor(() => {
      expect(screen.getByText("Confirm catering menu")).toBeTruthy();
    });
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("keeps every task filter behind one compact control", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    expect(screen.queryByRole("button", { name: "High priority" })).toBeNull();
    expect(screen.queryByRole("button", { name: "All" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("button", { name: "Status: All statuses" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Priority: All priorities" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Related event: All events" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Due date: Any due date" })).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Related event: All events" }));
    expect(screen.queryByText("Choose one option")).toBeNull();
    await fireEvent.press(await screen.findByRole("radio", { name: "Wedding" }));
    await fireEvent.press(screen.getByRole("button", { name: "Show results" }));

    expect(screen.getByText("Confirm catering menu")).toBeTruthy();
    expect(
      screen.getByText("Confirm the final family transport and accommodation pickup schedule"),
    ).toBeTruthy();
    expect(screen.queryByText("Collect invitation proof")).toBeNull();
    expect(screen.getByRole("button", { name: "Filters, 1 active" })).toBeTruthy();
  });

  it("keeps one creation affordance when the task list is empty", async () => {
    mockSearchParams = { view: "tasks" };
    mockUseWorkspace.mockReturnValue({
      data: { ...demoWorkspace, tasks: [] },
      isError: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkspace>);

    const screen = await render(<PlanScreen />);

    expect(screen.getByText("No tasks yet")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Add task" })).toHaveLength(1);
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

    await fireEvent.press(screen.getByRole("button", { name: "Show results" }));
    const activeFilters = screen.getByRole("button", { name: "Filters, 1 active" });
    expect(activeFilters.props.accessibilityState.selected).toBe(true);

    await fireEvent.press(activeFilters);
    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => {
      expect(screen.getByText("Confirm catering menu")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
    });
  });

  it("offers filter reset instead of another creation action for filtered-empty tasks", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));
    await fireEvent.press(screen.getByRole("button", { name: "Status: All statuses" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "Cancelled" }));
    await fireEvent.press(screen.getByRole("button", { name: "Show results" }));

    expect(await screen.findByText("No matching tasks")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Add task" })).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText("Confirm catering menu")).toBeTruthy();
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

  it("groups task summaries and announces visible result counts", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    expect(screen.getByLabelText("0 tasks due today")).toBeTruthy();
    expect(screen.getByLabelText("1 overdue task")).toBeTruthy();
    expect(screen.getByLabelText("1 completed task")).toBeTruthy();
    expect(screen.getByText("4 tasks").props.accessibilityLiveRegion).toBe("polite");
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
    expect(mockRouter.navigate).toHaveBeenCalledWith("/tasks/task-1");

    await fireEvent.press(screen.getByRole("button", { name: "Add task" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/tasks/new");
  });

  it("opens event detail, edit, and creation routes", async () => {
    const screen = await render(<PlanScreen />);

    expect(screen.getByText(/Wedding date ·/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Open event: Wedding" }).props.accessibilityHint,
    ).toContain("Wedding date");

    await fireEvent.press(screen.getByRole("button", { name: "Open event: Wedding" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/events/event-wedding");

    await fireEvent.press(screen.getByRole("button", { name: "Edit event: Wedding" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith({
      params: { id: "event-wedding" },
      pathname: "/events/edit",
    });

    await fireEvent.press(screen.getByRole("button", { name: "Add event" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/events/new");
  });
});
