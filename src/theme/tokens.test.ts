import { appThemes, createThemeVariables, defaultAppThemeId, tokens, type AppTheme } from "./index";

const luminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex colour: ${hex}`);
  }
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

const textContrastPairs = (theme: AppTheme) =>
  [
    ["primary text", theme.colors.textPrimary, theme.colors.canvas],
    ["secondary text", theme.colors.textSecondary, theme.colors.canvas],
    ["muted text", theme.colors.textMuted, theme.colors.elevatedSurface],
    ["primary control", theme.colors.primary, theme.colors.canvas],
    ["selected control", theme.colors.primary, theme.colors.primarySoft],
    ["secondary accent", theme.colors.secondary, theme.colors.surface],
    ["accent state", theme.colors.accent, theme.colors.accentSoft],
    ["success state", theme.colors.success, theme.colors.successSoft],
    ["warning state", theme.colors.warning, theme.colors.warningSoft],
    ["danger state", theme.colors.danger, theme.colors.dangerSoft],
    ["information", theme.colors.info, theme.colors.canvas],
    ["night text", theme.colors.onNight, theme.colors.nightSurface],
    ["night secondary text", theme.colors.onNightMuted, theme.colors.nightSurface],
    ["night accent", theme.colors.nightAccent, theme.colors.nightSurface],
    ["navigation text", theme.colors.onNightMuted, theme.colors.navigationSurface],
    ["navigation accent", theme.colors.nightAccent, theme.colors.navigationSurface],
    ["action gradient start", theme.colors.onPrimary, theme.gradients.primaryAction[0]],
    ["action gradient end", theme.colors.onPrimary, theme.gradients.primaryAction[1]],
  ] as const;

describe("application theme palettes", () => {
  it("keeps Royal Plum as the fresh-install default", () => {
    expect(defaultAppThemeId).toBe("royalPlum");
    expect(appThemes.royalPlum.colorScheme).toBe("dark");
    expect(appThemes.lavenderPearl.colorScheme).toBe("light");
  });

  it("keeps static layout and Mangalya artwork primitives outside runtime palettes", () => {
    expect(tokens.brand).toEqual({
      bridalRed: "#C5163A",
      darkBridalRed: "#9E1230",
      deepPlum: "#28102F",
      elevatedIvory: "#FFFDFC",
      ivory: "#FFF8F2",
      lavender: "#A783C4",
      plum: "#4B174D",
      restrainedGold: "#D9AA58",
      softLavender: "#E9DFF0",
    });
    expect(tokens.touchTarget).toBeGreaterThanOrEqual(48);
  });

  it("uses the compact Manrope operational type scale", () => {
    expect(tokens.typography).toMatchObject({
      body: ["15px", { fontWeight: "500", lineHeight: "22px" }],
      caption: ["13px", { fontWeight: "500", lineHeight: "18px" }],
      display: ["28px", { fontWeight: "700", lineHeight: "34px" }],
      formTitle: ["24px", { fontWeight: "700", lineHeight: "30px" }],
      heading: ["16px", { fontWeight: "600", lineHeight: "21px" }],
      label: ["14px", { fontWeight: "600", lineHeight: "19px" }],
      title: ["20px", { fontWeight: "700", lineHeight: "26px" }],
    });
  });

  it("keeps both themes structurally interchangeable", () => {
    const lavender = appThemes.lavenderPearl;
    const royal = appThemes.royalPlum;

    expect(Object.keys(royal.colors).sort()).toEqual(Object.keys(lavender.colors).sort());
    expect(Object.keys(royal.gradients).sort()).toEqual(Object.keys(lavender.gradients).sort());
    expect(Object.keys(royal.elevation).sort()).toEqual(Object.keys(lavender.elevation).sort());
    for (const gradient of Object.values(royal.gradients)) {
      expect(gradient.length).toBeGreaterThanOrEqual(2);
    }
    for (const gradient of Object.values(lavender.gradients)) {
      expect(gradient.length).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(Object.entries(appThemes))(
    "keeps %s text and controls at WCAG AA contrast",
    (_, theme) => {
      for (const [label, foreground, background] of textContrastPairs(theme)) {
        expect({ label, ratio: contrast(foreground, background) }).toEqual({
          label,
          ratio: expect.any(Number),
        });
        expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it.each(Object.entries(appThemes))(
    "keeps %s strong borders and focus indicators distinguishable",
    (_, theme) => {
      expect(contrast(theme.colors.borderStrong, theme.colors.canvas)).toBeGreaterThanOrEqual(3);
      expect(contrast(theme.colors.focus, theme.colors.canvas)).toBeGreaterThanOrEqual(3);
      expect(contrast(theme.colors.focus, theme.colors.elevatedSurface)).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(Object.entries(appThemes))("creates complete NativeWind variables for %s", (_, theme) => {
    const variables = createThemeVariables(theme);

    expect(variables["--color-canvas"]).toBeDefined();
    expect(variables["--color-on-primary"]).toBeDefined();
    expect(variables["--shadow-card"]).toBeDefined();
    expect(Object.keys(variables)).toHaveLength(
      Object.keys(theme.colors).length + Object.keys(theme.elevation).length,
    );
  });
});
