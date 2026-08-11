import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { Keyboard, Platform, StyleSheet, type KeyboardEvent } from "react-native";

import { todayDateOnly } from "@/lib/dates";

import { ExpenseForm } from "./ExpenseForm";
import { GiftForm } from "./gifts/GiftForm";
import { HouseholdForm } from "./guests/HouseholdForm";
import { TaskForm } from "./TaskForm";
import { useCreateExpenseMutation, useWorkspace, useWorkspaceMutation } from "./provider";
import { demoWorkspace } from "./seed";
import type { Expense, Repositories } from "./types";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    replace: jest.fn(),
  },
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()), dispatch: jest.fn() }),
}));

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success" },
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock("react-native-reanimated", () => {
  const reanimated = jest.requireActual("react-native-reanimated");
  return {
    __esModule: true,
    ...reanimated,
    default: reanimated.default,
    useAnimatedKeyboard: () => ({ height: { value: 0 }, state: { value: 4 } }),
  };
});

jest.mock("./provider", () => ({
  useCreateExpenseMutation: jest.fn(),
  useWorkspace: jest.fn(),
  useWorkspaceMutation: jest.fn(),
}));

const mockUseCreateExpenseMutation = jest.mocked(useCreateExpenseMutation);
const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const createMutateAsync = jest.fn();
const mutateAsync = jest.fn();

describe("workspace forms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createMutateAsync.mockReset();
    mutateAsync.mockReset();
    mockUseWorkspace.mockReturnValue({
      data: demoWorkspace,
    } as ReturnType<typeof useWorkspace>);
    mockUseCreateExpenseMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: createMutateAsync,
    } as unknown as ReturnType<typeof useCreateExpenseMutation>);
    mockUseWorkspaceMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync,
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
  });

  it("starts compactly and puts Other first in the seven-category picker", async () => {
    const screen = await render(<ExpenseForm />);

    expect(screen.getByTestId("quick-expense-overlay").props.className).toContain("bg-overlay");
    expect(screen.getByRole("button", { name: "Close expense form" })).toBeTruthy();
    expect(screen.queryByText("Record a wedding cost in a few seconds.")).toBeNull();
    expect(screen.getAllByText("Add expense")).toHaveLength(1);
    expect(screen.getByLabelText("Expense title")).toBeTruthy();
    expect(screen.getByLabelText("Expense title").props.autoFocus).not.toBe(true);
    expect(screen.getByRole("button", { name: "Select category, required" })).toBeTruthy();
    expect(screen.queryByText("A category is required before entering the amount")).toBeNull();
    expect(screen.queryByLabelText("Amount")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Select category, required" }));

    expect(screen.getByTestId("category-picker-overlay")).toBeTruthy();
    expect(
      within(await screen.findByLabelText("Expense categories"))
        .getAllByRole("button")
        .map((item) => item.props.accessibilityLabel),
    ).toEqual([
      "Other",
      "Task, choose existing task",
      "Event, choose existing event",
      "Shopping",
      "Commute",
      "Gift",
      "Advance",
    ]);
  });

  it("opens categories only after a visible Android keyboard finishes closing", async () => {
    const originalAddListener = Keyboard.addListener.bind(Keyboard);
    const isVisibleSpy = jest.spyOn(Keyboard, "isVisible").mockReturnValue(true);
    const dismissSpy = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => undefined);
    let keyboardHideListener: ((event: KeyboardEvent) => void) | undefined;
    const addListenerSpy = jest
      .spyOn(Keyboard, "addListener")
      .mockImplementation((eventType, listener) => {
        if (eventType === "keyboardWillHide" || eventType === "keyboardDidHide") {
          keyboardHideListener = listener;
        }
        return originalAddListener(eventType, listener);
      });

    try {
      const screen = await render(<ExpenseForm />);

      await fireEvent.press(screen.getByRole("button", { name: "Select category, required" }));

      expect(dismissSpy).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("category-picker-overlay")).toBeNull();

      await act(() => {
        keyboardHideListener?.({
          duration: 0,
          easing: "keyboard",
          endCoordinates: { height: 0, screenX: 0, screenY: 800, width: 400 },
        });
      });

      expect(screen.getByTestId("category-picker-overlay")).toBeTruthy();
    } finally {
      addListenerSpy.mockRestore();
      dismissSpy.mockRestore();
      isVisibleSpy.mockRestore();
    }
  });

  it("mounts the Android sheet with a native animated keyboard inset before autofocus", async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });

    try {
      const screen = await render(<ExpenseForm />);
      const style = StyleSheet.flatten(screen.getByTestId("quick-expense-overlay").props.style);

      expect(style.paddingBottom).toBe(0);
      expect(screen.getByLabelText("Expense title").props.autoFocus).not.toBe(true);
    } finally {
      Object.defineProperty(Platform, "OS", { configurable: true, value: originalOS });
    }
  });

  it("selects Other immediately and reveals the amount field", async () => {
    const screen = await render(<ExpenseForm />);

    await fireEvent.press(screen.getByRole("button", { name: "Select category, required" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Other" }));

    expect(await screen.findByRole("button", { name: "Category: Other" })).toBeTruthy();
    expect(screen.getByLabelText("Amount")).toBeTruthy();
    expect(screen.queryByTestId("category-picker-overlay")).toBeNull();
    expect(screen.queryByText("Select category")).toBeNull();
  });

  it("chooses an existing task and carries its event into the expense", async () => {
    const created: Expense = {
      actualPaise: 5_000,
      categoryId: "category-core-task",
      createdAt: "2026-07-23T10:00:00.000Z",
      date: todayDateOnly() as Expense["date"],
      eventId: "event-wedding",
      id: "expense-task",
      title: "Confirm catering menu",
    };
    createMutateAsync.mockResolvedValue({ expense: created, snapshot: demoWorkspace });
    const screen = await render(<ExpenseForm />);

    await fireEvent.press(screen.getByRole("button", { name: "Select category, required" }));
    await fireEvent.press(
      await screen.findByRole("button", { name: "Task, choose existing task" }),
    );
    await fireEvent.press(
      await screen.findByRole("button", { name: "Task: Confirm catering menu" }),
    );

    expect(screen.getByLabelText("Expense title").props.value).toBe("Confirm catering menu");
    expect(
      screen.getByRole("button", { name: "Category: Task, Confirm catering menu" }),
    ).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Amount"), "50");
    await fireEvent.press(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        actualPaise: 5_000,
        categoryId: "category-core-task",
        date: todayDateOnly(),
        eventId: "event-wedding",
        title: "Confirm catering menu",
      }),
    );
  });

  it("chooses an existing event from the category picker", async () => {
    const screen = await render(<ExpenseForm />);

    await fireEvent.press(screen.getByRole("button", { name: "Select category, required" }));
    await fireEvent.press(
      await screen.findByRole("button", { name: "Event, choose existing event" }),
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Event: Engagement" }));

    expect(screen.getByLabelText("Expense title").props.value).toBe("Engagement");
    expect(screen.getByRole("button", { name: "Category: Event, Engagement" })).toBeTruthy();
  });

  it("reuses a previous title and category without copying its amount", async () => {
    const screen = await render(<ExpenseForm />);

    await fireEvent.changeText(screen.getByLabelText("Expense title"), "wed");
    await fireEvent.press(
      await screen.findByRole("button", { name: "Use expense title: Wedding venue advance" }),
    );

    expect(screen.getByLabelText("Expense title").props.value).toBe("Wedding venue advance");
    expect(screen.getByRole("button", { name: "Category: Advance" })).toBeTruthy();
    expect(screen.getByLabelText("Amount").props.value).toBe("");
  });

  it("creates an actual-only expense and moves to optional details", async () => {
    const created: Expense = {
      actualPaise: 12_345,
      categoryId: "category-core-shopping",
      createdAt: "2026-07-23T10:00:00.000Z",
      date: todayDateOnly() as Expense["date"],
      id: "expense-created",
      title: "Wedding shoes",
    };
    createMutateAsync.mockResolvedValue({ expense: created, snapshot: demoWorkspace });
    const screen = await render(<ExpenseForm />);

    await fireEvent.changeText(screen.getByLabelText("Expense title"), "Wedding shoes");
    await fireEvent.press(screen.getByRole("button", { name: "Select category, required" }));
    await fireEvent.press(screen.getByRole("button", { name: "Shopping" }));
    await fireEvent.changeText(screen.getByLabelText("Amount"), "123.45");
    await fireEvent.press(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() =>
      expect(createMutateAsync).toHaveBeenCalledWith({
        actualPaise: 12_345,
        categoryId: "category-core-shopping",
        date: todayDateOnly(),
        title: "Wedding shoes",
      }),
    );
    expect(await screen.findByLabelText("Expense added")).toBeTruthy();
    expect(screen.getByTestId("quick-expense-overlay")).toBeTruthy();
    expect(screen.getByText("Optional details")).toBeTruthy();
    expect(screen.getByLabelText(/^Expense date:/)).toBeTruthy();
    expect(screen.getByLabelText("Note")).toBeTruthy();
    expect(screen.getByText("Attachment or receipt")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add another expense" })).toBeTruthy();
  });

  it("preserves hidden legacy fields while editing visible expense details", async () => {
    const updateExpense = jest.fn(async () => demoWorkspace);
    mutateAsync.mockImplementation(
      async (operation: (repositories: Repositories) => Promise<unknown>) =>
        operation({ expenses: { updateExpense } } as unknown as Repositories),
    );
    const legacyExpense: Expense = {
      ...demoWorkspace.expenses[0],
      dueDate: "2026-08-01",
      estimatedPaise: 900_000,
      eventId: "event-wedding",
      paidPaise: 100_000,
      paymentStatus: "Partially Paid",
      vendorName: "Legacy vendor",
    };
    const screen = await render(<ExpenseForm expense={legacyExpense} />);

    expect(screen.queryByText("Payment status")).toBeNull();
    expect(screen.queryByText("Vendor")).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Amount"), "2500");
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateExpense).toHaveBeenCalledTimes(1));
    expect(updateExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        actualPaise: 250_000,
        dueDate: "2026-08-01",
        estimatedPaise: 900_000,
        eventId: "event-wedding",
        paidPaise: 100_000,
        paymentStatus: "Partially Paid",
        vendorName: "Legacy vendor",
      }),
    );
  });

  it("creates gifts as Received without exposing the removed gift-type switch", async () => {
    const createGift = jest.fn(async () => demoWorkspace);
    mutateAsync.mockImplementation(
      async (operation: (repositories: Repositories) => Promise<unknown>) =>
        operation({ gifts: { createGift } } as unknown as Repositories),
    );
    const screen = await render(<GiftForm />);

    expect(screen.queryByText("Gift type")).toBeNull();
    expect(screen.getByLabelText("Received from")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Received from"), "Asha's aunt");
    await fireEvent.changeText(screen.getByLabelText("Value (₹)"), "2500");
    await fireEvent.press(screen.getByRole("button", { name: "More details" }));
    await fireEvent.changeText(screen.getByLabelText("Gift description"), "Silver bowl");
    await fireEvent.press(screen.getByRole("button", { name: "Add gift" }));

    await waitFor(() => expect(createGift).toHaveBeenCalledTimes(1));
    expect(createGift).toHaveBeenCalledWith(
      expect.objectContaining({
        itemName: "Silver bowl",
        personName: "Asha's aunt",
      }),
    );
  });

  it("uses one compact household RSVP and hides individual guest names", async () => {
    const screen = await render(<HouseholdForm />);

    expect(screen.getByText("Household RSVP")).toBeTruthy();
    expect(screen.queryByText("Guest names")).toBeNull();
    expect(screen.queryByLabelText("Individual guest names")).toBeNull();
    expect(screen.getByRole("button", { name: "Planning details" })).toBeTruthy();
  });

  it("shows core task planning fields and keeps secondary details collapsed", async () => {
    const screen = await render(<TaskForm />);

    expect(screen.getByText("Linked event")).toBeTruthy();
    expect(screen.getByText("Assigned to")).toBeTruthy();
    expect(screen.queryByText("Status")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "More task details" }));
    expect(screen.getByText("Status")).toBeTruthy();
  });
});
