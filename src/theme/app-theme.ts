import rawPalettes from "./palettes.json";
import rawTokens from "./tokens.json";

export type AppThemeId = "lavenderPearl" | "royalPlum";
export type AppColorScheme = "dark" | "light";

type RawThemePalette = (typeof rawPalettes)[AppThemeId];

export type AppThemeColors = RawThemePalette["colors"];
export type AppThemeColorRole = keyof AppThemeColors;
export type AppThemeElevationRole = keyof RawThemePalette["shadowColors"];

export type AppThemeGradients = {
  avatarFallback: readonly [string, string, string];
  celebration: readonly [string, string, string];
  countdownGlass: readonly [string, string, string];
  formCanvas: readonly [string, string, string];
  homeProgress: readonly [string, string];
  primaryAction: readonly [string, string];
  screenTopFade: readonly [string, string, string];
  weddingNight: readonly [string, string, string];
};

export type AppThemeElevation = Record<AppThemeElevationRole, string>;

export type AppTheme = {
  colorScheme: AppColorScheme;
  colors: AppThemeColors;
  elevation: AppThemeElevation;
  gradients: AppThemeGradients;
  id: AppThemeId;
};

export const defaultAppThemeId: AppThemeId = "royalPlum";

const appThemeIds = ["royalPlum", "lavenderPearl"] as const;

export const isAppThemeId = (value: string | null): value is AppThemeId =>
  appThemeIds.some((themeId) => themeId === value);

const buildElevation = (palette: RawThemePalette): AppThemeElevation =>
  Object.fromEntries(
    Object.entries(rawTokens.elevationGeometry).map(([role, geometry]) => [
      role,
      `${geometry} ${palette.shadowColors[role as AppThemeElevationRole]}`,
    ]),
  ) as AppThemeElevation;

const buildTheme = (id: AppThemeId): AppTheme => {
  const palette = rawPalettes[id];

  return {
    colorScheme: palette.colorScheme as AppColorScheme,
    colors: palette.colors,
    elevation: buildElevation(palette),
    gradients: palette.gradients as unknown as AppThemeGradients,
    id,
  };
};

export const appThemes: Record<AppThemeId, AppTheme> = {
  lavenderPearl: buildTheme("lavenderPearl"),
  royalPlum: buildTheme("royalPlum"),
};

export const getAppTheme = (themeId?: string | null) =>
  appThemes[themeId && isAppThemeId(themeId) ? themeId : defaultAppThemeId];

export const cssVariableName = (group: "color" | "shadow", role: string) =>
  `--${group}-${role.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;

export const colorToCssChannels = (color: string) => {
  const hex = /^#([\da-f]{6})$/i.exec(color);
  if (hex) {
    const value = hex[1];
    return `${Number.parseInt(value.slice(0, 2), 16)} ${Number.parseInt(
      value.slice(2, 4),
      16,
    )} ${Number.parseInt(value.slice(4, 6), 16)}`;
  }

  const functional =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(color);
  if (functional) {
    const [, red, green, blue, alpha] = functional;
    return `${red} ${green} ${blue}${alpha === undefined ? "" : ` / ${alpha}`}`;
  }

  throw new Error(`Unsupported theme color: ${color}`);
};

export const createThemeVariables = (theme: AppTheme) => {
  const variables: Record<string, string> = {};

  for (const [role, color] of Object.entries(theme.colors)) {
    variables[cssVariableName("color", role)] = colorToCssChannels(color);
  }

  const palette = rawPalettes[theme.id];
  for (const [role, color] of Object.entries(palette.shadowColors)) {
    variables[cssVariableName("shadow", role)] = colorToCssChannels(color);
  }

  return variables;
};
