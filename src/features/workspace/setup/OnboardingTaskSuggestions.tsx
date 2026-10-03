import * as Haptics from "expo-haptics";
import Check from "lucide-react-native/icons/check";
import ListChecks from "lucide-react-native/icons/list-checks";
import { View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { MotionPressable } from "@/components/ui";
import { formatShortDateOnly } from "@/lib/dates";
import { runNonCriticalNativeEffect } from "@/lib/native-effects";

import { suggestedTaskDefinitions, suggestedTaskDueDate } from "../task-suggestions";
import type { ISODate, StarterTaskKey } from "../types";
import { OnboardingText } from "./OnboardingPrimitives";
import { onboardingTheme as theme } from "./onboarding-theme";

export function OnboardingTaskSuggestions({
  onChange,
  reduceMotion,
  selectedKeys,
  today,
  weddingDate,
}: {
  onChange: (keys: StarterTaskKey[]) => void;
  reduceMotion: boolean;
  selectedKeys: readonly StarterTaskKey[];
  today: ISODate;
  weddingDate: ISODate;
}) {
  const selected = new Set(selectedKeys);
  const allSelected = suggestedTaskDefinitions.every((task) => selected.has(task.key));

  const toggleTask = (key: StarterTaskKey) => {
    onChange(
      selected.has(key)
        ? selectedKeys.filter((candidate) => candidate !== key)
        : [...selectedKeys, key],
    );
    runNonCriticalNativeEffect(() => Haptics.selectionAsync());
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.primarySoft,
            borderRadius: 20,
            height: 40,
            justifyContent: "center",
            width: 40,
          }}
        >
          <ListChecks color={theme.colors.primary} size={21} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1 }}>
          <Animated.View
            entering={reduceMotion ? undefined : ZoomIn.duration(160)}
            key={selectedKeys.length}
          >
            <OnboardingText accessibilityLiveRegion="polite" family="semibold" size={14}>
              {selectedKeys.length} of {suggestedTaskDefinitions.length} selected
            </OnboardingText>
          </Animated.View>
          <OnboardingText color={theme.colors.mutedText} size={13}>
            Due dates are based on your wedding date.
          </OnboardingText>
        </View>
        <MotionPressable
          accessibilityLabel={
            allSelected ? "Clear all suggested tasks" : "Select all suggested tasks"
          }
          accessibilityRole="button"
          onPress={() =>
            onChange(allSelected ? [] : suggestedTaskDefinitions.map((task) => task.key))
          }
          pressedScale={0.97}
          style={{
            alignItems: "center",
            justifyContent: "center",
            minHeight: theme.layout.touchTarget,
            paddingHorizontal: 8,
          }}
        >
          <OnboardingText color={theme.colors.primary} family="semibold" size={13}>
            {allSelected ? "Clear all" : "Select all"}
          </OnboardingText>
        </MotionPressable>
      </View>

      <View
        style={{
          backgroundColor: theme.colors.elevatedSurface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.card,
          borderWidth: 1,
          overflow: "hidden",
        }}
      >
        {suggestedTaskDefinitions.map((task, index) => {
          const checked = selected.has(task.key);
          const dueDate = suggestedTaskDueDate(weddingDate, task.dayOffset, today);
          const dueLabel = dueDate === today ? "Due today" : `Due ${formatShortDateOnly(dueDate)}`;

          return (
            <Animated.View
              entering={reduceMotion ? undefined : FadeInDown.delay(index * 35).duration(200)}
              key={task.key}
            >
              <MotionPressable
                accessibilityLabel={`${task.title}, ${dueLabel}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => toggleTask(task.key)}
                pressedScale={0.992}
                style={{
                  alignItems: "center",
                  backgroundColor: checked
                    ? theme.colors.primarySoft
                    : theme.colors.elevatedSurface,
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: index === suggestedTaskDefinitions.length - 1 ? 0 : 1,
                  flexDirection: "row",
                  gap: 12,
                  minHeight: 68,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: checked ? theme.colors.primary : theme.colors.canvas,
                    borderColor: checked ? theme.colors.primary : theme.colors.border,
                    borderRadius: 9,
                    borderWidth: 1,
                    height: 28,
                    justifyContent: "center",
                    width: 28,
                  }}
                >
                  {checked ? (
                    <Animated.View entering={reduceMotion ? undefined : ZoomIn.duration(140)}>
                      <Check color={theme.colors.onPrimary} size={17} strokeWidth={2.2} />
                    </Animated.View>
                  ) : null}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <OnboardingText family="semibold" size={14}>
                    {task.title}
                  </OnboardingText>
                  <OnboardingText color={theme.colors.mutedText} size={12}>
                    {dueLabel}
                  </OnboardingText>
                </View>
              </MotionPressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
