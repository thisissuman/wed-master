import { act, render, waitFor } from "@testing-library/react-native";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { colorScheme, vars } from "nativewind";
import { Appearance, View } from "react-native";

import { AppThemeProvider } from "./AppThemeProvider";
import { appThemes, createThemeVariables } from "./app-theme";
import { resetAppThemeStoreForTests, useAppThemeStore } from "./app-theme-store";

jest.mock("expo-navigation-bar", () => ({ NavigationBar: jest.fn(() => null) }));
jest.mock("expo-status-bar", () => ({ StatusBar: jest.fn(() => null) }));
jest.mock("expo-system-ui", () => ({ setBackgroundColorAsync: jest.fn(() => Promise.resolve()) }));
jest.mock("nativewind", () => ({
  colorScheme: { set: jest.fn() },
  vars: jest.fn(() => ({})),
}));

const statusBarProps = () => {
  const calls = jest.mocked(StatusBar).mock.calls;
  return calls[calls.length - 1]?.[0];
};

const navigationBarProps = () => {
  const calls = jest.mocked(NavigationBar).mock.calls;
  return calls[calls.length - 1]?.[0];
};

describe("AppThemeProvider", () => {
  const appearance = jest.spyOn(Appearance, "setColorScheme").mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    resetAppThemeStoreForTests();
  });

  afterAll(() => appearance.mockRestore());

  it("synchronizes runtime variables and native chrome with the selected theme", async () => {
    const screen = await render(
      <AppThemeProvider>
        <View testID="content" />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(vars).toHaveBeenLastCalledWith(createThemeVariables(appThemes.royalPlum));
      expect(colorScheme.set).toHaveBeenLastCalledWith("dark");
      expect(appearance).toHaveBeenLastCalledWith("dark");
      expect(SystemUI.setBackgroundColorAsync).toHaveBeenLastCalledWith("#1D0B23");
      expect(statusBarProps()).toEqual(expect.objectContaining({ style: "light" }));
      expect(navigationBarProps()).toEqual(expect.objectContaining({ style: "light" }));
      expect(screen.getByTestId("app-theme-root").props.className).toContain("bg-canvas");
    });

    await act(async () => useAppThemeStore.setState({ themeId: "lavenderPearl" }));

    await waitFor(() => {
      expect(vars).toHaveBeenLastCalledWith(createThemeVariables(appThemes.lavenderPearl));
      expect(colorScheme.set).toHaveBeenLastCalledWith("light");
      expect(appearance).toHaveBeenLastCalledWith("light");
      expect(SystemUI.setBackgroundColorAsync).toHaveBeenLastCalledWith("#FFF8F2");
      expect(statusBarProps()).toEqual(expect.objectContaining({ style: "dark" }));
      expect(navigationBarProps()).toEqual(expect.objectContaining({ style: "dark" }));
    });
  });
});
