import { act, fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppBottomSheet } from "./AppBottomSheet";
import { AppText } from "./AppText";

jest.mock("react-native-reanimated", () => {
  const reanimated = jest.requireActual("react-native-reanimated");
  return {
    __esModule: true,
    ...reanimated,
    default: reanimated.default,
    useReducedMotion: () => false,
  };
});

function InsetsProbe() {
  const insets = useSafeAreaInsets();
  return <AppText testID="safe-area-insets">{JSON.stringify(insets)}</AppText>;
}

describe("AppBottomSheet", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("closes from Android Back, the backdrop, and its labelled close action", async () => {
    const onClose = jest.fn();
    const screen = await render(
      <AppBottomSheet onClose={onClose} title="Choose a ceremony" visible>
        <AppText>Options</AppText>
      </AppBottomSheet>,
    );

    expect(screen.getByTestId("app-bottom-sheet-modal").props.navigationBarTranslucent).toBe(true);
    expect(screen.getByTestId("app-bottom-sheet-panel").props.className).toContain("rounded-sheet");

    screen.getByTestId("app-bottom-sheet-modal").props.onRequestClose();
    await fireEvent.press(
      screen.getByTestId("app-bottom-sheet-backdrop", { includeHiddenElements: true }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("uses deterministic default insets and honours focused custom inset providers", async () => {
    const defaultScreen = await render(<InsetsProbe />);

    expect(JSON.parse(defaultScreen.getByTestId("safe-area-insets").props.children)).toEqual({
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    });
    await defaultScreen.unmount();

    const customScreen = await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { height: 800, width: 411, x: 0, y: 0 },
          insets: { bottom: 34, left: 0, right: 0, top: 24 },
        }}
      >
        <InsetsProbe />
      </SafeAreaProvider>,
    );

    expect(JSON.parse(customScreen.getByTestId("safe-area-insets").props.children)).toEqual({
      bottom: 34,
      left: 0,
      right: 0,
      top: 24,
    });
  });

  it("cancels a stale close when reopened and reports each completed close exactly once", async () => {
    jest.useFakeTimers();
    const onAfterClose = jest.fn();
    const onClose = jest.fn();
    const screen = await render(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible>
        <AppText>Options</AppText>
      </AppBottomSheet>,
    );

    await screen.rerender(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible={false}>
        <AppText>Options</AppText>
      </AppBottomSheet>,
    );
    await act(() => jest.advanceTimersByTime(0));

    expect(screen.getByTestId("app-bottom-sheet-modal").props.visible).toBe(true);
    expect(screen.queryByTestId("app-bottom-sheet-panel")).toBeNull();

    await screen.rerender(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible>
        <AppText>Options</AppText>
      </AppBottomSheet>,
    );
    await act(() => jest.runAllTimers());

    expect(screen.getByTestId("app-bottom-sheet-panel")).toBeTruthy();
    expect(onAfterClose).not.toHaveBeenCalled();

    await screen.rerender(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible={false}>
        <AppText>Options</AppText>
      </AppBottomSheet>,
    );
    await act(() => jest.runAllTimers());

    expect(screen.queryByTestId("app-bottom-sheet-modal")).toBeNull();
    expect(onAfterClose).toHaveBeenCalledTimes(1);

    await screen.rerender(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible={false}>
        <AppText>Options</AppText>
      </AppBottomSheet>,
    );
    await act(() => jest.runAllTimers());

    expect(onAfterClose).toHaveBeenCalledTimes(1);
  });

  it("completes a second close when reopen and close happen in the same frame", async () => {
    jest.useFakeTimers();
    const onAfterClose = jest.fn();
    const onClose = jest.fn();
    const content = <AppText>Options</AppText>;
    const screen = await render(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible>
        {content}
      </AppBottomSheet>,
    );

    await screen.rerender(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible={false}>
        {content}
      </AppBottomSheet>,
    );
    await act(() => jest.advanceTimersByTime(0));

    await screen.rerender(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible>
        {content}
      </AppBottomSheet>,
    );
    await screen.rerender(
      <AppBottomSheet onAfterClose={onAfterClose} onClose={onClose} title="Filters" visible={false}>
        {content}
      </AppBottomSheet>,
    );
    await act(() => jest.runAllTimers());

    expect(screen.queryByTestId("app-bottom-sheet-modal")).toBeNull();
    expect(onAfterClose).toHaveBeenCalledTimes(1);
  });
});
