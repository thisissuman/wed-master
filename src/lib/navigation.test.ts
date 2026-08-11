import { router } from "expo-router";

import {
  expenseCreationNavigationOptions,
  goBackOr,
  isRootTabPath,
  moreTabResetOptions,
} from "./navigation";
import { unstable_settings as moreStackSettings } from "@/app/(app)/(tabs)/more/_layout";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(),
    replace: jest.fn(),
  },
}));

const mockRouter = jest.mocked(router);

describe("navigation contracts", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the tab bar only on exact root destinations", () => {
    expect(["/", "/plan", "/budget", "/more"].every(isRootTabPath)).toBe(true);
    expect(isRootTabPath("/budget/overview")).toBe(false);
    expect(isRootTabPath("/more/settings")).toBe(false);
    expect(isRootTabPath("/tasks/task-1")).toBe(false);
    expect(isRootTabPath("/expenses/new")).toBe(false);
  });

  it("restores More to its root whenever the tab loses focus", () => {
    expect(moreStackSettings.initialRouteName).toBe("index");
    expect(moreTabResetOptions.popToTopOnBlur).toBe(true);
  });

  it("presents expense creation over the launching screen", () => {
    expect(expenseCreationNavigationOptions(false)).toEqual({
      animation: "fade",
      contentStyle: { backgroundColor: "transparent" },
      presentation: "transparentModal",
    });
    expect(expenseCreationNavigationOptions(true).animation).toBe("none");
  });

  it("uses a deterministic fallback for a deep link without back history", () => {
    mockRouter.canGoBack.mockReturnValue(false);

    goBackOr("/plan");

    expect(mockRouter.replace).toHaveBeenCalledWith("/plan");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("preserves normal back behavior when history exists", () => {
    mockRouter.canGoBack.mockReturnValue(true);

    goBackOr("/plan");

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
