import { create } from "zustand";

export type CreatedItemKind = "contact" | "event" | "expense" | "gift" | "household" | "task";

export type CreatedItemHighlight = {
  ids: string[];
  kind: CreatedItemKind;
  nonce: number;
};

type CreatedItemHighlightState = {
  clear: (nonce: number) => void;
  current?: CreatedItemHighlight;
  mark: (kind: CreatedItemKind, ids: string[]) => void;
};

let nextNonce = 0;

export const useCreatedItemHighlight = create<CreatedItemHighlightState>((set) => ({
  clear: (nonce) =>
    set((state) => (state.current?.nonce === nonce ? { current: undefined } : state)),
  mark: (kind, ids) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) return;
    nextNonce += 1;
    set({ current: { ids: uniqueIds, kind, nonce: nextNonce } });
  },
}));
