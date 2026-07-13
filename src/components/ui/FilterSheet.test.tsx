import { fireEvent, render } from "@testing-library/react-native";

import { AppText } from "./AppText";
import { FilterSheet } from "./FilterSheet";

describe("FilterSheet", () => {
  it("offers one clear reset action for active filters", async () => {
    const onClear = jest.fn();
    const screen = await render(
      <FilterSheet onClear={onClear} onClose={jest.fn()} visible>
        <AppText>Task filters</AppText>
      </FilterSheet>,
    );

    fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
