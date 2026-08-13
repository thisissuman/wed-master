import {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  SlideInUp,
  SlideOutDown,
} from "react-native-reanimated";

import { motionDurations } from "./index";

export const motionEasing = {
  enter: Easing.bezier(0.23, 1, 0.32, 1),
  exit: Easing.bezier(0.23, 1, 0.32, 1),
  feedback: Easing.bezier(0.23, 1, 0.32, 1),
  move: Easing.bezier(0.77, 0, 0.175, 1),
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

export const sheetEnteringTransition = SlideInUp.duration(motionDurations.entrance)
  .easing(motionEasing.enter)
  .reduceMotion(ReduceMotion.System);

export const sheetExitTransition = SlideOutDown.duration(motionDurations.exit)
  .easing(motionEasing.exit)
  .reduceMotion(ReduceMotion.System);

export const dialogEnteringTransition = FadeIn.duration(motionDurations.fast)
  .easing(motionEasing.enter)
  .reduceMotion(ReduceMotion.System);
