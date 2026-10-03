import { render } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { AppText } from "./AppText";

describe("AppText", () => {
  it("scales its line height with Android large text", async () => {
    const dimensions = jest.spyOn(ReactNative, "useWindowDimensions").mockReturnValue({
      fontScale: 2,
      height: 800,
      scale: 2,
      width: 360,
    });

    try {
      const screen = await render(<AppText variant="display">Inspire</AppText>);

      expect(screen.getByText("Inspire").props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ lineHeight: 68 })]),
      );
    } finally {
      dimensions.mockRestore();
    }
  });
});
