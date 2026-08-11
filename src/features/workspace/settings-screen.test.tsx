import { fireEvent, render, waitFor } from "@testing-library/react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Alert } from "react-native";
import * as ReactNative from "react-native";

import { WeddingSettingsDashboard } from "./settings/WeddingSettingsDashboard";
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

const mockUseDeleteWorkspaceMutation = jest.mocked(useDeleteWorkspaceMutation);
const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mockRouter = jest.mocked(router);
const mutateAsync = jest.fn();
const mutate = jest.fn();
const deleteMutate = jest.fn();
const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");
const mockConstants = Constants as unknown as {
  expoConfig: { extra: { appVariant: "development" | "preview" | "production" } };
};

describe("WeddingSettingsDashboard", () => {
  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
      mutate: deleteMutate,
    } as unknown as ReturnType<typeof useDeleteWorkspaceMutation>);
  });

  it("shows one Wedding details entry and a separate protected data section", async () => {
    const screen = await render(<WeddingSettingsDashboard />);

    expect(screen.queryByText(demoWorkspace.wedding.name)).toBeNull();
    expect(screen.getByRole("button", { name: "Wedding details" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wedding details" }).props.accessibilityHint).toBe(
      "Name, date, city and tradition",
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
    const screen = await render(<WeddingSettingsDashboard />);

    await fireEvent.press(screen.getByRole("button", { name: "Budget & expenses" }));

    expect(mockRouter.navigate).toHaveBeenCalledWith("/budget/overview");
  });

  it("edits only core wedding details while preserving hidden values", async () => {
    const updateWedding = jest.fn(async () => demoWorkspace);
    mutateAsync.mockImplementation(
      async (operation: (repositories: Repositories) => Promise<unknown>) =>
        operation({ wedding: { updateWedding } } as unknown as Repositories),
    );
    const screen = await render(<WeddingSettingsDashboard />);

    await fireEvent.press(screen.getByRole("button", { name: "Wedding details" }));

    expect(screen.getByTestId("settings-editor-sheet").props.accessibilityViewIsModal).toBe(true);

    expect(screen.getByLabelText("Couple or wedding name").props.value).toBe(
      demoWorkspace.wedding.name,
    );
    expect(screen.getByLabelText("City or location")).toBeTruthy();
    expect(screen.getByLabelText("Wedding style or tradition")).toBeTruthy();
    expect(screen.queryByLabelText("Guest estimate")).toBeNull();
    expect(screen.queryByLabelText("Budget target (₹)")).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("City or location"), "Bhubaneswar");
    await fireEvent.press(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() => expect(updateWedding).toHaveBeenCalledTimes(1));
    expect(updateWedding).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetTargetPaise: demoWorkspace.wedding.budgetTargetPaise,
        guestEstimate: demoWorkspace.wedding.guestEstimate,
        location: "Bhubaneswar",
      }),
    );
  });

  it("hides demo reset outside the development variant", async () => {
    mockConstants.expoConfig.extra.appVariant = "production";

    const screen = await render(<WeddingSettingsDashboard />);

    expect(screen.queryByRole("button", { name: "Reset demo data" })).toBeNull();
    expect(screen.getByRole("button", { name: "Delete local data" })).toBeTruthy();
  });

  it("protects unsaved editor changes when closing", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const screen = await render(<WeddingSettingsDashboard />);

    await fireEvent.press(screen.getByRole("button", { name: "Wedding details" }));
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
    const screen = await render(<WeddingSettingsDashboard />);

    await fireEvent.press(screen.getByRole("button", { name: "Delete local data" }));
    expect(screen.getByTestId("settings-delete-dialog").props.accessibilityViewIsModal).toBe(true);
    expect(screen.getByTestId("settings-delete-actions").props.style.flexDirection).toBe("column");

    const deleteButton = screen.getByRole("button", { name: "Delete data" });
    expect(deleteButton.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Confirmation"), "delete");
    expect(
      screen.getByRole("button", { name: "Delete data" }).props.accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Confirmation"), "DELETE");
    await fireEvent.press(screen.getByRole("button", { name: "Delete data" }));

    expect(deleteMutate).toHaveBeenCalledTimes(1);
  });
});
