import rawTokens from "./tokens.json";

export const tokens = rawTokens;

export type ThemeMode = "light";

const duration = (value: string) => Number.parseInt(value, 10);

export const motionDurations = {
  press: duration(tokens.motion.press),
  entrance: duration(tokens.motion.entrance),
  exit: duration(tokens.motion.exit),
  fast: duration(tokens.motion.fast),
  state: duration(tokens.motion.state),
  tab: duration(tokens.motion.tab),
} as const;
