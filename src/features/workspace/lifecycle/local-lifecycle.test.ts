import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  coordinateLocalLifecycle,
  pendingLocalCleanupStorageKey,
  readPendingLocalCleanup,
} from "./local-lifecycle";

describe("coordinateLocalLifecycle", () => {
  beforeEach(async () => {
    await AsyncStorage.removeItem(pendingLocalCleanupStorageKey);
  });
  afterEach(async () => {
    await AsyncStorage.removeItem(pendingLocalCleanupStorageKey);
  });

  it("does not start cleanup when the authoritative commit fails", async () => {
    const cleanup = jest.fn();

    await expect(
      coordinateLocalLifecycle(async () => {
        throw new Error("write failed");
      }, [{ area: "workspace-attachments", run: cleanup }]),
    ).rejects.toThrow("write failed");
    expect(cleanup).not.toHaveBeenCalled();
    await expect(readPendingLocalCleanup()).resolves.toBeUndefined();
  });

  it("reports every cleanup failure without changing the committed outcome", async () => {
    const outcome = await coordinateLocalLifecycle(
      async () => "committed-value",
      [
        { area: "workspace-attachments", run: () => false },
        {
          area: "workspace-covers",
          run: async () => {
            throw new Error("cleanup failed");
          },
        },
        { area: "workspace-exports", run: () => true },
      ],
    );

    expect(outcome).toEqual({
      cleanupFailures: ["workspace-attachments", "workspace-covers"],
      committed: true,
      value: "committed-value",
    });
  });

  it("is safe to retry idempotent cleanup after a partial failure or restart", async () => {
    let available = false;
    const run = jest.fn(() => available);

    const first = await coordinateLocalLifecycle(
      async () => "first",
      [{ area: "inspire-media", run }],
    );
    available = true;
    const retry = await coordinateLocalLifecycle(
      async () => "restart",
      [{ area: "inspire-media", run }],
    );

    expect(first.cleanupFailures).toEqual(["inspire-media"]);
    expect(retry.cleanupFailures).toEqual([]);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("leaves a committed cleanup marker for a later startup retry", async () => {
    await coordinateLocalLifecycle(
      async () => "committed",
      [{ area: "inspire-media", run: () => false }],
    );

    await expect(readPendingLocalCleanup()).resolves.toEqual({
      areas: ["inspire-media"],
      committed: true,
    });
  });

  it("serializes overlapping lifecycle commits and cleanup stages", async () => {
    let releaseFirst: (() => void) | undefined;
    const firstCommit = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let markFirstStarted: (() => void) | undefined;
    const firstStarted = new Promise<void>((resolve) => {
      markFirstStarted = resolve;
    });
    const order: string[] = [];
    const first = coordinateLocalLifecycle(async () => {
      order.push("first-commit");
      markFirstStarted?.();
      await firstCommit;
      return "first";
    }, [
      {
        area: "workspace-covers",
        run: () => {
          order.push("first-cleanup");
        },
      },
    ]);
    const second = coordinateLocalLifecycle(async () => {
      order.push("second-commit");
      return "second";
    }, [
      {
        area: "workspace-exports",
        run: () => {
          order.push("second-cleanup");
        },
      },
    ]);

    await firstStarted;
    expect(order).toEqual(["first-commit"]);
    releaseFirst?.();
    await expect(first).resolves.toMatchObject({ value: "first" });
    await expect(second).resolves.toMatchObject({ value: "second" });
    expect(order).toEqual(["first-commit", "first-cleanup", "second-commit", "second-cleanup"]);
  });
});
