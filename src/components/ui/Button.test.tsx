import { fireEvent, render } from "@testing-library/react-native";

import { Button } from "./Button";

describe("Button", () => {
  it("exposes an accessible button and calls its handler", async () => {
    const onPress = jest.fn();
    const screen = await render(<Button label="Continue" onPress={onPress} />);

    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
