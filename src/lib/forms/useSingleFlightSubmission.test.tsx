import { act, renderHook } from "@testing-library/react-native";

import { useSingleFlightSubmission } from "./useSingleFlightSubmission";

describe("useSingleFlightSubmission", () => {
  it("drops duplicate calls until the active submission settles", async () => {
    let resolveSubmission: (() => void) | undefined;
    const submit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmission = resolve;
        }),
    );
    const { result } = await renderHook(() => useSingleFlightSubmission(submit));

    let first: Promise<void | undefined> | undefined;
    let duplicate: Promise<void | undefined> | undefined;
    await act(() => {
      first = result.current();
      duplicate = result.current();
    });

    expect(submit).toHaveBeenCalledTimes(1);
    await expect(duplicate).resolves.toBeUndefined();

    await act(async () => {
      resolveSubmission?.();
      await first;
    });
    await act(async () => {
      const next = result.current();
      resolveSubmission?.();
      await next;
    });

    expect(submit).toHaveBeenCalledTimes(2);
  });
});
