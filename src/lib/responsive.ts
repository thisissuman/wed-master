import { tokens } from "@/theme";

const fontScalePrecisionTolerance = 0.0001;
const navigationBorderWidth = 1;
const railHorizontalPadding = Number.parseInt(tokens.spacing["2xs"], 10);
const railItemWidth =
  tokens.navigation.railWidth - railHorizontalPadding * 2 - navigationBorderWidth * 2;

export function isExpandedLayout(width: number): boolean {
  return width >= tokens.layout.expandedWidth;
}

export function adaptiveTabBarConfig(width: number): {
  position: "bottom" | "left";
  variant: "material" | "uikit";
} {
  return isExpandedLayout(width)
    ? { position: "left", variant: "material" }
    : { position: "bottom", variant: "uikit" };
}

export function adaptiveTabBarItemStyle(width: number) {
  const base = {
    minHeight: tokens.touchTarget,
    minWidth: tokens.touchTarget,
  };

  return isExpandedLayout(width)
    ? { ...base, alignSelf: "center" as const, flex: 1, width: railItemWidth }
    : base;
}

export function isLargeText(fontScale: number): boolean {
  return fontScale + fontScalePrecisionTolerance >= tokens.layout.largeTextScale;
}

export function shouldStackCompactControls(width: number, fontScale: number): boolean {
  return width < tokens.layout.sideBySideControlsMinWidth || isLargeText(fontScale);
}
