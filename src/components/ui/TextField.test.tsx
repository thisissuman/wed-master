import { fireEvent, render } from "@testing-library/react-native";

import { appThemes, resetAppThemeStoreForTests, useAppThemeStore, type AppThemeId } from "@/theme";

import { TextField } from "./TextField";

describe("TextField", () => {
  beforeEach(() => resetAppThemeStoreForTests());

  it("uses a native focus shadow without adding the crashing dynamic shadow class", async () => {
    const screen = await render(<TextField label="Event name" />);
    const input = screen.getByLabelText("Event name");

    expect(input.props).toEqual(
      expect.objectContaining({
        cursorColor: appThemes.royalPlum.colors.primary,
        placeholderTextColor: appThemes.royalPlum.colors.textMuted,
        selectionColor: appThemes.royalPlum.colors.primarySoft,
        selectionHandleColor: appThemes.royalPlum.colors.primary,
      }),
    );

    await fireEvent(input, "focus");

    expect(input.parent?.props.className).toContain("border-primary");
    expect(input.parent?.props.className).not.toContain("shadow-card");
    expect(input.parent?.props.style).toEqual({ boxShadow: appThemes.royalPlum.elevation.focus });

    await fireEvent(input, "blur");

    expect(input.parent?.props.className).toContain("border-borderStrong");
    expect(input.parent?.props.style).toBeUndefined();
  });

  it.each<AppThemeId>(["royalPlum", "lavenderPearl"])(
    "keeps placeholder and selection colors semantic in %s",
    async (themeId) => {
      useAppThemeStore.setState({ themeId });
      const screen = await render(
        <TextField label="Task title" placeholder="Confirm photographer" />,
      );
      const input = screen.getByLabelText("Task title");

      expect(input.props).toEqual(
        expect.objectContaining({
          cursorColor: appThemes[themeId].colors.primary,
          placeholderTextColor: appThemes[themeId].colors.textMuted,
          selectionColor: appThemes[themeId].colors.primarySoft,
          selectionHandleColor: appThemes[themeId].colors.primary,
        }),
      );
    },
  );
});
