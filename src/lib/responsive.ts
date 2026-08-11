import { tokens } from "@/theme";

const fontScalePrecisionTolerance = 0.0001;

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

export function isLargeText(fontScale: number): boolean {
  return fontScale + fontScalePrecisionTolerance >= tokens.layout.largeTextScale;
}

export function shouldStackCompactControls(width: number, fontScale: number): boolean {
  return width < tokens.layout.sideBySideControlsMinWidth || isLargeText(fontScale);
}
