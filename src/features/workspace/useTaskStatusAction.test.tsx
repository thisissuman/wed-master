import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { useFeedbackStore } from "@/features/feedback/feedback-store";

import { useWorkspaceMutation } from "./provider";
import { demoWorkspace } from "./seed";
import { useTaskStatusAction } from "./useTaskStatusAction";

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light" },
  impactAsync: jest.fn(),
}));
jest.mock("./provider", () => ({ useWorkspaceMutation: jest.fn() }));

const mockUseWorkspaceMutation = jest.mocked(useWorkspaceMutation);
const mutateAsync = jest.fn();
const updateTaskStatus = jest.fn();

describe("useTaskStatusAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeedbackStore.getState().dismiss();
    updateTaskStatus.mockResolvedValue(demoWorkspace);
    mutateAsync.mockImplementation(async (operation) =>
      operation({ tasks: { updateTaskStatus } } as never),
    );
    mockUseWorkspaceMutation.mockReturnValue({
      error: null,
      isError: false,
      isPending: false,
      mutateAsync,
    } as unknown as ReturnType<typeof useWorkspaceMutation>);
  });

  it("persists one rapid toggle, then offers a working Undo", async () => {
    let resolveUpdate: ((value: typeof demoWorkspace) => void) | undefined;
    updateTaskStatus.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    const task = demoWorkspace.tasks.find((item) => item.status !== "Completed")!;
    const { result } = await renderHook(() => useTaskStatusAction());

    await act(() => {
      result.current.toggleTaskStatus(task);
      result.current.toggleTaskStatus(task);
    });

    expect(updateTaskStatus).toHaveBeenCalledTimes(1);
    expect(updateTaskStatus).toHaveBeenCalledWith(task.id, "Completed");

    await act(async () => {
      resolveUpdate?.(demoWorkspace);
    });
    await waitFor(() =>
      expect(useFeedbackStore.getState().current).toEqual(
        expect.objectContaining({ actionLabel: "Undo", message: "Task completed" }),
      ),
    );
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);

    updateTaskStatus.mockResolvedValue(demoWorkspace);
    await act(async () => {
      await useFeedbackStore.getState().current?.onAction?.();
    });
    expect(updateTaskStatus).toHaveBeenLastCalledWith(task.id, task.status);
  });

  it("offers Retry after a failed persistence attempt", async () => {
    const task = demoWorkspace.tasks.find((item) => item.status !== "Completed")!;
    updateTaskStatus.mockRejectedValueOnce(new Error("private adapter detail"));
    const { result } = await renderHook(() => useTaskStatusAction());

    await act(() => result.current.toggleTaskStatus(task));

    await waitFor(() =>
      expect(useFeedbackStore.getState().current).toEqual(
        expect.objectContaining({
          actionLabel: "Retry",
          message: "Task update failed. Something went wrong. Please try again.",
        }),
      ),
    );

    updateTaskStatus.mockResolvedValue(demoWorkspace);
    await act(async () => {
      await useFeedbackStore.getState().current?.onAction?.();
    });
    expect(updateTaskStatus).toHaveBeenCalledTimes(2);
  });
});
