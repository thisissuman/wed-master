import { tokens } from "./index";

const luminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  if (!channels || channels.length !== 3)
    throw new Error(`Expected a six-digit hex colour: ${hex}`);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (foreground: string, background: string) => {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
};

describe("light lavender theme", () => {
  it.each([
    ["primary text", tokens.colors.textPrimary, tokens.colors.canvas],
    ["secondary text", tokens.colors.textSecondary, tokens.colors.canvas],
    ["muted text", tokens.colors.textMuted, tokens.colors.elevatedSurface],
    ["primary action", tokens.colors.primary, tokens.colors.canvas],
    ["primary soft state", tokens.colors.primary, tokens.colors.primarySoft],
    ["success state", tokens.colors.success, tokens.colors.successSoft],
    ["warning state", tokens.colors.warning, tokens.colors.warningSoft],
    ["danger state", tokens.colors.danger, tokens.colors.dangerSoft],
    ["gradient action start", tokens.colors.onPrimary, tokens.gradients.primaryAction[0]],
    ["gradient action end", tokens.colors.onPrimary, tokens.gradients.primaryAction[1]],
  ])("keeps %s at WCAG AA contrast", (_label, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the Android-first touch target at 48dp", () => {
    expect(tokens.touchTarget).toBeGreaterThanOrEqual(48);
  });
});
