import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as ReactNative from "react-native";

import BudgetOverviewScreen from "@/app/(app)/budget/overview";

import { useWorkspace, useWorkspaceMutation } from "./provider";
import { createDemoWorkspace, demoWorkspace } from "./seed";
import type { Repositories, WorkspaceSnapshot } from "./types";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
}));

jest.mock("./provider", () => ({
  useWorkspace: jest.fn(),
  useWorkspaceMutation: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mockRouter = jest.mocked(router);
const mutateAsync = jest.fn();
const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");
const currentBudgetWorkspace = createDemoWorkspace(new Date());

function useSnapshot(snapshot: WorkspaceSnapshot = currentBudgetWorkspace) {
  mockUseWorkspace.mockReturnValue({
    data: snapshot,
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useWorkspace>);
}

describe("BudgetOverviewDashboard", () => {
  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 411 });
    useSnapshot();
    mockUseWorkspaceMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync,
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
  });

  it("uses a compact budget summary before trends, dates, and category breakdown", async () => {
    const screen = await render(<BudgetOverviewScreen />);

    expect(screen.getByText("Budget & expenses")).toBeTruthy();
    expect(screen.queryByText("Budget position")).toBeNull();
    expect(screen.queryByText("Target compared with actual recorded spending")).toBeNull();
    expect(screen.queryByText("Target, spending trends, and category insights.")).toBeNull();
    expect(screen.getByText("Target")).toBeTruthy();
    expect(screen.getByText("Spent")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByTestId("budget-summary")).toBeTruthy();
    expect(screen.getByText("Spending trend")).toBeTruthy();
    expect(screen.getByText("All-time insights")).toBeTruthy();
    expect(screen.getByText("Where money went")).toBeTruthy();
    expect(screen.getByTestId("spending-trend-chart")).toBeTruthy();
    expect(screen.queryByText("Recent expenses")).toBeNull();
  });

  it("switches the spending graph range and haptics only on a real change", async () => {
    const screen = await render(<BudgetOverviewScreen />);

    expect(screen.getByRole("image", { name: /Spending trend for the last 30 days/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole("tab", { name: "30 days" }));
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("tab", { name: "90 days" }));

    expect(screen.getByRole("image", { name: /Spending trend for the last 90 days/ })).toBeTruthy();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole("tab", { name: "90 days" }));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("shows spent plus a target action when no target exists", async () => {
    const snapshot = structuredClone(currentBudgetWorkspace);
    delete snapshot.wedding.budgetTargetPaise;
    useSnapshot(snapshot);
    const screen = await render(<BudgetOverviewScreen />);

    expect(screen.getByText("Not set")).toBeTruthy();
    expect(screen.getByText("Spent")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Set target" })).toBeTruthy();
    expect(screen.queryByText(/of target spent/)).toBeNull();
  });

  it("updates and clears the budget target from the overview", async () => {
    const updateWedding = jest.fn(async () => demoWorkspace);
    mutateAsync.mockImplementation(
      async (operation: (repositories: Repositories) => Promise<unknown>) =>
        operation({ wedding: { updateWedding } } as unknown as Repositories),
    );
    const screen = await render(<BudgetOverviewScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Edit target" }));
    await fireEvent.changeText(screen.getByLabelText("Target amount (₹)"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Save target" }));

    await waitFor(() => expect(updateWedding).toHaveBeenCalledTimes(1));
    expect(updateWedding).toHaveBeenCalledWith(
      expect.objectContaining({ budgetTargetPaise: undefined }),
    );
  });

  it("returns to the Money expense list from the overview", async () => {
    const screen = await render(<BudgetOverviewScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "View recent expenses" }));

    expect(mockRouter.navigate).toHaveBeenCalledWith("/budget");
  });

  it("stacks financial summaries, chart totals, and modal actions for large text", async () => {
    useWindowDimensionsSpy.mockReturnValue({
      fontScale: 1.2999999,
      height: 800,
      scale: 2,
      width: 360,
    });
    const screen = await render(<BudgetOverviewScreen />);

    expect(screen.getByTestId("budget-summary-layout").props.style.flexDirection).toBe("column");
    expect(screen.getByTestId("budget-summary-metrics").props.style.flexDirection).toBe("column");
    expect(screen.getByTestId("spending-trend-header").props.style.flexDirection).toBe("column");
    expect(screen.getByTestId("category-breakdown-heading-event").props.style.flexDirection).toBe(
      "column",
    );

    await fireEvent.press(screen.getByRole("button", { name: "Edit target" }));
    expect(screen.getByTestId("budget-target-actions").props.style.flexDirection).toBe("column");
  });

  it("keeps the no-dated-spending state intentional", async () => {
    useSnapshot({
      ...currentBudgetWorkspace,
      expenses: currentBudgetWorkspace.expenses.map(({ date: _date, ...expense }) => expense),
    });

    const screen = await render(<BudgetOverviewScreen />);

    expect(screen.getByText("No dated spending in this range")).toBeTruthy();
    expect(screen.queryByTestId("spending-trend-chart")).toBeNull();
  });
});
