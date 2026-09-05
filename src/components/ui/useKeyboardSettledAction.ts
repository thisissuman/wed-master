import { useCallback, useEffect, useRef } from "react";
import { Keyboard, type EmitterSubscription } from "react-native";

const keyboardDismissFallbackMilliseconds = 500;

type PendingKeyboardAction = {
  subscription: EmitterSubscription;
  timeout: ReturnType<typeof setTimeout>;
};

export function useKeyboardSettledAction(action: () => void) {
  const actionRef = useRef(action);
  const pendingRef = useRef<PendingKeyboardAction | undefined>(undefined);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  const cancel = useCallback(() => {
    pendingRef.current?.subscription.remove();
    if (pendingRef.current) clearTimeout(pendingRef.current.timeout);
    pendingRef.current = undefined;
  }, []);

  useEffect(() => cancel, [cancel]);

  const run = useCallback(() => {
    if (pendingRef.current) return;
    if (!Keyboard.isVisible()) {
      actionRef.current();
      return;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancel();
      actionRef.current();
    };
    const subscription = Keyboard.addListener(
      process.env.EXPO_OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      finish,
    );
    const timeout = setTimeout(finish, keyboardDismissFallbackMilliseconds);
    pendingRef.current = { subscription, timeout };
    Keyboard.dismiss();
  }, [cancel]);

  return { cancel, run };
}
