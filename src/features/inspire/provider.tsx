import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createLocalInspirationRepository } from "./local-inspiration-store";
import { clearInspirationMedia } from "./media";
import type {
  CreateInspirationInput,
  Inspiration,
  InspirationCursor,
  InspirationListQuery,
  InspirationRepository,
  UpdateInspirationInput,
} from "./types";

const InspirationRepositoryContext = createContext<InspirationRepository | null>(null);

function queryIdentity(query: InspirationListQuery) {
  return {
    category: query.category,
    eventId: query.eventId,
    eventNames:
      query.search && query.eventNamesById
        ? Object.entries(query.eventNamesById).sort(([left], [right]) => left.localeCompare(right))
        : undefined,
    favouriteOnly: query.favouriteOnly || undefined,
    limit: query.limit,
    search: query.search?.trim() || undefined,
  };
}

export const inspirationQueryKeys = {
  all: ["local-inspirations"] as const,
  wedding: (weddingId: string) => ["local-inspirations", weddingId] as const,
  pages: (query: InspirationListQuery) =>
    ["local-inspirations", query.weddingId, "pages", queryIdentity(query)] as const,
  detail: (weddingId: string, id: string) =>
    ["local-inspirations", weddingId, "detail", id] as const,
};

export function InspirationRepositoryProvider({
  children,
  repository,
}: PropsWithChildren<{ repository?: InspirationRepository }>) {
  const value = useMemo(() => repository ?? createLocalInspirationRepository(), [repository]);

  return (
    <InspirationRepositoryContext.Provider value={value}>
      {children}
    </InspirationRepositoryContext.Provider>
  );
}

export function useInspirationRepository(): InspirationRepository {
  const repository = useContext(InspirationRepositoryContext);
  if (!repository) {
    throw new Error("Inspiration repository is unavailable outside InspirationRepositoryProvider.");
  }
  return repository;
}

export function useInspirationPages(query: InspirationListQuery) {
  const repository = useInspirationRepository();
  return useInfiniteQuery({
    queryKey: inspirationQueryKeys.pages(query),
    queryFn: ({ pageParam }) => repository.list({ ...query, cursor: pageParam }),
    initialPageParam: undefined as InspirationCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(query.weddingId),
  });
}

export function useInspiration(weddingId: string, id: string) {
  const repository = useInspirationRepository();
  return useQuery({
    queryKey: inspirationQueryKeys.detail(weddingId, id),
    queryFn: () => repository.get(weddingId, id),
    enabled: Boolean(weddingId && id),
  });
}

function useInvalidateWedding() {
  const queryClient = useQueryClient();
  return (weddingId: string) =>
    queryClient.invalidateQueries({ queryKey: inspirationQueryKeys.wedding(weddingId) });
}

export function useCreateInspirationMutation() {
  const repository = useInspirationRepository();
  const invalidateWedding = useInvalidateWedding();
  return useMutation({
    mutationFn: (input: CreateInspirationInput) => repository.create(input),
    onSuccess: (inspiration) => invalidateWedding(inspiration.weddingId),
  });
}

export function useUpdateInspirationMutation() {
  const repository = useInspirationRepository();
  const invalidateWedding = useInvalidateWedding();
  return useMutation({
    mutationFn: (input: UpdateInspirationInput) => repository.update(input),
    onSuccess: (inspiration) => invalidateWedding(inspiration.weddingId),
  });
}

export type SetInspirationFavouriteInput = {
  weddingId: string;
  id: string;
  isFavourite: boolean;
};

export function useSetInspirationFavouriteMutation() {
  const repository = useInspirationRepository();
  const invalidateWedding = useInvalidateWedding();
  return useMutation({
    mutationFn: ({ weddingId, id, isFavourite }: SetInspirationFavouriteInput) =>
      repository.setFavourite(weddingId, id, isFavourite),
    onSuccess: (inspiration) => invalidateWedding(inspiration.weddingId),
  });
}

export type DeleteInspirationInput = { weddingId: string; id: string };

export function useDeleteInspirationMutation() {
  const repository = useInspirationRepository();
  const invalidateWedding = useInvalidateWedding();
  return useMutation({
    mutationFn: ({ weddingId, id }: DeleteInspirationInput) => repository.delete(weddingId, id),
    onSuccess: (inspiration) => invalidateWedding(inspiration.weddingId),
  });
}

export function useRestoreInspirationMutation() {
  const repository = useInspirationRepository();
  const invalidateWedding = useInvalidateWedding();
  return useMutation({
    mutationFn: (inspiration: Inspiration) => repository.restore(inspiration),
    onSuccess: (inspiration) => invalidateWedding(inspiration.weddingId),
  });
}

export type UnlinkInspirationEventInput = { weddingId: string; eventId: string };

export function useUnlinkInspirationEventMutation() {
  const repository = useInspirationRepository();
  const invalidateWedding = useInvalidateWedding();
  return useMutation({
    mutationFn: ({ weddingId, eventId }: UnlinkInspirationEventInput) =>
      repository.unlinkEvent(weddingId, eventId),
    onSuccess: (_count, { weddingId }) => invalidateWedding(weddingId),
  });
}

export function useClearInspirationsMutation() {
  const repository = useInspirationRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const deleted = await repository.clear();
      return { deleted, mediaCleared: clearInspirationMedia() };
    },
    onSuccess: () => queryClient.removeQueries({ queryKey: inspirationQueryKeys.all }),
  });
}
