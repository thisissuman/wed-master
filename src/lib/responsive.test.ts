import {
  adaptiveTabBarConfig,
  isExpandedLayout,
  isLargeText,
  shouldStackCompactControls,
} from "./responsive";

describe("responsive layout contracts", () => {
  it("switches to expanded structure at 600dp", () => {
    expect(isExpandedLayout(599)).toBe(false);
    expect(isExpandedLayout(600)).toBe(true);
  });

  it("uses a phone navigation bar and an expanded navigation rail", () => {
    expect(adaptiveTabBarConfig(411)).toEqual({ position: "bottom", variant: "uikit" });
    expect(adaptiveTabBarConfig(800)).toEqual({ position: "left", variant: "material" });
  });

  it("treats 1.3 font scale as the named large-text threshold", () => {
    expect(isLargeText(1.3)).toBe(true);
    expect(isLargeText(1.2999999)).toBe(true);
    expect(isLargeText(1.29)).toBe(false);
  });

  it("stacks controls for narrow windows or large text", () => {
    expect(shouldStackCompactControls(360, 1)).toBe(true);
    expect(shouldStackCompactControls(411, 1.3)).toBe(true);
    expect(shouldStackCompactControls(411, 1)).toBe(false);
  });
});
