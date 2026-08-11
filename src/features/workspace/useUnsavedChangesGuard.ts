import { router, useNavigation, type Href } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";

type UnsavedChangesGuardOptions = {
  isDirty: boolean;
  isSubmitting: boolean;
};

export function useUnsavedChangesGuard({ isDirty, isSubmitting }: UnsavedChangesGuardOptions) {
  const navigation = useNavigation();
  const allowNextNavigation = useRef(false);
  const promptOpen = useRef(false);

  const confirmDiscard = useCallback((proceed: () => void) => {
    if (promptOpen.current) return;
    promptOpen.current = true;
    Alert.alert("Discard unsaved changes?", "Your changes on this form have not been saved.", [
      {
        text: "Keep editing",
        style: "cancel",
        onPress: () => {
          promptOpen.current = false;
        },
      },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          promptOpen.current = false;
          allowNextNavigation.current = true;
          proceed();
        },
      },
    ]);
  }, []);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (allowNextNavigation.current) {
          allowNextNavigation.current = false;
          return;
        }
        if (!isDirty && !isSubmitting) return;
        event.preventDefault();
        if (isSubmitting) return;
        confirmDiscard(() => navigation.dispatch(event.data.action));
      }),
    [confirmDiscard, isDirty, isSubmitting, navigation],
  );

  const requestExit = useCallback(() => {
    if (isSubmitting) return;
    if (isDirty) {
      confirmDiscard(() => router.back());
      return;
    }
    router.back();
  }, [confirmDiscard, isDirty, isSubmitting]);

  const requestExitTo = useCallback(
    (href: Href) => {
      if (isSubmitting) return;
      const replace = () => {
        allowNextNavigation.current = true;
        router.replace(href);
      };
      if (isDirty) {
        confirmDiscard(replace);
        return;
      }
      replace();
    },
    [confirmDiscard, isDirty, isSubmitting],
  );

  const exitAfterSave = useCallback(() => {
    allowNextNavigation.current = true;
    router.back();
  }, []);

  const exitAfterSaveTo = useCallback((href: Href) => {
    allowNextNavigation.current = true;
    router.replace(href);
  }, []);

  return { exitAfterSave, exitAfterSaveTo, requestExit, requestExitTo };
}
