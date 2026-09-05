import { create } from "zustand";

import type { InspirationMediaDraft } from "./types";

type InspirationDraftState = {
  draft?: InspirationMediaDraft;
  clear: () => void;
  setDraft: (draft: InspirationMediaDraft) => void;
};

export const useInspirationDraftStore = create<InspirationDraftState>((set) => ({
  draft: undefined,
  clear: () => set({ draft: undefined }),
  setDraft: (draft) => set({ draft }),
}));
