import { Alert, Linking } from "react-native";
import * as ReactNative from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { demoWorkspace } from "./seed";
import { pickWeddingCoverPhoto, removeWeddingCoverPhoto } from "./files/workspace-files";
import { HomeDashboard } from "./HomeDashboard";
import { useWorkspace, useWorkspaceMutation } from "./provider";

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn(), push: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light" },
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));
jest.mock("./provider", () => ({
  useWorkspace: jest.fn(),
  useWorkspaceMutation: jest.fn(),
}));
jest.mock("./files/workspace-files", () => ({
  pickWeddingCoverPhoto: jest.fn(),
  removeWeddingCoverPhoto: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mockPickWeddingCoverPhoto = jest.mocked(pickWeddingCoverPhoto);
const mockRemoveWeddingCoverPhoto = jest.mocked(removeWeddingCoverPhoto);
const mockRouter = jest.mocked(router);
const mockMutate = jest.fn();
const mockMutateAsync = jest.fn();
const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");

const mutationResult = () =>
  ({
    error: undefined,
    isError: false,
    isPending: false,
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
  }) as unknown as ReturnType<typeof useWorkspaceMutation>;

describe("HomeDashboard", () => {
  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 411 });
    mockUseWorkspace.mockReturnValue({
      data: structuredClone(demoWorkspace),
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
    mockUseWorkspaceMutation.mockImplementation(mutationResult);
    mockPickWeddingCoverPhoto.mockResolvedValue({ status: "cancelled" });
    mockMutateAsync.mockResolvedValue(demoWorkspace);
  });

  it("renders the core sections, two focus tasks, and primary navigation actions", async () => {
    const screen = await render(<HomeDashboard />);

    expect(screen.getByRole("header", { name: demoWorkspace.wedding.name })).toBeTruthy();
    expect(screen.getByText("Focus today")).toBeTruthy();
    expect(screen.getByText("Budget overview")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Focus today" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Budget overview" })).toBeTruthy();
    expect(screen.queryByRole("header", { name: "Quick actions" })).toBeNull();
    expect(screen.getByTestId("wedding-hero")).toBeTruthy();
    expect(
      screen.queryByTestId("home-hearts-background", { includeHiddenElements: true }),
    ).toBeNull();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByText(demoWorkspace.wedding.location)).toBeNull();
    expect(screen.queryByRole("button", { name: "Add a task, expense, or event" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "View all tasks" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith({
      params: { view: "tasks" },
      pathname: "/plan",
    });
    await fireEvent.press(screen.getByRole("button", { name: /Open Budget & expenses/ }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/budget/overview");
    expect(
      screen.getByRole("button", { name: /Open Budget & expenses/ }).props.accessibilityLabel,
    ).toContain("remaining");
    expect(
      screen.getByRole("button", { name: /Open Budget & expenses/ }).props.accessibilityLabel,
    ).not.toContain("pending");
  });

  it("blurs Home while the same-size wedding card is centred", async () => {
    const screen = await render(<HomeDashboard />);

    await fireEvent.press(
      screen.getByRole("button", { name: `Wedding card for ${demoWorkspace.wedding.name}` }),
    );

    expect(screen.getByTestId("home-scroll-view").props.style).toEqual({
      filter: [{ blur: 8 }],
    });

    await fireEvent.press(
      screen.getByTestId("wedding-keepsake-backdrop", { includeHiddenElements: true }),
    );
    expect(screen.getByTestId("home-scroll-view").props.style).toBeUndefined();
  });

  it("keeps one direct expense action without restoring the retired quick actions", async () => {
    const screen = await render(<HomeDashboard />);

    expect(screen.getAllByRole("button", { name: "Add expense" })).toHaveLength(1);
    expect(screen.getByTestId("home-add-expense-fab")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add task" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add event" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add guest" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Add expense" }));
    expect(mockRouter.navigate).toHaveBeenLastCalledWith("/expenses/new");
  });

  it("keeps the single expense action at large system text", async () => {
    useWindowDimensionsSpy.mockReturnValue({
      fontScale: 1.2999999,
      height: 800,
      scale: 2,
      width: 360,
    });

    const screen = await render(<HomeDashboard />);

    expect(screen.queryByTestId(/home-quick-action-row-/)).toBeNull();
    expect(screen.getAllByRole("button", { name: "Add expense" })).toHaveLength(1);
    expect(screen.getByTestId("home-add-expense-fab")).toBeTruthy();
  });

  it("does not expose unfinished global search", async () => {
    const screen = await render(<HomeDashboard />);

    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
  });

  it("does not persist anything when photo picking is cancelled", async () => {
    const screen = await render(<HomeDashboard />);
    await fireEvent.press(screen.getByRole("button", { name: "Add wedding cover photo" }));

    await waitFor(() => expect(mockPickWeddingCoverPhoto).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("renders an actionable empty next-actions state", async () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.tasks = [];
    mockUseWorkspace.mockReturnValue({
      data: snapshot,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);

    const screen = await render(<HomeDashboard />);
    expect(screen.getByText("No tasks yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add your first task" }));
    expect(mockRouter.navigate).toHaveBeenLastCalledWith("/tasks/new");
  });

  it("links completed-task empty state back to the full task list", async () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.tasks = snapshot.tasks.map((task) => ({ ...task, status: "Completed" }));
    mockUseWorkspace.mockReturnValue({
      data: snapshot,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);

    const screen = await render(<HomeDashboard />);
    expect(screen.getByText("All tasks are wrapped up")).toBeTruthy();
    const viewAllActions = screen.getAllByRole("button", { name: "View all tasks" });
    await fireEvent.press(viewAllActions[viewAllActions.length - 1]!);
    expect(mockRouter.navigate).toHaveBeenLastCalledWith({
      params: { view: "tasks" },
      pathname: "/plan",
    });
  });

  it("ignores duplicate cover-picker taps while the picker is open", async () => {
    mockPickWeddingCoverPhoto.mockImplementation(() => new Promise(() => undefined));
    const screen = await render(<HomeDashboard />);
    const button = screen.getByRole("button", { name: "Add wedding cover photo" });

    await fireEvent.press(button);
    await fireEvent.press(button);

    expect(mockPickWeddingCoverPhoto).toHaveBeenCalledTimes(1);
  });

  it("offers settings after photo permission is denied", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    mockPickWeddingCoverPhoto.mockResolvedValue({
      canAskAgain: false,
      status: "permission-denied",
    });
    const screen = await render(<HomeDashboard />);
    await fireEvent.press(screen.getByRole("button", { name: "Add wedding cover photo" }));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        "Photo access needed",
        expect.stringContaining("Open device settings"),
        expect.arrayContaining([expect.objectContaining({ text: "Open settings" })]),
      );
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
    const actions = alert.mock.calls[0]?.[2];
    actions?.find((action) => action.text === "Open settings")?.onPress?.();
    expect(openSettings).toHaveBeenCalledTimes(1);
    openSettings.mockRestore();
    alert.mockRestore();
  });

  it("persists a new cover before removing the previous file", async () => {
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.coverPhotoUri = "file:///old-cover.jpg";
    mockUseWorkspace.mockReturnValue({
      data: snapshot,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
    const updateWedding = jest.fn(async () => ({
      ...snapshot,
      wedding: { ...snapshot.wedding, coverPhotoUri: "file:///new-cover.jpg" },
    }));
    mockMutateAsync.mockImplementation(async (operation) =>
      operation({ wedding: { updateWedding } } as never),
    );
    mockPickWeddingCoverPhoto.mockResolvedValue({
      status: "selected",
      uri: "file:///new-cover.jpg",
    });
    const screen = await render(<HomeDashboard />);

    await fireEvent.press(screen.getByRole("button", { name: "Change wedding cover photo" }));

    await waitFor(() => {
      expect(updateWedding).toHaveBeenCalledWith({
        ...snapshot.wedding,
        coverPhotoUri: "file:///new-cover.jpg",
      });
      expect(mockRemoveWeddingCoverPhoto).toHaveBeenCalledWith("file:///old-cover.jpg");
      expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    });
    expect(updateWedding.mock.invocationCallOrder[0]).toBeLessThan(
      mockRemoveWeddingCoverPhoto.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("deletes the new copy and preserves the old URI when persistence fails", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const snapshot = structuredClone(demoWorkspace);
    snapshot.wedding.coverPhotoUri = "file:///old-cover.jpg";
    mockUseWorkspace.mockReturnValue({
      data: snapshot,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
    mockMutateAsync.mockRejectedValue(new Error("Write failed"));
    mockPickWeddingCoverPhoto.mockResolvedValue({
      status: "selected",
      uri: "file:///new-cover.jpg",
    });
    const screen = await render(<HomeDashboard />);

    await fireEvent.press(screen.getByRole("button", { name: "Change wedding cover photo" }));

    await waitFor(() => {
      expect(mockRemoveWeddingCoverPhoto).toHaveBeenCalledWith("file:///new-cover.jpg");
      expect(mockRemoveWeddingCoverPhoto).not.toHaveBeenCalledWith("file:///old-cover.jpg");
      expect(alert).toHaveBeenCalledWith(
        "Cover photo unchanged",
        expect.stringContaining("Something went wrong"),
      );
    });
    alert.mockRestore();
  });

  it("waits for task persistence before haptic feedback", async () => {
    let resolvePersistence: ((value: typeof demoWorkspace) => void) | undefined;
    mockMutateAsync.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePersistence = resolve;
        }),
    );
    const screen = await render(<HomeDashboard />);
    await fireEvent.press(
      screen.getByRole("checkbox", {
        name: /Mark complete: Confirm the final family transport/,
      }),
    );

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    await act(async () => resolvePersistence?.(demoWorkspace));
    await waitFor(() => expect(Haptics.impactAsync).toHaveBeenCalledTimes(1));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });
});
