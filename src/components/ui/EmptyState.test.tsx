import { fireEvent, render } from "@testing-library/react-native";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("turns the compact row into the single next action", async () => {
    const onAction = jest.fn();
    const screen = await render(
      <EmptyState
        actionLabel="Add task"
        description="Start with an action."
        onAction={onAction}
        title="No tasks yet"
      />,
    );

    const action = screen.getByRole("button", { name: "Add task" });
    expect(action.props.className).toContain("min-h-16");
    expect(action.props.accessibilityHint).toContain("Start with an action.");

    await fireEvent.press(action);

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("supports a concise neutral row without a description or action", async () => {
    const screen = await render(<EmptyState title="No expenses yet" />);

    const state = screen.getByLabelText("No expenses yet");
    expect(state.props.className).toContain("min-h-16");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
