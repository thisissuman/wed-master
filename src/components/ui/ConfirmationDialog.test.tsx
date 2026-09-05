import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { shouldStackCompactControls } from "@/lib/responsive";
import { ConfirmationDialog } from "./ConfirmationDialog";

jest.mock("@/lib/responsive", () => ({
  shouldStackCompactControls: jest.fn(),
}));

const mockShouldStackCompactControls = jest.mocked(shouldStackCompactControls);

describe("ConfirmationDialog", () => {
  beforeEach(() => {
    mockShouldStackCompactControls.mockReturnValue(false);
  });

  it("caps its panel width and keeps short actions side by side", async () => {
    const screen = await render(
      <ConfirmationDialog
        confirmLabel="Delete"
        description="This cannot be undone."
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        title="Delete inspiration?"
        visible
      />,
    );

    expect(StyleSheet.flatten(screen.getByTestId("confirmation-dialog-panel").props.style)).toEqual(
      expect.objectContaining({ maxWidth: 480 }),
    );
    expect(screen.getByTestId("confirmation-dialog-actions").props.style.flexDirection).toBe("row");
  });

  it("stacks actions on compact widths and protects pending work from Android Back", async () => {
    mockShouldStackCompactControls.mockReturnValue(true);
    const onCancel = jest.fn();
    const screen = await render(
      <ConfirmationDialog
        confirmLabel="Delete"
        description="This cannot be undone."
        onCancel={onCancel}
        onConfirm={jest.fn()}
        pending
        title="Delete inspiration?"
        visible
      />,
    );

    expect(screen.getByTestId("confirmation-dialog-actions").props.style.flexDirection).toBe(
      "column",
    );
    screen.getByTestId("confirmation-dialog-modal").props.onRequestClose();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
