import { create } from "zustand";

export const feedbackPassiveDurationMilliseconds = 2_000;
export const feedbackActionDurationMilliseconds = 5_000;
/** Action-window compatibility alias used by delayed destructive cleanup. */
export const feedbackDurationMilliseconds = feedbackActionDurationMilliseconds;

export type FeedbackNotice = {
  actionLabel?: string;
  id: number;
  message: string;
  onAction?: () => Promise<unknown> | void;
  durationMilliseconds?: number;
};

type FeedbackState = {
  current?: FeedbackNotice;
  dismiss: () => void;
  show: (notice: Omit<FeedbackNotice, "id">) => void;
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  current: undefined,
  dismiss: () => set({ current: undefined }),
  show: (notice) => set({ current: { ...notice, id: Date.now() } }),
}));
