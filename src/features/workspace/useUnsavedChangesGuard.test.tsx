import { act, renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";

import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

const mockAddListener = jest.fn(() => jest.fn());

jest.mock("expo-router", () => ({
  router: { back: jest.fn() },
  useNavigation: () => ({ addListener: mockAddListener, dispatch: jest.fn() }),
}));

describe("useUnsavedChangesGuard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("asks before an explicit dirty-form exit and leaves only after discard", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const { result } = await renderHook(() =>
      useUnsavedChangesGuard({ isDirty: true, isSubmitting: false }),
    );

    await act(() => result.current.requestExit());

    expect(router.back).not.toHaveBeenCalled();
    const actions = alert.mock.calls[0]?.[2];
    await act(() => actions?.find((action) => action.text === "Discard")?.onPress?.());
    expect(router.back).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it("blocks exit while a submission is pending", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const { result } = await renderHook(() =>
      useUnsavedChangesGuard({ isDirty: true, isSubmitting: true }),
    );

    await act(() => result.current.requestExit());

    expect(router.back).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
