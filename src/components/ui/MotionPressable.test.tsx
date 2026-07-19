import { fireEvent, render } from "@testing-library/react-native";

import { MotionPressable } from "./MotionPressable";
import { AppText } from "./AppText";

describe("MotionPressable", () => {
  it("preserves accessible press behavior while providing motion feedback", async () => {
    const onPress = jest.fn();
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const screen = await render(
      <MotionPressable
        accessibilityLabel="Open planning card"
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <AppText>Planning card</AppText>
      </MotionPressable>,
    );

    const control = screen.getByRole("button", { name: "Open planning card" });
    await fireEvent(control, "pressIn");
    await fireEvent.press(control);
    await fireEvent(control, "pressOut");

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });
});
