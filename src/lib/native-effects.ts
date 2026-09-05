/**
 * Runs a best-effort native side effect without allowing a synchronous native
 * bridge error or rejected promise to interrupt the user action that triggered it.
 */
export function runNonCriticalNativeEffect(effect: () => unknown): void {
  try {
    void Promise.resolve(effect()).catch(() => undefined);
  } catch {
    // Haptics and other decorative native effects must never fail the main action.
  }
}
