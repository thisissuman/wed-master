import { fireEvent, render } from "@testing-library/react-native";

import { AppBottomSheet } from "./AppBottomSheet";
import { AppText } from "./AppText";

describe("AppBottomSheet", () => {
  it("closes from Android Back, the backdrop, and its labelled close action", async () => {
    const onClose = jest.fn();
    const screen = await render(
      <AppBottomSheet onClose={onClose} title="Choose a ceremony" visible>
        <AppText>Options</AppText>
      </AppBottomSheet>,
    );

    screen.getByTestId("app-bottom-sheet-modal").props.onRequestClose();
    await fireEvent.press(
      screen.getByTestId("app-bottom-sheet-backdrop", { includeHiddenElements: true }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
