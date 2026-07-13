import { fireEvent, render } from "@testing-library/react-native";

import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("makes the next action available from the empty state", async () => {
    const onAction = jest.fn();
    const screen = await render(
      <EmptyState
        actionLabel="Add task"
        description="Start with an action."
        onAction={onAction}
        title="No tasks yet"
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Add task" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
