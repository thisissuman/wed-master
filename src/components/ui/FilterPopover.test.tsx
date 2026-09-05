import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef, type ComponentRef } from "react";
import * as ReactNative from "react-native";
import { AccessibilityInfo, Pressable, StyleSheet } from "react-native";

import { AppText } from "./AppText";
import { FilterPopover } from "./FilterPopover";

jest.mock("@/lib/responsive", () => ({
  ...jest.requireActual("@/lib/responsive"),
  isLargeText: () => false,
}));

function measuredAnchor() {
  const anchorRef = createRef<ComponentRef<typeof Pressable>>();
  const measureInWindow = jest.fn(
    (callback: (x: number, y: number, width: number, height: number) => void) =>
      callback(300, 100, 48, 48),
  );
  Object.assign(anchorRef, { current: { measureInWindow } });
  return { anchorRef, measureInWindow };
}

describe("FilterPopover", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("measures on a scheduled frame and anchors the panel below the trigger", async () => {
    const { anchorRef, measureInWindow } = measuredAnchor();
    const screen = await render(
      <FilterPopover
        activeCount={0}
        anchorRef={anchorRef}
        onClose={jest.fn()}
        onReset={jest.fn()}
        title="Task filters"
        visible
      >
        <AppText>Choices</AppText>
      </FilterPopover>,
    );

    expect(screen.queryByTestId("filter-popover-panel")).toBeNull();
    await act(() => jest.runOnlyPendingTimers());

    expect(measureInWindow).toHaveBeenCalledTimes(1);
    expect(
      StyleSheet.flatten(screen.getByTestId("filter-popover-panel").props.style),
    ).toMatchObject({
      position: "absolute",
      top: 156,
      width: 320,
    });
  });

  it("uses the fallback dialog when the trigger cannot be measured", async () => {
    const screen = await render(
      <FilterPopover
        activeCount={0}
        anchorRef={createRef<ComponentRef<typeof Pressable>>()}
        onClose={jest.fn()}
        onReset={jest.fn()}
        title="Task filters"
        visible
      >
        <AppText>Choices</AppText>
      </FilterPopover>,
    );

    await act(() => jest.runOnlyPendingTimers());

    const panelStyle = StyleSheet.flatten(screen.getByTestId("filter-popover-panel").props.style);
    expect(panelStyle).toMatchObject({ width: 320 });
    expect(panelStyle.position).toBeUndefined();
  });

  it("falls back when a native measurement callback never arrives", async () => {
    const anchorRef = createRef<ComponentRef<typeof Pressable>>();
    Object.assign(anchorRef, { current: { measureInWindow: jest.fn() } });
    const screen = await render(
      <FilterPopover
        activeCount={0}
        anchorRef={anchorRef}
        onClose={jest.fn()}
        onReset={jest.fn()}
        title="Task filters"
        visible
      >
        <AppText>Choices</AppText>
      </FilterPopover>,
    );

    await act(() => jest.runOnlyPendingTimers());
    await act(() => jest.advanceTimersByTime(200));

    expect(screen.getByTestId("filter-popover-panel")).toBeTruthy();
  });

  it("restores accessibility focus to the trigger after closing", async () => {
    const { anchorRef } = measuredAnchor();
    const onClose = jest.fn();
    const focusSpy = jest
      .spyOn(AccessibilityInfo, "setAccessibilityFocus")
      .mockImplementation(() => undefined);
    const nodeHandleSpy = jest.spyOn(ReactNative, "findNodeHandle").mockReturnValue(41);
    const screen = await render(
      <FilterPopover
        activeCount={1}
        anchorRef={anchorRef}
        onClose={onClose}
        onReset={jest.fn()}
        title="Task filters"
        visible
      >
        <AppText>Choices</AppText>
      </FilterPopover>,
    );
    await act(() => jest.runOnlyPendingTimers());

    await fireEvent.press(screen.getByRole("button", { name: "Close filters" }));
    await act(() => jest.runOnlyPendingTimers());

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledWith(41);
    focusSpy.mockRestore();
    nodeHandleSpy.mockRestore();
  });
});
