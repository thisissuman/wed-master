import { fireEvent, render } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { SegmentedControl } from "./SegmentedControl";

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn() }));

describe("SegmentedControl", () => {
  it("changes selection once with tactile feedback and preserves tab semantics", async () => {
    const onChange = jest.fn();
    const screen = await render(
      <SegmentedControl
        accessibilityLabel="Plan view"
        onChange={onChange}
        options={[
          { label: "Tasks", value: "tasks" },
          { label: "Events", value: "events" },
        ]}
        value="events"
      />,
    );

    expect(screen.getByRole("tab", { name: "Events" }).props.accessibilityState.selected).toBe(
      true,
    );
    await fireEvent.press(screen.getByRole("tab", { name: "Tasks" }));

    expect(onChange).toHaveBeenCalledWith("tasks");
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });
});
