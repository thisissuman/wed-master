import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import * as ReactNative from "react-native";
import { Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isLargeText } from "@/lib/responsive";

import { BackupDashboard } from "./backup/BackupDashboard";
import { EmergencyContactsDashboard } from "./contacts/EmergencyContactsDashboard";
import { EventDetailDashboard } from "./details/EventDetailDashboard";
import { TaskDetailDashboard } from "./details/TaskDetailDashboard";
import { GiftsDashboard } from "./gifts/GiftsDashboard";
import { GuestsDashboard } from "./guests/GuestsDashboard";
import { HouseholdDetail } from "./guests/HouseholdDetail";
import { pickWeddingCoverPhoto, removeWeddingCoverPhoto } from "./files/workspace-files";
import { useCreateWorkspaceMutation, useWorkspace, useWorkspaceMutation } from "./provider";
import { demoWorkspace } from "./seed";
import { LocalSetupScreen } from "./setup/LocalSetupScreen";
import type { WorkspaceSnapshot } from "./types";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
    navigate: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock("./provider", () => ({
  useCreateWorkspaceMutation: jest.fn(),
  useWorkspace: jest.fn(),
  useWorkspaceMutation: jest.fn(),
}));

jest.mock("./files/workspace-files", () => ({
  ...jest.requireActual("./files/workspace-files"),
  pickWeddingCoverPhoto: jest.fn(),
  removeWeddingCoverPhoto: jest.fn(),
}));

jest.mock("@/lib/responsive", () => ({
  ...jest.requireActual("@/lib/responsive"),
  isLargeText: jest.fn(),
}));

const mockRouter = jest.mocked(router);
const mockUseCreateWorkspaceMutation = jest.mocked(useCreateWorkspaceMutation);
const mockUseWorkspace = jest.mocked(useWorkspace);
const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mockPickWeddingCoverPhoto = jest.mocked(pickWeddingCoverPhoto);
const mockRemoveWeddingCoverPhoto = jest.mocked(removeWeddingCoverPhoto);
const mockIsLargeText = jest.mocked(isLargeText);
const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");
const createWorkspaceMutateAsync = jest.fn();
const safeAreaMetrics = {
  frame: { height: 800, width: 411, x: 0, y: 0 },
  insets: { bottom: 16, left: 0, right: 0, top: 24 },
};

function useSnapshot(snapshot: WorkspaceSnapshot) {
  mockUseWorkspace.mockReturnValue({
    data: snapshot,
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useWorkspace>);
}

describe("local beta UI hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createWorkspaceMutateAsync.mockReset();
    mockPickWeddingCoverPhoto.mockReset();
    mockRemoveWeddingCoverPhoto.mockReset();
    mockRouter.canGoBack.mockReturnValue(false);
    mockIsLargeText.mockReturnValue(false);
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 411 });
    mockUseWorkspaceMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
    mockUseCreateWorkspaceMutation.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: createWorkspaceMutateAsync,
    } as unknown as ReturnType<typeof useCreateWorkspaceMutation>);
  });

  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows one primary creation action on an empty gift screen", async () => {
    const empty = structuredClone(demoWorkspace);
    empty.gifts = [];
    useSnapshot(empty);

    const screen = await render(<GiftsDashboard />);
    expect(await screen.findAllByRole("button", { name: "Add gift" })).toHaveLength(1);
  });

  it("keeps gift sorting behind one compact control", async () => {
    useSnapshot(demoWorkspace);
    const screen = await render(<GiftsDashboard />);

    expect(screen.getByText("Received gifts")).toBeTruthy();
    expect(screen.getByTestId("received-gift-summary").props.style).toEqual({
      flexDirection: "row",
    });
    expect(screen.getByText("Rajesh & Priyadarshini Patnaik")).toBeTruthy();
    expect(screen.queryByText("Family elders")).toBeNull();
    expect(screen.queryByRole("tab", { name: "Given" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Received" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Return gifts" })).toBeNull();
    expect(screen.queryByText("Track gifts, values, thank-yous, and return gifts.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sort: Most recent" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Sort gifts, Most recent" }));
    await fireEvent.press(screen.getByRole("tab", { name: "Value" }));
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));

    expect(screen.getByRole("button", { name: "Sort gifts, Highest value" })).toBeTruthy();
  });

  it("stacks the compact received-gift summary for large text", async () => {
    mockIsLargeText.mockReturnValue(true);
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1.3, height: 800, scale: 2, width: 411 });
    useSnapshot(demoWorkspace);
    const screen = await render(<GiftsDashboard />);

    expect(screen.getByTestId("received-gift-summary").props.style).toEqual({
      flexDirection: "column",
    });
  });

  it("starts onboarding with truthful privacy copy and no forced keyboard focus", async () => {
    const screen = await render(<LocalSetupScreen />);

    expect(await screen.findByText("PRIVATE WORKSPACE")).toBeTruthy();
    expect(
      await screen.findByText(
        /Mangalya keeps this workspace on your device; you choose when to export a backup\./,
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText("Couple names").props.autoFocus).toBeFalsy();
    expect(screen.getAllByLabelText("required")).toHaveLength(2);
    expect(screen.getAllByText("Optional")).toHaveLength(2);
  });

  it("lets setup opt into editable suggested events without forcing customs", async () => {
    const screen = await render(<LocalSetupScreen />);

    expect(screen.getByText("1 selected · dates can be changed later")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Choose events" }));
    expect(
      (await screen.findByRole("checkbox", { name: "Wedding, Wedding day" })).props
        .accessibilityState,
    ).toEqual({ checked: true });
    await fireEvent.press(screen.getByRole("button", { name: "Select all" }));
    await fireEvent.press(screen.getByRole("button", { name: "Use selected events" }));

    expect(screen.getByText("7 selected · dates can be changed later")).toBeTruthy();
  });

  it("persists the essential setup fields and safely adopts a staged wedding photo", async () => {
    const coverPhotoUri = "file:///documents/wedding-covers/selected.jpg";
    mockPickWeddingCoverPhoto.mockResolvedValue({ status: "selected", uri: coverPhotoUri });
    createWorkspaceMutateAsync.mockResolvedValue(undefined);
    const screen = await render(<LocalSetupScreen />);

    await fireEvent.changeText(screen.getByLabelText("Couple names"), "Asha & Dev");
    await fireEvent.press(screen.getByRole("button", { name: "Wedding date: Select date" }));
    await fireEvent(
      screen.getByTestId("date-picker"),
      "valueChange",
      undefined,
      new Date("2026-08-15T12:00:00"),
    );
    await fireEvent.changeText(screen.getByLabelText("Budget target in ₹"), "1200000");
    await fireEvent.press(screen.getByRole("button", { name: "Choose wedding photo" }));
    await screen.findByLabelText("Wedding photo preview");
    await fireEvent.press(screen.getByRole("button", { name: "Create private workspace" }));

    await waitFor(() => expect(createWorkspaceMutateAsync).toHaveBeenCalledTimes(1));
    expect(createWorkspaceMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 4,
        wedding: expect.objectContaining({
          budgetTargetPaise: 120_000_000,
          coverPhotoUri,
          currency: "INR",
          date: "2026-08-15",
          location: "To be decided",
          name: "Asha & Dev",
          type: "Not specified",
        }),
      }),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/(tabs)");

    await screen.unmount();
    expect(mockRemoveWeddingCoverPhoto).not.toHaveBeenCalled();
  });

  it("removes replaced and abandoned staged setup photos", async () => {
    const firstPhoto = "file:///documents/wedding-covers/first.jpg";
    const secondPhoto = "file:///documents/wedding-covers/second.jpg";
    mockPickWeddingCoverPhoto
      .mockResolvedValueOnce({ status: "selected", uri: firstPhoto })
      .mockResolvedValueOnce({ status: "selected", uri: secondPhoto });
    const screen = await render(<LocalSetupScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Choose wedding photo" }));
    await screen.findByLabelText("Wedding photo preview");
    await fireEvent.press(screen.getByRole("button", { name: "Change wedding photo" }));

    await waitFor(() => expect(mockRemoveWeddingCoverPhoto).toHaveBeenCalledWith(firstPhoto));
    await screen.unmount();
    expect(mockRemoveWeddingCoverPhoto).toHaveBeenCalledWith(secondPhoto);
  });

  it("keeps setup usable when wedding-photo permission is denied", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    mockPickWeddingCoverPhoto.mockResolvedValue({
      canAskAgain: false,
      status: "permission-denied",
    });
    const screen = await render(<LocalSetupScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Choose wedding photo" }));
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));

    const actions = alert.mock.calls[0]?.[2];
    expect(actions?.map((action) => action.text)).toContain("Continue without photo");
    expect(
      screen.getByRole("button", { name: "Create private workspace" }).props.accessibilityState
        .disabled,
    ).toBe(false);
    alert.mockRestore();
  });

  it("keeps event detail compact and uses tasks instead of required-item counters", async () => {
    useSnapshot(demoWorkspace);
    const screen = await render(<EventDetailDashboard eventId="event-mehendi" />);

    expect(screen.getByText("Preparation progress")).toBeTruthy();
    expect(screen.getByText("Related tasks")).toBeTruthy();
    expect(screen.getByText("Linked expenses")).toBeTruthy();
    expect(screen.queryByText("Required items")).toBeNull();
    expect(screen.queryByText("Manage")).toBeNull();
  });

  it("removes checklist, attachments, and More Actions from task detail", async () => {
    useSnapshot(demoWorkspace);
    const screen = await render(<TaskDetailDashboard taskId="task-1" />);

    expect(screen.getByText("Confirm catering menu")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(screen.queryByText("Checklist")).toBeNull();
    expect(screen.queryByText("Notes & attachments")).toBeNull();
    expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
  });

  it("shows one primary creation action on an empty contact screen", async () => {
    const empty = structuredClone(demoWorkspace);
    empty.emergencyContacts = [];
    useSnapshot(empty);

    const screen = await render(<EmergencyContactsDashboard />);
    expect(await screen.findAllByRole("button", { name: "Add contact" })).toHaveLength(1);
    expect(screen.queryByText("Important numbers at your fingertips")).toBeNull();
  });

  it("shows one primary creation action on an empty guest screen", async () => {
    const empty = structuredClone(demoWorkspace);
    empty.households = [];
    useSnapshot(empty);

    const screen = await render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <GuestsDashboard />
      </SafeAreaProvider>,
    );
    expect(await screen.findAllByRole("button", { name: "Add guest or household" })).toHaveLength(
      1,
    );
    expect(screen.queryByRole("button", { name: "Add household" })).toBeNull();
  });

  it("uses name-only guest search, compact metrics, and the persistent guest FAB", async () => {
    useSnapshot(demoWorkspace);
    const screen = await render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <GuestsDashboard />
      </SafeAreaProvider>,
    );

    expect(screen.getByLabelText("Households, 3")).toBeTruthy();
    expect(screen.getByLabelText("Invited, 7")).toBeTruthy();
    expect(screen.getByLabelText("Confirmed, 2")).toBeTruthy();
    expect(screen.queryByText("RSVP")).toBeNull();
    expect(screen.queryByText("Wedding side")).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Search by name"), "Friends");
    await waitFor(() => expect(screen.getByText("Friends Group")).toBeTruthy());
    expect(screen.queryByText("Patnaik Family")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Add guest or household" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/more/guests/new");
  });

  it("recovers invalid household links through the guest-list fallback", async () => {
    mockRouter.canGoBack.mockReturnValue(true);
    useSnapshot(demoWorkspace);
    const screen = await render(<HouseholdDetail householdId="missing-household" />);

    expect(await screen.findByText("Household not found")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Go back" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/more/guests");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("stacks the compact guest summary for large text", async () => {
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1.3, height: 800, scale: 2, width: 411 });
    useSnapshot(demoWorkspace);
    const screen = await render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <GuestsDashboard />
      </SafeAreaProvider>,
    );

    expect(await screen.findByTestId("guest-summary-strip-stacked")).toBeTruthy();
    expect(screen.queryByTestId("guest-summary-strip-inline")).toBeNull();
  });

  it("keeps backup and export focused on the three useful actions", async () => {
    useSnapshot(demoWorkspace);
    const screen = await render(<BackupDashboard />);

    expect(screen.getByRole("button", { name: "Export data backup" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Import backup" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export expenses CSV" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Share backup" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Export tasks CSV" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Export guests CSV" })).toBeNull();
    expect(screen.queryByText("Protect your wedding data and share it safely")).toBeNull();
    expect(screen.queryByTestId("backup-hero")).toBeNull();
  });
});
