import { act, fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import * as ReactNative from "react-native";

import BudgetScreen from "@/app/(app)/(tabs)/budget";
import { formatDateOnly } from "@/lib/dates";
import { formatInr } from "@/lib/money";
import { motionDurations } from "@/theme";

import { useCreatedItemHighlight } from "./created-item-highlight";
import { useWorkspace } from "./provider";
import { demoWorkspace } from "./seed";
import type { WorkspaceSnapshot } from "./types";

let mockIsFocused = true;

jest.mock("expo-router", () => ({
  router: {
    navigate: jest.fn(),
    push: jest.fn(),
  },
  useIsFocused: () => mockIsFocused,
}));

jest.mock("./provider", () => ({
  useWorkspace: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockRouter = jest.mocked(router);
const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");

function useSnapshot(snapshot: WorkspaceSnapshot = demoWorkspace) {
  mockUseWorkspace.mockReturnValue({
    data: snapshot,
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useWorkspace>);
}

describe("ExpensesDashboard", () => {
  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockIsFocused = true;
    useCreatedItemHighlight.setState({ current: undefined });
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 411 });
    useSnapshot();
  });

  it("waits for Money to regain focus before completing the new-expense breath", async () => {
    jest.useFakeTimers();
    const expense = demoWorkspace.expenses[0];
    useCreatedItemHighlight.getState().mark("expense", [expense.id]);
    mockIsFocused = false;

    const screen = await render(<BudgetScreen />);

    const completedBreathDuration =
      motionDurations.fast +
      (motionDurations.state + motionDurations.press) * 2 +
      motionDurations.press;
    await act(async () => jest.advanceTimersByTime(completedBreathDuration));
    expect(useCreatedItemHighlight.getState().current?.ids).toContain(expense.id);

    mockIsFocused = true;
    await screen.rerender(<BudgetScreen />);
    await act(async () => jest.advanceTimersByTime(completedBreathDuration));

    expect(useCreatedItemHighlight.getState().current).toBeUndefined();
    jest.useRealTimers();
  });

  it("keeps Money focused on recent expenses, newest first", async () => {
    const screen = await render(<BudgetScreen />);

    expect(screen.getByText("Money")).toBeTruthy();
    expect(screen.getByText("Recent expenses")).toBeTruthy();
    expect(
      screen.getByRole("header", {
        name: formatDateOnly(demoWorkspace.expenses[3].date ?? ""),
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/Every recorded expense/)).toBeNull();
    expect(screen.getByText("Budget position")).toBeTruthy();
    expect(screen.queryByText("Spending trend")).toBeNull();
    expect(screen.queryByText("All-time insights")).toBeNull();
    expect(screen.queryByText("Where money went")).toBeNull();
    expect(screen.queryByText("Wedding budget")).toBeNull();
    expect(screen.queryByText(demoWorkspace.wedding.name)).toBeNull();
    expect(screen.queryByText("Payment status")).toBeNull();

    const expenseCards = screen
      .getAllByRole("button")
      .filter((item) => String(item.props.accessibilityLabel).startsWith("Open expense:"));
    expect(expenseCards.map((item) => item.props.accessibilityLabel)).toEqual([
      expect.stringContaining("Reception stage, floral installation and lighting package"),
      expect.stringContaining("Catering payment"),
      expect.stringContaining("Wedding venue advance"),
      expect.stringContaining("Photography booking"),
    ]);
    expect(expenseCards[0]?.props.accessibilityLabel).toContain("Event");
    expect(expenseCards[0]?.props.accessibilityLabel).toContain("No attachment");

    const count = screen.getByTestId("money-expense-count");
    expect(count.props.accessibilityLiveRegion).toBe("polite");
    expect(count).toHaveTextContent("4 expenses");

    const footer = screen.getByTestId("money-action-footer");
    expect(footer.props.className).toContain("bg-elevatedSurface");
    expect(footer.props.className).toContain("shadow-floating");
  });

  it("never presents a legacy estimate as spending when actual amount is zero", async () => {
    useSnapshot({
      ...demoWorkspace,
      expenses: [
        {
          actualPaise: 0,
          categoryId: "category-core-other",
          createdAt: "2026-07-23T10:00:00.000Z",
          estimatedPaise: 250_000,
          id: "expense-minimal",
          title: "Small ceremony supply",
        },
      ],
    });
    const screen = await render(<BudgetScreen />);

    expect(screen.getByText("Small ceremony supply")).toBeTruthy();
    expect(screen.getByText("Amount not recorded")).toBeTruthy();
    expect(screen.getByTestId("money-expense-count")).toHaveTextContent("1 expense");
    expect(screen.queryByText(formatInr(250_000))).toBeNull();

    await fireEvent.press(
      screen.getByRole("button", { name: /Edit expense amount: Small ceremony supply/ }),
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith({
      params: { id: "expense-minimal" },
      pathname: "/expenses/edit",
    });
  });

  it("shows a first-record empty state when there are no expenses", async () => {
    useSnapshot({ ...demoWorkspace, expenses: [] });
    const screen = await render(<BudgetScreen />);

    expect(screen.getByText("No expenses yet")).toBeTruthy();
    expect(screen.queryByText("Record the first wedding cost when you are ready.")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Add expense" })).toHaveLength(1);
  });

  it("opens expense detail and quick creation routes", async () => {
    const screen = await render(<BudgetScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: /Open expense: Wedding venue advance/ }),
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith("/expenses/expense-1");

    await fireEvent.press(screen.getByRole("button", { name: "Add expense" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/expenses/new");
  });

  it("opens the existing budget overview from the Money header", async () => {
    const screen = await render(<BudgetScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Open budget overview" }));

    expect(mockRouter.navigate).toHaveBeenCalledWith("/budget/overview");
  });

  it("stacks expense headings and the Money header for large system text", async () => {
    useWindowDimensionsSpy.mockReturnValue({
      fontScale: 1.2999999,
      height: 800,
      scale: 2,
      width: 360,
    });

    const screen = await render(<BudgetScreen />);

    expect(screen.getByTestId("expense-card-heading-expense-4").props.style.flexDirection).toBe(
      "column",
    );
    expect(
      screen.getByText("Reception stage, floral installation and lighting package").props
        .numberOfLines,
    ).toBe(2);
    expect(screen.getByText(formatInr(185_000_000)).props.numberOfLines).toBeUndefined();
    expect(screen.getByRole("button", { name: "Open budget overview" })).toBeTruthy();
  });
});
