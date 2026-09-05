import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Alert } from "react-native";
import * as ReactNative from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useInspirationRepository } from "@/features/inspire/provider";
import { WeddingSettingsDashboard } from "./settings/WeddingSettingsDashboard";
import { appThemeStorageKey, resetAppThemeStoreForTests, useAppThemeStore } from "@/theme";
import { useDeleteWorkspaceMutation, useWorkspace, useWorkspaceMutation } from "./provider";
import { demoWorkspace } from "./seed";
import type { Repositories } from "./types";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { appVariant: "development" } },
  },
}));

jest.mock("./provider", () => ({
  useDeleteWorkspaceMutation: jest.fn(),
  useWorkspace: jest.fn(),
  useWorkspaceMutation: jest.fn(),
}));

jest.mock("@/features/inspire/provider", () => ({
  inspirationQueryKeys: { all: ["local-inspirations"] },
  useInspirationRepository: jest.fn(),
}));
jest.mock("@/features/inspire/demo-seed", () => ({ installDemoInspirationPack: jest.fn() }));
jest.mock("@/features/inspire/media", () => ({ clearInspirationMedia: jest.fn(() => true) }));
jest.mock("./files/workspace-files", () => ({
  clearWeddingCoverPhotos: jest.fn(() => true),
  clearWorkspaceAttachments: jest.fn(() => true),
  clearWorkspaceExports: jest.fn(() => true),
}));

const mockUseDeleteWorkspaceMutation = jest.mocked(useDeleteWorkspaceMutation);
const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mockUseInspirationRepository = jest.mocked(useInspirationRepository);
const mockRouter = jest.mocked(router);
const mutateAsync = jest.fn();
const mutate = jest.fn();
const deleteMutateAsync = jest.fn();
const clearInspirations = jest.fn();
const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");
const mockConstants = Constants as unknown as {
  expoConfig: { extra: { appVariant: "development" | "preview" | "production" } };
};

function renderSettings() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WeddingSettingsDashboard />
    </QueryClientProvider>,
  );
}

describe("WeddingSettingsDashboard", () => {
  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    resetAppThemeStoreForTests();
    useAppThemeStore.setState({ hasHydrated: true });
    mockConstants.expoConfig.extra.appVariant = "development";
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 411 });
    mockUseWorkspace.mockReturnValue({
      data: demoWorkspace,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
    mockUseWorkspaceMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutate,
      mutateAsync,
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
    mockUseDeleteWorkspaceMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: deleteMutateAsync,
    } as unknown as ReturnType<typeof useDeleteWorkspaceMutation>);
    mockUseInspirationRepository.mockReturnValue({
      clear: clearInspirations,
    } as unknown as ReturnType<typeof useInspirationRepository>);
    deleteMutateAsync.mockResolvedValue({ authoritative: true, residualKeys: [] });
    clearInspirations.mockResolvedValue([]);
  });

  it("shows one Wedding details entry and a separate protected data section", async () => {
    const screen = await renderSettings();

    expect(screen.queryByText(demoWorkspace.wedding.name)).toBeNull();
    expect(screen.getByRole("button", { name: "Wedding details" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wedding details" }).props.accessibilityHint).toBe(
      "Name, date, tradition and keepsake message",
    );
    expect(screen.queryByText("Currency")).toBeNull();
    expect(screen.queryByText("Event management")).toBeNull();
    expect(screen.queryByText("Guest estimate")).toBeNull();
    expect(screen.queryByText("Budget target")).toBeNull();
    expect(screen.getByRole("button", { name: "Budget & expenses" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Budget & expenses" }).props.accessibilityHint).toBe(
      "Target, trends, dates and category insights",
    );
    expect(
      screen.queryByText("Keep the essentials in one place. Spending insights live in Money."),
    ).toBeNull();
    expect(screen.getByText("Data & Privacy")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reset demo data/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Delete local data/ })).toBeTruthy();
  });

  it("opens the detailed budget overview from its separate settings entry", async () => {
    const screen = await renderSettings();

    await fireEvent.press(screen.getByRole("button", { name: "Budget & expenses" }));

    expect(mockRouter.navigate).toHaveBeenCalledWith("/budget/overview");
  });

  it("persists an accessible application theme choice", async () => {
    const screen = await renderSettings();

    const royalPlum = screen.getByRole("radio", { name: "Royal Plum" });
    const lavenderPearl = screen.getByRole("radio", { name: "Lavender Pearl" });
    await waitFor(() => {
      expect(royalPlum.props.accessibilityState.disabled).toBe(false);
    });
    expect(royalPlum.props.accessibilityState.checked).toBe(true);
    expect(lavenderPearl.props.accessibilityState.checked).toBe(false);

    await fireEvent.press(lavenderPearl);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(appThemeStorageKey, "lavenderPearl");
      expect(
        screen.getByRole("radio", { name: "Lavender Pearl" }).props.accessibilityState.checked,
      ).toBe(true);
    });
  });

  it("edits only core wedding details while preserving hidden values", async () => {
    const updateWedding = jest.fn(async () => demoWorkspace);
    mutateAsync.mockImplementation(
      async (operation: (repositories: Repositories) => Promise<unknown>) =>
        operation({ wedding: { updateWedding } } as unknown as Repositories),
    );
    const screen = await renderSettings();

    await fireEvent.press(screen.getByRole("button", { name: "Wedding details" }));

    expect(
      (await screen.findByTestId("settings-editor-sheet")).props.accessibilityViewIsModal,
    ).toBe(true);

    expect(screen.getByLabelText("Couple or wedding name").props.value).toBe(
      demoWorkspace.wedding.name,
    );
    expect(screen.getByLabelText("City or location")).toBeTruthy();
    expect(screen.getByLabelText("Wedding style or tradition")).toBeTruthy();
    expect(screen.getByLabelText("Keepsake message").props.value).toBe(
      demoWorkspace.wedding.keepsakeMessage,
    );
    expect(screen.queryByLabelText("Guest estimate")).toBeNull();
    expect(screen.queryByLabelText("Budget target (₹)")).toBeNull();

    const keepsakeMessage = "Hand in hand, through every beautiful chapter.";
    await fireEvent.changeText(screen.getByLabelText("City or location"), "Bhubaneswar");
    await fireEvent.changeText(screen.getByLabelText("Keepsake message"), keepsakeMessage);
    await fireEvent.press(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() => expect(updateWedding).toHaveBeenCalledTimes(1));
    expect(updateWedding).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetTargetPaise: demoWorkspace.wedding.budgetTargetPaise,
        guestEstimate: demoWorkspace.wedding.guestEstimate,
        keepsakeMessage,
        location: "Bhubaneswar",
      }),
    );
    await waitFor(() => expect(screen.queryByTestId("settings-editor-sheet")).toBeNull());
  });

  it("hides demo reset outside the development variant", async () => {
    mockConstants.expoConfig.extra.appVariant = "production";

    const screen = await renderSettings();

    expect(screen.queryByRole("button", { name: "Reset demo data" })).toBeNull();
    expect(screen.getByRole("button", { name: "Delete local data" })).toBeTruthy();
  });

  it("protects unsaved editor changes when closing", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const screen = await renderSettings();

    await fireEvent.press(screen.getByRole("button", { name: "Wedding details" }));
    await screen.findByTestId("settings-editor-sheet");
    await fireEvent.changeText(screen.getByLabelText("City or location"), "Bhubaneswar");
    await fireEvent.press(screen.getByRole("button", { name: "Close settings editor" }));

    expect(alert).toHaveBeenCalledWith(
      "Discard unsaved changes?",
      expect.stringContaining("have not been saved"),
      expect.any(Array),
    );
    alert.mockRestore();
  });

  it("requires exact DELETE confirmation and stacks actions for large text", async () => {
    useWindowDimensionsSpy.mockReturnValue({
      fontScale: 1.2999999,
      height: 800,
      scale: 2,
      width: 360,
    });
    const screen = await renderSettings();

    await fireEvent.press(screen.getByRole("button", { name: "Delete local data" }));
    expect(
      (await screen.findByTestId("settings-delete-dialog")).props.accessibilityViewIsModal,
    ).toBe(true);
    expect(screen.getByTestId("settings-delete-actions").props.style.flexDirection).toBe("column");

    const deleteButton = screen.getByRole("button", { name: "Delete data" });
    expect(deleteButton.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Confirmation"), "delete");
    expect(
      screen.getByRole("button", { name: "Delete data" }).props.accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Confirmation"), "DELETE");
    await fireEvent.press(screen.getByRole("button", { name: "Delete data" }));

    await waitFor(() => {
      expect(deleteMutateAsync).toHaveBeenCalledTimes(1);
      expect(clearInspirations).toHaveBeenCalledTimes(1);
      expect(mockRouter.replace).toHaveBeenCalledWith("/(onboarding)");
    });
    await waitFor(() => expect(screen.queryByTestId("settings-delete-dialog")).toBeNull());
  });
});
