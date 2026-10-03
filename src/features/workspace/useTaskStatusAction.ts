import * as Haptics from "expo-haptics";
import { useCallback, useRef } from "react";

import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { toUserMessage } from "@/lib/errors";
import { runNonCriticalNativeEffect } from "@/lib/native-effects";

import { useWorkspaceMutation } from "./provider";
import type { Task } from "./types";

type TaskStatusAttempt = {
  nextStatus: Task["status"];
  previousStatus: Task["status"];
  taskId: string;
};

type UseTaskStatusActionOptions = {
  onPersisted?: () => void;
};

/**
 * Provides the one task-status interaction used across task surfaces. It
 * persists before feedback, suppresses rapid duplicate taps, and keeps the
 * original task available for Undo and Retry.
 */
export function useTaskStatusAction({ onPersisted }: UseTaskStatusActionOptions = {}) {
  const mutation = useWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const inFlightRef = useRef(false);

  const persist = useCallback(
    async ({ nextStatus, taskId }: TaskStatusAttempt) => {
      if (inFlightRef.current) return false;
      inFlightRef.current = true;
      try {
        await mutation.mutateAsync((repositories) =>
          repositories.tasks.updateTaskStatus(taskId, nextStatus),
        );
        onPersisted?.();
        runNonCriticalNativeEffect(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
        return true;
      } finally {
        inFlightRef.current = false;
      }
    },
    [mutation, onPersisted],
  );

  const runAttempt = useCallback(
    async (attempt: TaskStatusAttempt) => {
      try {
        const committed = await persist(attempt);
        if (!committed) return;

        const completed = attempt.nextStatus === "Completed";
        showFeedback({
          actionLabel: "Undo",
          message: completed ? "Task completed" : "Task reopened",
          onAction: async () => {
            const reverted = await persist({
              nextStatus: attempt.previousStatus,
              previousStatus: attempt.nextStatus,
              taskId: attempt.taskId,
            });
            if (!reverted) throw new Error("Task update is already in progress.");
          },
        });
      } catch (error) {
        showFeedback({
          actionLabel: "Retry",
          message: `Task update failed. ${toUserMessage(error)}`,
          onAction: async () => {
            const committed = await persist(attempt);
            if (!committed) throw new Error("Task update is already in progress.");
          },
        });
      }
    },
    [persist, showFeedback],
  );

  const toggleTaskStatus = useCallback(
    (task: Task) => {
      if (inFlightRef.current) return;
      void runAttempt({
        nextStatus: task.status === "Completed" ? "Not Started" : "Completed",
        previousStatus: task.status,
        taskId: task.id,
      });
    },
    [runAttempt],
  );

  return {
    error: mutation.error,
    isError: mutation.isError,
    isPending: mutation.isPending,
    toggleTaskStatus,
  };
}
