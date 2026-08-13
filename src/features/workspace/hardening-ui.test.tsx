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

jest.setTimeout(10_000);

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

  const finishIntroduction = async (screen: Awaited<ReturnType<typeof render>>) => {
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await fireEvent.press(screen.getByRole("button", { name: "Get started" }));
  };

  const reachCoverStep = async (screen: Awaited<ReturnType<typeof render>>) => {
    await finishIntroduction(screen);
    await fireEvent.changeText(screen.getByLabelText("Your name"), "Asha");
    await fireEvent.changeText(screen.getByLabelText("Partner’s name"), "Dev");
    expect(screen.getByText("Asha", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("Dev", { includeHiddenElements: true })).toBeTruthy();
    expect(
      screen.getByTestId("names-artwork-your-name", { includeHiddenElements: true }).props.style,
    ).toEqual(expect.objectContaining({ left: "5%", top: "61%", width: "37%" }));
    expect(
      screen.getByTestId("names-artwork-partner-name", { includeHiddenElements: true }).props.style,
    ).toEqual(expect.objectContaining({ left: "58%", top: "61%", width: "37%" }));
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await fireEvent.press(screen.getByRole("button", { name: "Wedding date: Select date" }));
    await fireEvent(
      screen.getByTestId("date-picker"),
      "valueChange",
      undefined,
      new Date("2026-08-15T12:00:00"),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  };

  it("starts with three branded introduction slides before asking for details", async () => {
    const screen = await render(<LocalSetupScreen />);

    expect(screen.getByText("Mangalya")).toBeTruthy();
    expect(screen.getByText("Plan your wedding, together")).toBeTruthy();
    expect(screen.getByLabelText("Slide 1 of 3")).toBeTruthy();
    expect(screen.getByTestId("intro-dot-1").props.style.width).toBe(28);

    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByLabelText("Slide 2 of 3")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Get started" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Get started" }));

    expect(screen.getByText("Who’s getting married?")).toBeTruthy();
    expect(screen.getByLabelText("Your name").props.autoFocus).toBeFalsy();
    expect(screen.getAllByLabelText("required")).toHaveLength(2);
  });

  it("validates required names and retains them when navigating back", async () => {
    const screen = await render(<LocalSetupScreen />);
    await finishIntroduction(screen);

    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Enter your name.")).toBeTruthy();
    expect(screen.getByText("Enter your partner’s name.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Your name"), "Asha");
    await fireEvent.changeText(screen.getByLabelText("Partner’s name"), "Dev");
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByLabelText("Your name").props.value).toBe("Asha");
    expect(screen.getByLabelText("Partner’s name").props.value).toBe("Dev");
  });

  it("persists the completed onboarding values and safely adopts a staged wedding photo", async () => {
    const coverPhotoUri = "file:///documents/wedding-covers/selected.jpg";
    mockPickWeddingCoverPhoto.mockResolvedValue({ status: "selected", uri: coverPhotoUri });
    createWorkspaceMutateAsync.mockResolvedValue(undefined);
    const screen = await render(<LocalSetupScreen />);

    await reachCoverStep(screen);
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    await fireEvent.changeText(screen.getByLabelText("Target budget"), "1200000");
    expect(screen.getByLabelText("Target budget").props.value).toBe("12,00,000");
    expect(screen.getByText("₹12,00,000", { includeHiddenElements: true })).toBeTruthy();
    expect(
      screen.getByTestId("milestones-artwork-budget", { includeHiddenElements: true }).props.style,
    ).toEqual(expect.objectContaining({ left: "60%", top: "28%", width: "32%" }));
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await fireEvent.press(screen.getByRole("button", { name: "Choose wedding photo" }));
    await screen.findByLabelText("Wedding photo preview", { includeHiddenElements: true });
    expect(
      screen.getByTestId("wedding-photo-artwork-preview", { includeHiddenElements: true }).props
        .style,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ height: "49%", left: "25.5%", top: "20%", width: "49%" }),
      ]),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("1 selected")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Wedding" }).props.accessibilityState).toEqual({
      checked: true,
    });
    await fireEvent.press(screen.getByRole("checkbox", { name: "Mehendi" }));
    expect(
      screen.getByTestId("events-artwork-event-1", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(
      screen.getByTestId("events-artwork-event-2", { includeHiddenElements: true }),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Review my planner" }));
    expect(screen.getByText("Asha & Dev")).toBeTruthy();
    expect(screen.getByText("2 selected")).toBeTruthy();
    expect(screen.getByTestId("review-summary-grid")).toBeTruthy();
    expect(screen.getByTestId("review-build-footer").props.style.position).toBe("absolute");
    expect(
      screen.getByTestId("review-artwork-names", { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(
      screen.getByTestId("review-artwork-photo", { includeHiddenElements: true }),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Build my planner" }));

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
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/(tabs)"), {
      timeout: 6_000,
    });
    expect(createWorkspaceMutateAsync.mock.calls[0]?.[0].events).toHaveLength(2);

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

    await reachCoverStep(screen);
    await fireEvent.press(screen.getByRole("button", { name: "Choose wedding photo" }));
    await screen.findByLabelText("Wedding photo preview", { includeHiddenElements: true });
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

    await reachCoverStep(screen);
    await fireEvent.press(screen.getByRole("button", { name: "Choose wedding photo" }));
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(1));

    const actions = alert.mock.calls[0]?.[2];
    expect(actions?.map((action) => action.text)).toContain("Continue without photo");
    expect(screen.getByRole("button", { name: "Next" }).props.accessibilityState.disabled).toBe(
      false,
    );
    alert.mockRestore();
  });

  it("retains setup values and offers retry when workspace creation fails", async () => {
    createWorkspaceMutateAsync
      .mockRejectedValueOnce(new Error("Storage unavailable"))
      .mockResolvedValueOnce(undefined);
    const screen = await render(<LocalSetupScreen />);

    await reachCoverStep(screen);
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await fireEvent.press(screen.getByRole("button", { name: "Review my planner" }));
    await fireEvent.press(screen.getByRole("button", { name: "Build my planner" }));

    expect(await screen.findByText("We couldn’t finish your planner")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Back to review" }));
    expect(screen.getByText("Asha & Dev")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Build my planner" }));

    await waitFor(() => expect(createWorkspaceMutateAsync).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/(tabs)"), {
      timeout: 6_000,
    });
  });

  it("prevents duplicate workspace creation while submission is active", async () => {
    let resolveCreation: (() => void) | undefined;
    createWorkspaceMutateAsync.mockImplementation(
      () => new Promise<void>((resolve) => (resolveCreation = resolve)),
    );
    const screen = await render(<LocalSetupScreen />);

    await reachCoverStep(screen);
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    await fireEvent.press(screen.getByRole("button", { name: "Review my planner" }));
    const buildButton = screen.getByRole("button", { name: "Build my planner" });
    await fireEvent.press(buildButton);
    await fireEvent.press(buildButton);

    expect(createWorkspaceMutateAsync).toHaveBeenCalledTimes(1);
    resolveCreation?.();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/(tabs)"), {
      timeout: 6_000,
    });
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
