import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

import { useTodayDateOnly } from "./useTodayDateOnly";

describe("useTodayDateOnly", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("refreshes at the next local midnight", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 29, 23, 59, 59, 900));
    const { result } = await renderHook(() => useTodayDateOnly());

    expect(result.current).toBe("2026-08-29");
    await act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe("2026-08-30");
  });

  it("refreshes when the app returns to the foreground", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 29, 12));
    let appStateListener: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
      appStateListener = listener;
      return { remove: jest.fn() };
    });
    const { result } = await renderHook(() => useTodayDateOnly());

    jest.setSystemTime(new Date(2026, 7, 30, 9));
    await act(() => appStateListener?.("active"));

    expect(result.current).toBe("2026-08-30");
  });
});
