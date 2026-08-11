import {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  SlideInDown,
} from "react-native-reanimated";

import { motionDurations } from "./index";

export const motionEasing = {
  enter: Easing.out(Easing.cubic),
  exit: Easing.in(Easing.quad),
  feedback: Easing.out(Easing.quad),
} as const;

export const motionTiming = {
  entrance: {
    duration: motionDurations.entrance,
    easing: motionEasing.enter,
    reduceMotion: ReduceMotion.System,
  },
  exit: {
    duration: motionDurations.exit,
    easing: motionEasing.exit,
    reduceMotion: ReduceMotion.System,
  },
  fast: {
    duration: motionDurations.fast,
    easing: motionEasing.feedback,
    reduceMotion: ReduceMotion.System,
  },
  state: {
    duration: motionDurations.state,
    easing: motionEasing.enter,
    reduceMotion: ReduceMotion.System,
  },
} as const;

export const stateLayoutTransition = LinearTransition.duration(motionDurations.state)
  .easing(motionEasing.enter)
  .reduceMotion(ReduceMotion.System);

export const stateEnteringTransition = FadeIn.duration(motionDurations.state)
  .easing(motionEasing.enter)
  .reduceMotion(ReduceMotion.System);

export const exitTransition = FadeOut.duration(motionDurations.exit)
  .easing(motionEasing.exit)
  .reduceMotion(ReduceMotion.System);

export const sheetEnteringTransition = SlideInDown.duration(motionDurations.entrance)
  .easing(motionEasing.enter)
  .reduceMotion(ReduceMotion.System);
