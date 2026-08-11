import { fireEvent, render } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { router } from "expo-router";

import MoreScreen from "@/app/(app)/(tabs)/more/index";

import { useWorkspace } from "./provider";
import { demoWorkspace } from "./seed";

jest.mock("expo-router", () => ({
  router: {
    navigate: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock("./provider", () => ({
  useWorkspace: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockRouter = jest.mocked(router);
const useWindowDimensionsSpy = jest.spyOn(ReactNative, "useWindowDimensions");

const destinations = [
  ["Budget & expenses", "/budget/overview"],
  ["Settings", "/more/settings"],
  ["Guests", "/more/guests"],
  ["Gifts", "/more/gifts"],
  ["Backup & Export", "/more/backup"],
  ["Emergency Contacts", "/more/emergency-contacts"],
] as const;

describe("MoreDashboard", () => {
  afterAll(() => {
    useWindowDimensionsSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowDimensionsSpy.mockReturnValue({ fontScale: 1, height: 800, scale: 2, width: 411 });
    mockUseWorkspace.mockReturnValue({
      data: demoWorkspace,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
  });

  it("shows only implemented destinations", async () => {
    const screen = await render(<MoreScreen />);

    expect(screen.queryByText("Helpful tools and extra features")).toBeNull();
    expect(screen.queryByRole("button", { name: "Support" })).toBeNull();
    expect(screen.queryByText("About the App")).toBeNull();
    expect(screen.queryByText("Feedback")).toBeNull();
  });

  it("routes implemented destinations", async () => {
    const screen = await render(<MoreScreen />);

    for (const [title, route] of destinations) {
      const item = screen.getByRole("button", { name: `Open ${title}` });
      expect(item.props.accessibilityHint).toBeTruthy();
      await fireEvent.press(item);
      expect(mockRouter.navigate).toHaveBeenLastCalledWith(route);
    }
  });

  it("uses full-width feature rows for large system text", async () => {
    useWindowDimensionsSpy.mockReturnValue({
      fontScale: 1.2999999,
      height: 800,
      scale: 2,
      width: 360,
    });

    const screen = await render(<MoreScreen />);

    expect(screen.getAllByTestId(/more-feature-row-/)).toHaveLength(destinations.length);
    expect(screen.getAllByRole("button")).toHaveLength(destinations.length);
  });
});
