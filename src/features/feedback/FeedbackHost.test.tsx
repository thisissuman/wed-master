import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { FeedbackHost } from "./FeedbackHost";
import { useFeedbackStore } from "./feedback-store";

const metrics = {
  frame: { height: 800, width: 360, x: 0, y: 0 },
  insets: { bottom: 16, left: 0, right: 0, top: 24 },
};

describe("FeedbackHost", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useFeedbackStore.getState().dismiss();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("announces success and exposes an accessible undo action", async () => {
    const announce = jest
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => undefined);
    const undo = jest.fn();
    const screen = await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <FeedbackHost />
      </SafeAreaProvider>,
    );

    await act(() =>
      useFeedbackStore.getState().show({
        actionLabel: "Undo",
        message: "Task deleted",
        onAction: undo,
      }),
    );

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(announce).toHaveBeenCalledWith("Task deleted");
    await fireEvent.press(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(undo).toHaveBeenCalledTimes(1));
    announce.mockRestore();
  });

  it("dismisses passive feedback after two seconds", async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <FeedbackHost />
      </SafeAreaProvider>,
    );

    await act(() => useFeedbackStore.getState().show({ message: "Expense added" }));
    await act(() => jest.advanceTimersByTime(1_999));
    expect(useFeedbackStore.getState().current?.message).toBe("Expense added");
    await act(() => jest.advanceTimersByTime(1));
    expect(useFeedbackStore.getState().current).toBeUndefined();
  });

  it("keeps an Undo notice available for five seconds", async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <FeedbackHost />
      </SafeAreaProvider>,
    );

    await act(() =>
      useFeedbackStore.getState().show({
        actionLabel: "Undo",
        message: "Task deleted",
        onAction: jest.fn(),
      }),
    );
    await act(() => jest.advanceTimersByTime(4_999));
    expect(useFeedbackStore.getState().current?.message).toBe("Task deleted");
    await act(() => jest.advanceTimersByTime(1));
    expect(useFeedbackStore.getState().current).toBeUndefined();
  });
});
