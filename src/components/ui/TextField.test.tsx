import { fireEvent, render } from "@testing-library/react-native";

import { tokens } from "@/theme";

import { TextField } from "./TextField";

describe("TextField", () => {
  it("uses a native focus shadow without adding the crashing dynamic shadow class", async () => {
    const screen = await render(<TextField label="Event name" />);
    const input = screen.getByLabelText("Event name");

    await fireEvent(input, "focus");

    expect(input.parent?.props.className).toContain("border-primary");
    expect(input.parent?.props.className).not.toContain("shadow-card");
    expect(input.parent?.props.style).toEqual({ boxShadow: tokens.elevation.focus });

    await fireEvent(input, "blur");

    expect(input.parent?.props.className).toContain("border-borderStrong");
    expect(input.parent?.props.style).toBeUndefined();
  });
});
