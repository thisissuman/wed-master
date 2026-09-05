import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  appThemeStorageKey,
  resetAppThemeStoreForTests,
  useAppThemeStore,
} from "./app-theme-store";

describe("application theme preference", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    resetAppThemeStoreForTests();
  });

  it("uses Royal Plum for a fresh installation", async () => {
    await useAppThemeStore.getState().hydrate();

    expect(useAppThemeStore.getState()).toEqual(
      expect.objectContaining({
        hasHydrated: true,
        isHydrating: false,
        themeId: "royalPlum",
      }),
    );
  });

  it("restores a saved Lavender Pearl preference from the existing storage key", async () => {
    await AsyncStorage.setItem(appThemeStorageKey, "lavenderPearl");

    await useAppThemeStore.getState().hydrate();

    expect(appThemeStorageKey).toBe("mangalya:wedding-card-theme:v1");
    expect(useAppThemeStore.getState().themeId).toBe("lavenderPearl");
  });

  it("falls back to Royal Plum for an unknown saved value", async () => {
    await AsyncStorage.setItem(appThemeStorageKey, "retiredTheme");

    await useAppThemeStore.getState().hydrate();

    expect(useAppThemeStore.getState().themeId).toBe("royalPlum");
  });

  it("switches optimistically and persists the selection", async () => {
    let finishSaving: (() => void) | undefined;
    jest
      .mocked(AsyncStorage.setItem)
      .mockImplementationOnce(() => new Promise<void>((resolve) => (finishSaving = resolve)));

    const selection = useAppThemeStore.getState().selectTheme("lavenderPearl");

    expect(useAppThemeStore.getState()).toEqual(
      expect.objectContaining({ isSaving: true, themeId: "lavenderPearl" }),
    );
    finishSaving?.();
    await selection;

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(appThemeStorageKey, "lavenderPearl");
    expect(useAppThemeStore.getState().isSaving).toBe(false);
  });

  it("prevents duplicate persistence requests while a selection is saving", async () => {
    let finishSaving: (() => void) | undefined;
    jest
      .mocked(AsyncStorage.setItem)
      .mockImplementationOnce(() => new Promise<void>((resolve) => (finishSaving = resolve)));

    const firstSelection = useAppThemeStore.getState().selectTheme("lavenderPearl");
    await useAppThemeStore.getState().selectTheme("royalPlum");

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(useAppThemeStore.getState().themeId).toBe("lavenderPearl");
    finishSaving?.();
    await firstSelection;
  });

  it("rolls back the whole application theme when persistence fails", async () => {
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error("Write failed"));

    await expect(useAppThemeStore.getState().selectTheme("lavenderPearl")).rejects.toThrow(
      "Write failed",
    );

    expect(useAppThemeStore.getState()).toEqual(
      expect.objectContaining({
        errorMessage: expect.stringContaining("previous theme"),
        isSaving: false,
        themeId: "royalPlum",
      }),
    );
  });
});
