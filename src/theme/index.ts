import rawTokens from "./tokens.json";

export const tokens = rawTokens;

export {
  appThemes,
  colorToCssChannels,
  createThemeVariables,
  cssVariableName,
  defaultAppThemeId,
  getAppTheme,
  isAppThemeId,
  type AppColorScheme,
  type AppTheme,
  type AppThemeColorRole,
  type AppThemeColors,
  type AppThemeElevation,
  type AppThemeElevationRole,
  type AppThemeGradients,
  type AppThemeId,
} from "./app-theme";
export {
  appThemeStorageKey,
  resetAppThemeStoreForTests,
  useAppTheme,
  useAppThemeStore,
} from "./app-theme-store";
export { AppThemeProvider } from "./AppThemeProvider";

const duration = (value: string) => Number.parseInt(value, 10);

export const motionDurations = {
  press: duration(tokens.motion.press),
  entrance: duration(tokens.motion.entrance),
  exit: duration(tokens.motion.exit),
  fast: duration(tokens.motion.fast),
  state: duration(tokens.motion.state),
  tab: duration(tokens.motion.tab),
} as const;
