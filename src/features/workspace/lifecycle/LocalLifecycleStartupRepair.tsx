import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { cleanupOrphanedInspirationMedia, clearInspirationMedia } from "@/features/inspire/media";
import { installDemoInspirationPack } from "@/features/inspire/demo-seed";
import { inspirationQueryKeys, useInspirationRepository } from "@/features/inspire/provider";
import type { InspirationRepository } from "@/features/inspire/types";

import {
  cleanupOrphanedWorkspaceFiles,
  clearWeddingCoverPhotos,
  clearWorkspaceAttachments,
  clearWorkspaceExports,
} from "../files/workspace-files";
import { emptyWorkspaceStorageKey } from "../local-repositories";
import { useWorkspace } from "../provider";
import type { WorkspaceSnapshot } from "../types";
import {
  clearPendingLocalCleanup,
  readPendingLocalCleanup,
  type LocalCleanupArea,
  writePendingLocalCleanup,
} from "./local-lifecycle";

export type StartupRepairReport = {
  failedAreas: LocalCleanupArea[];
  repairedEventLinks: number;
  removedInspirationFiles: number;
  removedWorkspaceFiles: number;
};

async function retryPendingCleanup(
  snapshot: WorkspaceSnapshot | undefined,
  inspirationRepository: InspirationRepository,
): Promise<LocalCleanupArea[]> {
  const pending = await readPendingLocalCleanup();
  if (!pending) return [];
  const failedAreas: LocalCleanupArea[] = [];
  const deletionTombstone =
    !snapshot && (await AsyncStorage.getItem(emptyWorkspaceStorageKey)) === "true";
  if (!pending.committed && !deletionTombstone) {
    // A prepared marker can survive a process crash either before or after the
    // authoritative mutation. Do not clear files while that outcome is
    // ambiguous; retain the marker and surface static areas for a later,
    // explicit lifecycle retry. A committed tombstone/marker is handled below.
    if (!pending.areas.length) await clearPendingLocalCleanup();
    return pending.areas;
  }
  let inspirationSnapshot: Awaited<ReturnType<InspirationRepository["snapshot"]>> | undefined;
  const workspaceReport = snapshot ? cleanupOrphanedWorkspaceFiles(snapshot) : undefined;

  for (const area of pending.areas) {
    try {
      switch (area) {
        case "workspace-attachments":
          if (snapshot) {
            if (workspaceReport?.failedAreas.includes("attachments")) {
              failedAreas.push(area);
            }
          } else if (!clearWorkspaceAttachments()) {
            failedAreas.push(area);
          }
          break;
        case "workspace-covers":
          if (snapshot) {
            if (workspaceReport?.failedAreas.includes("covers")) {
              failedAreas.push(area);
            }
          } else if (!clearWeddingCoverPhotos()) {
            failedAreas.push(area);
          }
          break;
        case "workspace-exports":
          if (snapshot) {
            if (workspaceReport?.failedAreas.includes("exports")) {
              failedAreas.push(area);
            }
          } else if (!clearWorkspaceExports()) {
            failedAreas.push(area);
          }
          break;
        case "inspire-records":
          await inspirationRepository.clear();
          break;
        case "inspire-media":
          if (snapshot) {
            inspirationSnapshot ??= await inspirationRepository.snapshot();
            const mediaReport = cleanupOrphanedInspirationMedia(inspirationSnapshot.inspirations);
            if (mediaReport.failed) failedAreas.push(area);
          } else if (!clearInspirationMedia()) {
            failedAreas.push(area);
          }
          break;
        case "inspire-event-links":
          if (snapshot) {
            await inspirationRepository.repairEventLinks(
              snapshot.wedding.id,
              snapshot.events.map(({ id }) => id),
            );
          }
          break;
        case "demo-inspiration":
          if (snapshot) {
            await installDemoInspirationPack(
              inspirationRepository,
              snapshot.wedding.id,
              snapshot.events,
            );
          }
          break;
      }
    } catch {
      failedAreas.push(area);
    }
  }

  if (failedAreas.length) {
    await writePendingLocalCleanup({ areas: [...new Set(failedAreas)], committed: true });
  } else {
    await clearPendingLocalCleanup();
  }
  return [...new Set(failedAreas)];
}

export async function repairLocalWorkspaceState(
  snapshot: WorkspaceSnapshot | undefined,
  inspirationRepository: InspirationRepository,
): Promise<StartupRepairReport> {
  const failedAreas: LocalCleanupArea[] = [];
  const pending = await readPendingLocalCleanup();
  const deletionTombstone =
    !snapshot && (await AsyncStorage.getItem(emptyWorkspaceStorageKey)) === "true";
  if (pending && !pending.committed && pending.areas.length && !deletionTombstone) {
    return {
      failedAreas: pending.areas,
      repairedEventLinks: 0,
      removedInspirationFiles: 0,
      removedWorkspaceFiles: 0,
    };
  }
  failedAreas.push(...(await retryPendingCleanup(snapshot, inspirationRepository)));
  let removedInspirationFiles = 0;
  let removedWorkspaceFiles = 0;
  let repairedEventLinks = 0;

  if (snapshot) {
    try {
      const inspirations = (await inspirationRepository.snapshot()).inspirations;
      const report = cleanupOrphanedInspirationMedia(inspirations);
      removedInspirationFiles = report.removed;
      if (report.failed) failedAreas.push("inspire-media");
    } catch {
      failedAreas.push("inspire-media");
    }

    const workspaceReport = cleanupOrphanedWorkspaceFiles(snapshot);
    removedWorkspaceFiles = workspaceReport.removedCount;
    for (const area of workspaceReport.failedAreas) {
      failedAreas.push(
        area === "attachments"
          ? "workspace-attachments"
          : area === "covers"
            ? "workspace-covers"
            : "workspace-exports",
      );
    }

    try {
      repairedEventLinks = await inspirationRepository.repairEventLinks(
        snapshot.wedding.id,
        snapshot.events.map(({ id }) => id),
      );
    } catch {
      failedAreas.push("inspire-event-links");
    }
  }

  return {
    failedAreas: [...new Set(failedAreas)],
    repairedEventLinks,
    removedInspirationFiles,
    removedWorkspaceFiles,
  };
}

export function LocalLifecycleStartupRepair() {
  const workspace = useWorkspace();
  const inspirationRepository = useInspirationRepository();
  const queryClient = useQueryClient();
  const repairedWeddingIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (workspace.isLoading) return;
    const repairKey = workspace.data?.wedding.id ?? "empty-workspace";
    if (repairedWeddingIdRef.current === repairKey) return;
    repairedWeddingIdRef.current = repairKey;
    let cancelled = false;
    void repairLocalWorkspaceState(workspace.data, inspirationRepository)
      .then((report) => {
        if (!cancelled && report.repairedEventLinks && workspace.data) {
          return queryClient.invalidateQueries({
            queryKey: inspirationQueryKeys.wedding(workspace.data.wedding.id),
          });
        }
        return undefined;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [inspirationRepository, queryClient, workspace.data, workspace.isLoading]);

  return null;
}
