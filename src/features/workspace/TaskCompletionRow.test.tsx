import { fireEvent, render } from "@testing-library/react-native";

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

describe("TaskCompletionRow", () => {
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

    const titleScroller = screen.getByTestId("task-title-scroll-task");
    expect(titleScroller.props.horizontal).toBe(true);
    expect(titleScroller.props.showsHorizontalScrollIndicator).toBe(false);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText("Wedding")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("High")).toBeTruthy();

    await fireEvent(titleScroller, "touchStart", {
      nativeEvent: { pageX: 240, pageY: 24 },
    });
    await fireEvent(titleScroller, "touchMove", {
      nativeEvent: { pageX: 100, pageY: 24 },
    });
    await fireEvent(titleScroller, "touchEnd", {
      nativeEvent: { pageX: 100, pageY: 24 },
    });
    expect(onPress).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: `Open task: ${title}` }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
