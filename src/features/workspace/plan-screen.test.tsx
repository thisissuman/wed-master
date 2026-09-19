import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import PlanScreen from "@/app/(app)/(tabs)/plan";
import { demoWorkspace } from "@/features/workspace/seed";
import { motionDurations } from "@/theme";

import { useCreatedItemHighlight } from "./created-item-highlight";
import { useWorkspace, useWorkspaceMutation } from "./provider";

let mockSearchParams: Record<string, string | undefined> = {};
let mockIsFocused = true;

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
  useIsFocused: () => mockIsFocused,
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
const mockMutateAsync = jest.fn();

describe("PlanScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockIsFocused = true;
    mockSearchParams = {};
    useCreatedItemHighlight.setState({ current: undefined });
    mockUseWorkspace.mockReturnValue({
      data: demoWorkspace,
      isError: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkspace>);
    mockUseWorkspaceMutation.mockReturnValue({
      isPending: false,
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
    mockMutateAsync.mockResolvedValue(demoWorkspace);
  });

  it("sorts recently actioned tasks ahead of due dates and completion", async () => {
    mockSearchParams = { view: "tasks" };
    mockUseWorkspace.mockReturnValue({
      data: {
        ...demoWorkspace,
        tasks: [
          {
            ...demoWorkspace.tasks[0],
            id: "older",
            title: "Older action",
            status: "Not Started",
            updatedAt: "2026-09-17T12:00:00.000Z",
          },
          {
            ...demoWorkspace.tasks[0],
            id: "recent",
            title: "Recent completion",
            status: "Completed",
            updatedAt: "2026-09-18T12:00:00.000Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useWorkspace>);
    const screen = await render(<PlanScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Sort tasks" }));
    const rows = screen.getAllByRole("checkbox");
    expect(rows[0].props.accessibilityLabel).toContain("Recent completion");
    expect(rows[1].props.accessibilityLabel).toContain("Older action");
    expect(screen.queryByRole("tab", { name: "Due date" })).toBeNull();
    expect(screen.queryByText("Recently actioned")).toBeNull();
    expect(screen.getByRole("button", { name: "Sort tasks" }).props.accessibilityValue.text).toBe(
      "Recently actioned",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Sort tasks" }));
    expect(screen.getAllByRole("checkbox")[0].props.accessibilityLabel).toContain("Older action");
    expect(screen.getByRole("button", { name: "Sort tasks" }).props.accessibilityValue.text).toBe(
      "Due date",
    );
  });

  it("keeps task identities and sort state stable over repeated Events/Tasks switches", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Sort tasks" }));
    const initial = screen.getAllByRole("checkbox").map((row) => row.props.accessibilityLabel);
    for (let index = 0; index < 3; index += 1) {
      await fireEvent.press(screen.getByRole("tab", { name: "Events" }));
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
      expect(
        screen
          .getAllByRole("checkbox", { includeHiddenElements: true })
          .map((row) => row.props.accessibilityLabel),
      ).toEqual(initial);
      await fireEvent.press(screen.getByRole("tab", { name: "Tasks" }));
      expect(screen.getAllByRole("checkbox").map((row) => row.props.accessibilityLabel)).toEqual(
        initial,
      );
      expect(screen.getByRole("button", { name: "Sort tasks" }).props.accessibilityValue.text).toBe(
        "Recently actioned",
      );
    }
  });

  it("waits for Plan to regain focus before completing the new-task breath", async () => {
    jest.useFakeTimers();
    const task = demoWorkspace.tasks[0];
    useCreatedItemHighlight.getState().mark("task", [task.id]);
    mockIsFocused = false;
    mockSearchParams = { view: "tasks" };

    const screen = await render(<PlanScreen />);
    const completedBreathDuration =
      motionDurations.fast +
      (motionDurations.state + motionDurations.press) * 2 +
      motionDurations.press;

    await act(async () => jest.advanceTimersByTime(completedBreathDuration));
    expect(useCreatedItemHighlight.getState().current?.ids).toContain(task.id);

    mockIsFocused = true;
    await screen.rerender(<PlanScreen />);
    await act(async () => jest.advanceTimersByTime(completedBreathDuration));

    expect(useCreatedItemHighlight.getState().current).toBeUndefined();
    jest.useRealTimers();
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

  it("keeps the segmented indicator mounted while switching views", async () => {
    const screen = await render(<PlanScreen />);
    const control = screen.getByLabelText("Plan view");
    const indicator = screen.getByTestId("segmented-control-indicator", {
      includeHiddenElements: true,
    });

    await fireEvent.press(screen.getByRole("tab", { name: "Tasks" }));

    expect(screen.getByLabelText("Plan view")).toBe(control);
    expect(
      screen.getAllByTestId("segmented-control-indicator", { includeHiddenElements: true })[0],
    ).toBe(indicator);
  });

  it("keeps event and task suggestions out of the live Plan workspace", async () => {
    const screen = await render(<PlanScreen />);

    expect(screen.queryByRole("button", { name: "Suggestions" })).toBeNull();
    await fireEvent.press(screen.getByRole("tab", { name: "Tasks" }));
    expect(screen.queryByRole("button", { name: "Suggestions" })).toBeNull();
    expect(screen.getByRole("button", { name: "Add task" })).toBeTruthy();
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

  it("keeps only status and priority in one anchored filter popover", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    expect(screen.queryByRole("button", { name: "High priority" })).toBeNull();
    expect(screen.queryByRole("button", { name: "All" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("radio", { name: "All statuses" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "All priorities" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "All events" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Any due date" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Show results" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Close filters" }));
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
    await fireEvent.press(screen.getByRole("radio", { name: "Completed" }));

    await waitFor(() => {
      expect(screen.getByText("Book bridal mehendi artist")).toBeTruthy();
      expect(screen.queryByText("Confirm catering menu")).toBeNull();
    });

    await fireEvent.press(screen.getByRole("button", { name: "Close filters" }));
    const activeFilters = screen.getByRole("button", { name: "Filters, 1 active" });
    expect(activeFilters.props.accessibilityState.selected).toBe(true);

    await fireEvent.press(activeFilters);
    await fireEvent.press(screen.getByRole("button", { name: "Reset filters" }));
    await fireEvent.press(screen.getByRole("button", { name: "Close filters" }));

    await waitFor(() => {
      expect(screen.getByText("Confirm catering menu")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
    });
  });

  it("offers filter reset instead of another creation action for filtered-empty tasks", async () => {
    mockSearchParams = { view: "tasks" };
    const screen = await render(<PlanScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Cancelled" }));
    await fireEvent.press(screen.getByRole("button", { name: "Close filters" }));

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

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutate).not.toHaveBeenCalled();
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
    expect(screen.getByText("Something went wrong. Please try again.")).toBeTruthy();
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
