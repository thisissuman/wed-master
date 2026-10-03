import { tokens } from "@/theme";

const fontScalePrecisionTolerance = 0.0001;
const navigationBorderWidth = 1;
const railHorizontalPadding = Number.parseInt(tokens.spacing["2xs"], 10);
const railItemWidth =
  tokens.navigation.railWidth - railHorizontalPadding * 2 - navigationBorderWidth * 2;
const navigationRailMinHeight = tokens.touchTarget * 7;

export function isExpandedLayout(width: number): boolean {
  return width >= tokens.layout.expandedWidth;
}

function hasNavigationRailSpace(width: number, height: number): boolean {
  return isExpandedLayout(width) && height >= navigationRailMinHeight;
}

export function adaptiveTabBarConfig(
  width: number,
  height = Number.POSITIVE_INFINITY,
): {
  position: "bottom" | "left";
  variant: "material" | "uikit";
} {
  return hasNavigationRailSpace(width, height)
    ? { position: "left", variant: "material" }
    : { position: "bottom", variant: "uikit" };
}

export function adaptiveTabBarItemStyle(width: number, height = Number.POSITIVE_INFINITY) {
  const base = {
    minHeight: tokens.touchTarget,
    minWidth: tokens.touchTarget,
  };

  return hasNavigationRailSpace(width, height)
    ? { ...base, alignSelf: "center" as const, flex: 1, width: railItemWidth }
    : base;
}

export function isLargeText(fontScale: number): boolean {
  return fontScale + fontScalePrecisionTolerance >= tokens.layout.largeTextScale;
}

export function shouldStackCompactControls(width: number, fontScale: number): boolean {
  return width < tokens.layout.sideBySideControlsMinWidth || isLargeText(fontScale);
}
