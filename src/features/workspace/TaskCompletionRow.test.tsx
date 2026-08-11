import { fireEvent, render } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import type { Task } from "./types";
import { TaskCompletionRow } from "./TaskCompletionRow";

const baseTask: Task = {
  id: "task",
  title: "Confirm transport",
  dueDate: "2026-07-17",
  priority: "High",
  status: "Not Started",
  checklist: [],
  attachments: [],
};

const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");

describe("TaskCompletionRow", () => {
  beforeEach(() => {
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 411 });
  });

  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  it("exposes completion and reversible reopen states", async () => {
    const onToggle = jest.fn();
    const screen = await render(
      <TaskCompletionRow
        onPress={jest.fn()}
        onToggle={onToggle}
        task={baseTask}
        today="2026-07-17"
      />,
    );

    const openCheckbox = screen.getByRole("checkbox", {
      name: "Mark complete: Confirm transport",
    });
    expect(openCheckbox.props.accessibilityState.checked).toBe(false);
    await fireEvent.press(openCheckbox);
    expect(onToggle).toHaveBeenCalledTimes(1);

    await screen.rerender(
      <TaskCompletionRow
        onPress={jest.fn()}
        onToggle={onToggle}
        task={{ ...baseTask, status: "Completed" }}
        today="2026-07-17"
      />,
    );
    const completedCheckbox = screen.getByRole("checkbox", {
      name: "Reopen: Confirm transport",
    });
    expect(completedCheckbox.props.accessibilityState.checked).toBe(true);
    expect(screen.getByText("Completed")).toBeTruthy();
  });

  it("disables completion without disabling task detail navigation", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <TaskCompletionRow
        disabled
        onPress={onPress}
        onToggle={jest.fn()}
        task={baseTask}
        today="2026-07-17"
        variant="compact"
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Mark complete: Confirm transport" }).props
        .accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Open task: Confirm transport" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("keeps long titles and metadata visible in the shared aligned card", async () => {
    const title = "Confirm the final family transport and accommodation pickup schedule";
    const onPress = jest.fn();
    const screen = await render(
      <TaskCompletionRow
        eventName="Wedding"
        onPress={onPress}
        onToggle={jest.fn()}
        task={{ ...baseTask, title }}
        today="2026-07-17"
      />,
    );

    const titleButton = screen.getByTestId("task-title-button-task");
    expect(screen.getByText(title).props.numberOfLines).toBe(2);
    expect(screen.getByText("Wedding")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("High")).toBeTruthy();

    await fireEvent.press(titleButton);
    expect(onPress).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole("button", { name: `Open task: ${title}` }));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("stacks task metadata and the status action at large text sizes", async () => {
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1.3, height: 800, scale: 2, width: 411 });
    const screen = await render(
      <TaskCompletionRow
        eventName="Wedding"
        onPress={jest.fn()}
        onToggle={jest.fn()}
        task={baseTask}
        today="2026-07-17"
      />,
    );

    expect(
      ReactNative.StyleSheet.flatten(screen.getByTestId("task-detail-area").props.style),
    ).toMatchObject({
      alignItems: "stretch",
      flexDirection: "column",
    });
  });
});
