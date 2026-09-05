import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import * as ReactNative from "react-native";

import { useWorkspace } from "@/features/workspace/provider";

import { InspireDashboard, inspirationBoardColumnCount } from "./InspireDashboard";
import { pickInspirationFromCamera, pickInspirationFromGallery } from "./media";
import {
  useDeleteInspirationMutation,
  useInspirationPages,
  useRestoreInspirationMutation,
  useSetInspirationFavouriteMutation,
} from "./provider";
import type { Inspiration } from "./types";

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn() },
}));

jest.mock("@/features/workspace/provider", () => ({
  useWorkspace: jest.fn(),
}));

jest.mock("./provider", () => ({
  useDeleteInspirationMutation: jest.fn(),
  useInspirationPages: jest.fn(),
  useRestoreInspirationMutation: jest.fn(),
  useSetInspirationFavouriteMutation: jest.fn(),
}));

jest.mock("./media", () => ({
  pickInspirationFromCamera: jest.fn(),
  pickInspirationFromGallery: jest.fn(),
  removeInspirationMedia: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseInspirationPages = jest.mocked(useInspirationPages);
const mockUseDeleteInspirationMutation = jest.mocked(useDeleteInspirationMutation);
const mockUseRestoreInspirationMutation = jest.mocked(useRestoreInspirationMutation);
const mockUseSetInspirationFavouriteMutation = jest.mocked(useSetInspirationFavouriteMutation);
const mockPickInspirationFromCamera = jest.mocked(pickInspirationFromCamera);
const mockPickInspirationFromGallery = jest.mocked(pickInspirationFromGallery);
const mockRouter = jest.mocked(router);
const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");

const inspiration: Inspiration = {
  id: "inspiration-1",
  weddingId: "wedding-1",
  category: "stage",
  sourceType: "gallery",
  media: {
    detailUri: "file:///detail.webp",
    detailWidth: 1_200,
    detailHeight: 1_800,
    detailSizeBytes: 100_000,
    thumbnailUri: "file:///thumbnail.webp",
    thumbnailWidth: 480,
    thumbnailHeight: 720,
    thumbnailSizeBytes: 20_000,
    mimeType: "image/webp",
  },
  title: "Lavender mandap",
  eventId: "event-1",
  isFavourite: true,
  createdAt: "2026-08-24T10:00:00.000Z",
  updatedAt: "2026-08-24T10:00:00.000Z",
};

function workspaceResult(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      wedding: { id: "wedding-1" },
      events: [{ id: "event-1", name: "Wedding" }],
    },
    error: null,
    isError: false,
    isLoading: false,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useWorkspace>;
}

function inspirationResult(overrides: Record<string, unknown> = {}) {
  return {
    data: { pages: [{ items: [inspiration] }] },
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useInspirationPages>;
}

describe("InspireDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 360 });
    mockUseWorkspace.mockReturnValue(workspaceResult());
    mockUseInspirationPages.mockReturnValue(inspirationResult());
    mockUseDeleteInspirationMutation.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useDeleteInspirationMutation>);
    mockUseRestoreInspirationMutation.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useRestoreInspirationMutation>);
    mockUseSetInspirationFavouriteMutation.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useSetInspirationFavouriteMutation>);
  });

  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  it.each([
    [360, 2],
    [600, 3],
    [840, 4],
  ])("uses a stable chronological masonry layout at %ipx", async (width, columns) => {
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 900, scale: 2, width });
    const screen = await render(<InspireDashboard />);
    const list = screen.getByTestId("inspiration-masonry-board");

    expect(inspirationBoardColumnCount(width)).toBe(columns);
    expect(list.props.masonry).toBe(true);
    expect(list.props.optimizeItemArrangement).toBe(false);
    expect(
      screen.getByRole("imagebutton", {
        name: "Lavender mandap, Stage, shortlisted, linked to Wedding",
      }),
    ).toBeTruthy();
  });

  it("combines inline search with one mutually exclusive board filter", async () => {
    const screen = await render(<InspireDashboard />);

    await fireEvent.press(screen.getByRole("button", { name: "Search inspiration" }));
    await fireEvent.changeText(screen.getByLabelText("Search inspiration"), "mandap");
    expect(mockUseInspirationPages).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "mandap" }),
    );

    await fireEvent.press(screen.getByRole("button", { name: "Favourites" }));
    expect(mockUseInspirationPages).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: undefined, favouriteOnly: true, search: "mandap" }),
    );

    await fireEvent.press(screen.getByRole("button", { name: "Décor" }));
    expect(mockUseInspirationPages).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: "decor", favouriteOnly: undefined, search: "mandap" }),
    );
  });

  it("shows feature-owned loading and workspace error states", async () => {
    mockUseWorkspace.mockReturnValue(workspaceResult({ data: undefined, isLoading: true }));
    const screen = await render(<InspireDashboard />);
    expect(screen.getByLabelText("Loading wedding inspiration").props.accessibilityRole).toBe(
      "progressbar",
    );

    mockUseWorkspace.mockReturnValue(
      workspaceResult({ data: undefined, error: new Error("Unreadable"), isError: true }),
    );
    await screen.rerender(<InspireDashboard />);
    expect(screen.getByText("We could not open Inspire")).toBeTruthy();
  });

  it("opens detail from a tile without replacing the root tab", async () => {
    const screen = await render(<InspireDashboard />);

    await fireEvent.press(
      screen.getByRole("imagebutton", {
        name: "Lavender mandap, Stage, shortlisted, linked to Wedding",
      }),
    );

    expect(mockRouter.navigate).toHaveBeenCalledWith("/inspire/inspiration-1");
  });

  it("renders the five bundled previews only for an empty unfiltered board", async () => {
    mockUseInspirationPages.mockReturnValue(
      inspirationResult({ data: { pages: [{ items: [] }] } }),
    );
    const screen = await render(<InspireDashboard />);

    expect(screen.getByTestId("inspiration-example-board")).toBeTruthy();
    expect(screen.getAllByRole("image")).toHaveLength(5);
  });

  it("closes the source dialog before launching one native picker request", async () => {
    let finishPicker: ((value: { status: "cancelled" }) => void) | undefined;
    mockPickInspirationFromGallery.mockReturnValueOnce(
      new Promise((resolve) => {
        finishPicker = resolve;
      }),
    );
    const screen = await render(<InspireDashboard />);

    await fireEvent.press(screen.getByRole("button", { name: "Add inspiration" }));
    const gallery = await screen.findByRole("button", { name: "Gallery" });
    await fireEvent.press(gallery);

    await waitFor(() => expect(screen.queryByRole("button", { name: "Gallery" })).toBeNull());
    await waitFor(() => expect(mockPickInspirationFromGallery).toHaveBeenCalledTimes(1));
    expect(mockPickInspirationFromCamera).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Add inspiration" }).props.accessibilityState,
    ).toEqual({ disabled: true });

    await act(async () => finishPicker?.({ status: "cancelled" }));
  });
});
