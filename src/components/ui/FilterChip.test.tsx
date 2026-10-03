import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { appThemes } from "@/theme";

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
      color: appThemes.royalPlum.colors.textPrimary,
      fontVariant: ["tabular-nums"],
    });

    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("uses a visible check as the non-colour selected state for soft chips", async () => {
    const screen = await render(
      <FilterChip label="Décor" onPress={jest.fn()} selected variant="soft" />,
    );

    expect(screen.getByRole("button", { name: "Décor" }).props.accessibilityState.selected).toBe(
      true,
    );
    expect(
      screen.getByTestId("filter-chip-selection-mark", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText("Décor").props.style)).toMatchObject({
      color: appThemes.royalPlum.colors.primary,
    });
  });
});
