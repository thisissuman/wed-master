import { useCallback, useRef } from "react";

/**
 * Prevents a submission from starting again until the current promise settles.
 */
export function useSingleFlightSubmission<Arguments extends unknown[], Result>(
  submit: (...arguments_: Arguments) => Promise<Result>,
): (...arguments_: Arguments) => Promise<Result | undefined> {
  const inFlightRef = useRef(false);

  return useCallback(
    async (...arguments_: Arguments) => {
      if (inFlightRef.current) return undefined;
      inFlightRef.current = true;
      try {
        return await submit(...arguments_);
      } finally {
        inFlightRef.current = false;
      }
    },
    [submit],
  );
}
