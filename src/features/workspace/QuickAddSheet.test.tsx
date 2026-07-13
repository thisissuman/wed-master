import { fireEvent, render } from "@testing-library/react-native";

import { QuickAddSheet } from "./QuickAddSheet";

describe("QuickAddSheet", () => {
  it("routes the selected primary add action through its callback", async () => {
    const onAddEvent = jest.fn();
    const onAddExpense = jest.fn();
    const onAddTask = jest.fn();
    const screen = await render(
      <QuickAddSheet
        onAddEvent={onAddEvent}
        onAddExpense={onAddExpense}
        onAddTask={onAddTask}
        onClose={jest.fn()}
        visible
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Add Expense" }));

    expect(onAddExpense).toHaveBeenCalledTimes(1);
    expect(onAddTask).not.toHaveBeenCalled();
    expect(onAddEvent).not.toHaveBeenCalled();
  });
});
