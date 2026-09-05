import { useEffect, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Pressable, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { useAppTheme } from "@/theme";

import {
  feedbackActionDurationMilliseconds,
  feedbackPassiveDurationMilliseconds,
  useFeedbackStore,
} from "./feedback-store";

export function FeedbackHost() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const current = useFeedbackStore((state) => state.current);
  const dismiss = useFeedbackStore((state) => state.dismiss);
  const show = useFeedbackStore((state) => state.show);
  const [pendingNoticeId, setPendingNoticeId] = useState<number>();

  useEffect(() => {
    if (!current) return;
    AccessibilityInfo.announceForAccessibility(current.message);
    const baseDuration =
      current.durationMilliseconds ??
      (current.actionLabel && current.onAction
        ? feedbackActionDurationMilliseconds
        : feedbackPassiveDurationMilliseconds);
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const scheduleDismissal = async () => {
      let duration = baseDuration;
      if (current.actionLabel && current.onAction) {
        try {
          const recommendedDuration =
            await AccessibilityInfo.getRecommendedTimeoutMillis(baseDuration);
          if (Number.isFinite(recommendedDuration) && recommendedDuration > 0) {
            duration = recommendedDuration;
          }
        } catch {
          // Accessibility timeout guidance is optional; retain the safe default.
        }
      }
      if (!cancelled) timeout = setTimeout(dismiss, duration);
    };
    void scheduleDismissal();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [current, dismiss]);

  if (!current) return null;
  const actionPending = pendingNoticeId === current.id;

  return (
    <View
      className="absolute inset-x-lg items-center"
      pointerEvents="box-none"
      style={{ bottom: insets.bottom + 82 }}
    >
      <Animated.View
        accessibilityLiveRegion="polite"
        className="max-w-[420px] flex-row items-center gap-sm rounded-control bg-nightSurface px-md py-xs shadow-floating"
        entering={reduceMotion ? undefined : FadeInUp.duration(180)}
        exiting={reduceMotion ? undefined : FadeOutDown.duration(140)}
      >
        <View accessible accessibilityRole="alert" className="min-w-0 flex-1">
          <AppText numberOfLines={2} tone="onNight" variant="label">
            {current.message}
          </AppText>
        </View>
        {current.actionLabel && current.onAction ? (
          <Pressable
            accessibilityLabel={current.actionLabel}
            accessibilityRole="button"
            accessibilityState={{ busy: actionPending, disabled: actionPending }}
            className="min-h-12 min-w-12 items-center justify-center rounded-control px-xs active:bg-nightSoft"
            disabled={actionPending}
            onPress={() => {
              setPendingNoticeId(current.id);
              void Promise.resolve(current.onAction?.())
                .then(dismiss)
                .catch((error) =>
                  show({ message: `${current.actionLabel} failed: ${toUserMessage(error)}` }),
                );
            }}
          >
            {actionPending ? (
              <ActivityIndicator color={theme.colors.onNight} />
            ) : (
              <AppText tone="nightAccent" variant="label">
                {current.actionLabel}
              </AppText>
            )}
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}
