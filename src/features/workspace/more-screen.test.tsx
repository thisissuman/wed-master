import { fireEvent, render } from "@testing-library/react-native";
import { Alert } from "react-native";
import { router } from "expo-router";

import MoreScreen from "@/app/(app)/(tabs)/more/index";

import { useWorkspace } from "./provider";
import { demoWorkspace } from "./seed";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("./provider", () => ({
  useWorkspace: jest.fn(),
}));

const mockUseWorkspace = jest.mocked(useWorkspace);
const mockRouter = jest.mocked(router);

describe("MoreDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkspace.mockReturnValue({
      data: demoWorkspace,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useWorkspace>);
  });

  it("routes Planning to the live Plan workspace", async () => {
    const screen = await render(<MoreScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Planning" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/plan");
  });

  it("routes implemented destinations and keeps unfinished support honest", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const screen = await render(<MoreScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Open Settings" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/more/settings");

    await fireEvent.press(screen.getByRole("button", { name: "Support" }));
    expect(alert).toHaveBeenCalledWith(
      "Support",
      "Support is coming in a future Mangalya release.",
    );

    alert.mockRestore();
  });
});
