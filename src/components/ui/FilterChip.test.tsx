import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { tokens } from "@/theme";

import { FilterChip } from "./FilterChip";

describe("FilterChip", () => {
  it("exposes selection and count state while preserving press behavior", async () => {
    const onPress = jest.fn();
    const screen = await render(
      <FilterChip count={2} label="Filters" onPress={onPress} selected />,
    );

    const chip = screen.getByRole("button", { name: "Filters, 2 active" });
    expect(chip.props.accessibilityState.selected).toBe(true);
    expect(StyleSheet.flatten(screen.getByText("2").props.style)).toMatchObject({
      color: tokens.colors.primary,
      fontVariant: ["tabular-nums"],
    });

    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
