import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import BudgetScreen from "@/app/(app)/(tabs)/budget";
import { formatInr } from "@/lib/money";

import { useWorkspace } from "./provider";
import { demoWorkspace } from "./seed";
import type { WorkspaceSnapshot } from "./types";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("./provider", () => ({
  useWorkspace: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockRouter = jest.mocked(router);

function useSnapshot(snapshot: WorkspaceSnapshot = demoWorkspace) {
  mockUseWorkspace.mockReturnValue({
    data: snapshot,
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useWorkspace>);
}

describe("ExpensesDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSnapshot();
  });

  it("filters expenses by every payment state", async () => {
    const screen = await render(<BudgetScreen />);

    expect(screen.getByText("Wedding venue advance")).toBeTruthy();
    expect(screen.getByText("Photography booking")).toBeTruthy();
    expect(screen.getByText("Catering estimate")).toBeTruthy();
    expect(screen.queryByText(demoWorkspace.wedding.name)).toBeNull();
    expect(screen.queryByText("Berhampur Convention Hall")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Paid" }));
    expect(screen.getByText("Photography booking")).toBeTruthy();
    expect(screen.queryByText("Wedding venue advance")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Partially paid" }));
    expect(screen.getByText("Wedding venue advance")).toBeTruthy();
    expect(
      screen.getByText("Reception stage, floral installation and lighting package"),
    ).toBeTruthy();
    expect(screen.queryByText("Photography booking")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Unpaid" }));
    expect(screen.getByText("Catering estimate")).toBeTruthy();
    expect(screen.queryByText("Wedding venue advance")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Wedding venue advance")).toBeTruthy();
  });

  it("combines the payment chips with an advanced category filter", async () => {
    const screen = await render(<BudgetScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));
    await fireEvent.press(screen.getByRole("button", { name: "Category: All categories" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "Photography" }));

    await waitFor(() => {
      expect(screen.getByText("Photography booking")).toBeTruthy();
      expect(screen.queryByText("Wedding venue advance")).toBeNull();
      expect(screen.getByRole("button", { name: "Filters, 1 active" })).toBeTruthy();
    });

    await fireEvent.press(screen.getByRole("button", { name: "Paid" }));
    expect(screen.getByText("Photography booking")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => {
      expect(screen.getByText("Photography booking")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
    });

    await fireEvent.press(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Wedding venue advance")).toBeTruthy();
  });

  it("labels an estimated-only expense instead of showing a zero actual amount", async () => {
    const screen = await render(<BudgetScreen />);

    expect(screen.getByText("Catering estimate")).toBeTruthy();
    expect(screen.getByText(formatInr(450_000_000))).toBeTruthy();
    expect(screen.getByText("Estimate")).toBeTruthy();
  });

  it("renders an expense when optional vendor and due-date metadata are missing", async () => {
    useSnapshot({
      ...demoWorkspace,
      expenses: [
        {
          actualPaise: 25_000,
          categoryId: "category-14",
          id: "expense-minimal",
          paidPaise: 0,
          paymentStatus: "Not Paid",
          title: "Small ceremony supply",
        },
      ],
    });

    const screen = await render(<BudgetScreen />);

    expect(screen.getByText("Small ceremony supply")).toBeTruthy();
    expect(screen.getByText("Miscellaneous")).toBeTruthy();
    expect(screen.getAllByText("Unpaid").length).toBeGreaterThan(0);
  });

  it("shows a filtered empty state", async () => {
    const screen = await render(<BudgetScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Filters" }));
    await fireEvent.press(screen.getByRole("button", { name: "Category: All categories" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "Bride" }));

    await waitFor(() => expect(screen.getByText("No matching expenses")).toBeTruthy());
  });

  it("shows a first-record empty state when there are no expenses", async () => {
    useSnapshot({ ...demoWorkspace, expenses: [] });

    const screen = await render(<BudgetScreen />);

    expect(screen.getByText("No expenses yet")).toBeTruthy();
    expect(screen.getByText("Record the first wedding cost when you are ready.")).toBeTruthy();
  });

  it("opens expense detail and creation routes", async () => {
    const screen = await render(<BudgetScreen />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Open expense: Wedding venue advance" }),
    );
    expect(mockRouter.push).toHaveBeenCalledWith("/expenses/expense-1");

    await fireEvent.press(screen.getByRole("button", { name: "Add expense" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/expenses/new");
  });
});
