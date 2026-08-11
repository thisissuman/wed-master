import { fireEvent, render } from "@testing-library/react-native";

import { SelectField } from "./SelectField";

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn() }));

describe("SelectField", () => {
  it("opens an accessible option sheet and reports the selected value", async () => {
    const onChange = jest.fn();
    const screen = await render(
      <SelectField
        label="Priority"
        onChange={onChange}
        options={[
          { label: "Low", value: "Low" },
          { label: "High", value: "High" },
        ]}
        value="Low"
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Priority: Low" }));
    await fireEvent.press(screen.getByRole("radio", { name: "High" }));

    expect(onChange).toHaveBeenCalledWith("High");
  });

  it("removes duplicate option headings in compact filter mode", async () => {
    const screen = await render(
      <SelectField
        compact
        label="Status"
        onChange={jest.fn()}
        options={[
          { label: "All statuses", value: "All" },
          { label: "Completed", value: "Completed" },
        ]}
        value="All"
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Status: All statuses" }));

    expect(screen.queryByText("Choose one option")).toBeNull();
    expect(screen.getByRole("radio", { name: "Completed" }).props.className).toContain("min-h-12");
  });
});
