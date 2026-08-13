import { Alert, Linking } from "react-native";
import * as ReactNative from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
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

  it("renders the reference sections, two focus tasks, and primary navigation actions", async () => {
    const screen = await render(<HomeDashboard />);

    expect(screen.getByText(demoWorkspace.wedding.name)).toBeTruthy();
    expect(screen.getByText("Focus today")).toBeTruthy();
    expect(screen.getByText("Budget overview")).toBeTruthy();
    expect(screen.getByText("Quick actions")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Focus today" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Budget overview" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Quick actions" })).toBeTruthy();
    expect(screen.getByTestId("wedding-hero")).toBeTruthy();
    expect(
      screen.queryByTestId("home-hearts-background", { includeHiddenElements: true }),
    ).toBeNull();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByText(demoWorkspace.wedding.location)).toBeNull();
    expect(screen.queryByRole("button", { name: "Add a task, expense, or event" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "View all" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith({
      params: { view: "tasks" },
      pathname: "/plan",
    });
    await fireEvent.press(screen.getByRole("button", { name: /Open Budget & expenses/ }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/budget/overview");
  });

  it("blurs Home while the same-size wedding card is centred", async () => {
    const screen = await render(<HomeDashboard />);

    await fireEvent.press(
      screen.getByRole("button", {
        name: `Wedding card for ${demoWorkspace.wedding.name}. Tap the card`,
      }),
    );

    expect(screen.getByTestId("home-scroll-view").props.style).toEqual({
      filter: [{ blur: 8 }],
    });

    await fireEvent.press(
      screen.getByTestId("wedding-keepsake-backdrop", { includeHiddenElements: true }),
    );
    expect(screen.getByTestId("home-scroll-view").props.style).toBeUndefined();
  });

  it("opens all direct quick actions without a duplicate expense FAB", async () => {
    const screen = await render(<HomeDashboard />);

    for (const [label, route] of [
      ["Add task", "/tasks/new"],
      ["Add expense", "/expenses/new"],
      ["Add event", "/events/new"],
      ["Add guest", "/more/guests/new"],
    ] as const) {
      await fireEvent.press(screen.getByRole("button", { name: label }));
      expect(mockRouter.navigate).toHaveBeenLastCalledWith(route);
    }

    expect(screen.getAllByRole("button", { name: "Add expense" })).toHaveLength(1);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it("reflows quick actions into two stable rows for large system text", async () => {
    useWindowDimensionsSpy.mockReturnValue({
      fontScale: 1.2999999,
      height: 800,
      scale: 2,
      width: 360,
    });

    const screen = await render(<HomeDashboard />);

    expect(screen.getAllByTestId(/home-quick-action-row-/)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Add (task|expense|event|guest)/ })).toHaveLength(
      4,
    );
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
    expect(screen.getByText("Nothing needs attention")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Add task" })).toHaveLength(1);
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
    const screen = await render(<HomeDashboard />);
    await fireEvent.press(
      screen.getByRole("checkbox", {
        name: /Mark complete: Confirm the final family transport/,
      }),
    );

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    const [, options] = mockMutate.mock.calls[0] as unknown as [unknown, { onSuccess: () => void }];
    options.onSuccess();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });
});
