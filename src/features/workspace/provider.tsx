import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createLocalRepositories,
  WorkspaceCorruptionError,
  WorkspaceEmptyError,
} from "./local-repositories";
import type { Repositories, WorkspaceSnapshot } from "./types";

const RepositoryContext = createContext<Repositories | null>(null);
const workspaceKey = ["local-workspace"] as const;

export function RepositoryProvider({ children }: PropsWithChildren) {
  const repositories = useMemo(() => createLocalRepositories(), []);
  return <RepositoryContext.Provider value={repositories}>{children}</RepositoryContext.Provider>;
}

export function useRepositories() {
  const value = useContext(RepositoryContext);
  if (!value) throw new Error("Repositories are unavailable outside RepositoryProvider.");
  return value;
}
export function useWorkspace() {
  const repositories = useRepositories();
  return useQuery({
    queryKey: workspaceKey,
    queryFn: repositories.snapshot,
    retry: (failureCount, error) =>
      !(error instanceof WorkspaceEmptyError || error instanceof WorkspaceCorruptionError) &&
      failureCount < 2,
  });
}
export function useWorkspaceMutation() {
  const repositories = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (operation: (repositories: Repositories) => Promise<WorkspaceSnapshot>) =>
      operation(repositories),
    onSuccess: (snapshot) => client.setQueryData(workspaceKey, snapshot),
  });
}

export function useCreateExpenseMutation() {
  const repositories = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: repositories.expenses.createExpense,
    onSuccess: ({ snapshot }) => client.setQueryData(workspaceKey, snapshot),
  });
}

export function useCreateWorkspaceMutation() {
  const repositories = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: repositories.workspace.createSnapshot,
    onSuccess: (snapshot) => client.setQueryData(workspaceKey, snapshot),
  });
}

export function useDeleteWorkspaceMutation() {
  const repositories = useRepositories();
  const client = useQueryClient();
  return useMutation({
    mutationFn: repositories.workspace.deleteLocalData,
    onSuccess: () => client.removeQueries({ queryKey: workspaceKey }),
  });
}
