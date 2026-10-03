import AsyncStorage from "@react-native-async-storage/async-storage";

export const localCleanupAreas = [
  "workspace-attachments",
  "workspace-covers",
  "workspace-exports",
  "inspire-records",
  "inspire-media",
  "inspire-event-links",
  "demo-inspiration",
] as const;

export type LocalCleanupArea = (typeof localCleanupAreas)[number];

export type LocalCleanupStage = {
  area: LocalCleanupArea;
  run: () => boolean | void | Promise<boolean | void>;
};

export type LocalLifecycleOutcome<T> = {
  cleanupFailures: LocalCleanupArea[];
  committed: true;
  value: T;
};

export const pendingLocalCleanupStorageKey = "@wed-master/local-lifecycle/pending-cleanup/v1";

export type PendingLocalCleanup = {
  areas: LocalCleanupArea[];
  committed: boolean;
};

const uniqueAreas = (areas: readonly LocalCleanupArea[]) => [...new Set(areas)];
let lifecycleQueue: Promise<void> = Promise.resolve();

export async function readPendingLocalCleanup(): Promise<PendingLocalCleanup | undefined> {
  try {
    const stored = await AsyncStorage.getItem(pendingLocalCleanupStorageKey);
    if (!stored) return undefined;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return undefined;
    const candidate = parsed as { areas?: unknown; committed?: unknown };
    if (typeof candidate.committed !== "boolean" || !Array.isArray(candidate.areas))
      return undefined;
    const areas = candidate.areas.filter(
      (area): area is LocalCleanupArea =>
        typeof area === "string" && (localCleanupAreas as readonly string[]).includes(area),
    );
    return { areas: uniqueAreas(areas), committed: candidate.committed };
  } catch {
    return undefined;
  }
}

export async function writePendingLocalCleanup(pending: PendingLocalCleanup): Promise<boolean> {
  try {
    await AsyncStorage.setItem(
      pendingLocalCleanupStorageKey,
      JSON.stringify({ areas: uniqueAreas(pending.areas), committed: pending.committed }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function clearPendingLocalCleanup(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(pendingLocalCleanupStorageKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Commits the authoritative structured mutation before attempting independent
 * cross-store or managed-file cleanup. A commit failure is thrown unchanged;
 * cleanup failures are returned as static area identifiers so callers never
 * expose local paths or user content.
 */
async function coordinateLocalLifecycleOnce<T>(
  commit: () => Promise<T>,
  cleanup: readonly LocalCleanupStage[],
): Promise<LocalLifecycleOutcome<T>> {
  const requestedAreas = uniqueAreas(cleanup.map(({ area }) => area));
  const previous = await readPendingLocalCleanup();
  const previousAreas = previous?.areas ?? [];
  const mergedAreas = uniqueAreas([...previousAreas, ...requestedAreas]);
  let markerWriteFailed = false;

  if (requestedAreas.length) {
    markerWriteFailed = !(await writePendingLocalCleanup({ areas: mergedAreas, committed: false }));
  }

  let value: T;
  try {
    value = await commit();
  } catch (error) {
    if (previous) await writePendingLocalCleanup(previous);
    else await clearPendingLocalCleanup();
    throw error;
  }

  if (requestedAreas.length) {
    markerWriteFailed =
      !(await writePendingLocalCleanup({ areas: mergedAreas, committed: true })) ||
      markerWriteFailed;
  }
  const cleanupFailures: LocalCleanupArea[] = [];

  for (const stage of cleanup) {
    try {
      const succeeded = await stage.run();
      if (succeeded === false) cleanupFailures.push(stage.area);
    } catch {
      cleanupFailures.push(stage.area);
    }
  }

  const requestedSet = new Set(requestedAreas);
  const untouchedPreviousAreas = previousAreas.filter((area) => !requestedSet.has(area));
  const remainingAreas = uniqueAreas([
    ...untouchedPreviousAreas,
    ...cleanupFailures,
    ...(markerWriteFailed ? requestedAreas : []),
  ]);
  if (remainingAreas.length) {
    await writePendingLocalCleanup({ areas: remainingAreas, committed: true });
  } else {
    await clearPendingLocalCleanup();
  }

  return {
    cleanupFailures: uniqueAreas([
      ...cleanupFailures,
      ...(markerWriteFailed ? requestedAreas : []),
    ]),
    committed: true,
    value,
  };
}

/**
 * Serialize replacement, reset, deletion, and import operations in this
 * process. The repository has its own storage queue, but lifecycle cleanup
 * spans several stores and managed-file directories that need one ordering.
 */
export function coordinateLocalLifecycle<T>(
  commit: () => Promise<T>,
  cleanup: readonly LocalCleanupStage[],
): Promise<LocalLifecycleOutcome<T>> {
  const run = lifecycleQueue.then(
    () => coordinateLocalLifecycleOnce(commit, cleanup),
    () => coordinateLocalLifecycleOnce(commit, cleanup),
  );
  lifecycleQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function cleanupSummary(areas: readonly LocalCleanupArea[]): string {
  const labels: Record<LocalCleanupArea, string> = {
    "workspace-attachments": "attachments",
    "workspace-covers": "cover photos",
    "workspace-exports": "exports",
    "inspire-records": "Inspire records",
    "inspire-media": "Inspire photos",
    "inspire-event-links": "Inspire event links",
    "demo-inspiration": "demo Inspire content",
  };
  return areas.map((area) => labels[area]).join(", ");
}
