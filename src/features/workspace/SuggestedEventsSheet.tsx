import { Check, Sparkles, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, MotionPressable } from "@/components/ui";
import { tokens } from "@/theme";

import type { SuggestedEventDefinition } from "./seed";
import type { StarterEventKey } from "./types";

function relativeDateLabel(offset: number) {
  if (offset === 0) return "Wedding day";
  const count = Math.abs(offset);
  return `${count} ${count === 1 ? "day" : "days"} ${offset < 0 ? "before" : "after"}`;
}

export function SuggestedEventsSheet({
  availableEvents,
  confirmLabel = "Add selected events",
  onChange,
  onClose,
  onConfirm,
  pending = false,
  selectedKeys,
  visible,
}: {
  availableEvents: readonly SuggestedEventDefinition[];
  confirmLabel?: string;
  onChange: (keys: StarterEventKey[]) => void;
  onClose: () => void;
  onConfirm: () => void;
  pending?: boolean;
  selectedKeys: readonly StarterEventKey[];
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const selected = new Set(selectedKeys);
  const allSelected =
    availableEvents.length > 0 && availableEvents.every((event) => selected.has(event.key));

  const toggle = (key: StarterEventKey) => {
    onChange(
      selected.has(key)
        ? selectedKeys.filter((candidate) => candidate !== key)
        : [...selectedKeys, key],
    );
  };

  return (
    <Modal
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end bg-overlay">
        <SafeAreaView className="max-h-[86%] rounded-t-sheet bg-elevatedSurface shadow-elevated">
          <View className="flex-row items-start gap-sm border-b border-borderSubtle px-lg pb-md pt-lg">
            <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
              <Sparkles color={tokens.colors.primary} size={tokens.iconSize.md} />
            </View>
            <View className="min-w-0 flex-1 gap-2xs">
              <AppText variant="heading">Suggested events</AppText>
              <AppText tone="muted" variant="caption">
                Choose only what fits your family. Names and dates stay editable.
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="Close suggested events"
              accessibilityRole="button"
              className="min-h-12 min-w-12 items-center justify-center rounded-control active:bg-surfaceMuted"
              onPress={onClose}
            >
              <X color={tokens.colors.textPrimary} size={tokens.iconSize.md} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="gap-xs px-lg py-md"
            showsVerticalScrollIndicator={false}
          >
            <Button
              label={allSelected ? "Clear all" : "Select all"}
              onPress={() => onChange(allSelected ? [] : availableEvents.map((event) => event.key))}
              variant="ghost"
            />
            {availableEvents.map((event) => {
              const checked = selected.has(event.key);
              return (
                <MotionPressable
                  accessibilityLabel={`${event.name}, ${relativeDateLabel(event.dayOffset)}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  className={`min-h-16 flex-row items-center gap-sm rounded-card px-md py-sm ${
                    checked ? "bg-primarySoft" : "bg-surfaceMuted"
                  }`}
                  key={event.key}
                  onPress={() => toggle(event.key)}
                >
                  <View
                    className={`h-7 w-7 items-center justify-center rounded-sm border ${
                      checked ? "border-primary bg-primary" : "border-borderStrong bg-canvas"
                    }`}
                  >
                    {checked ? (
                      <Check color={tokens.colors.onPrimary} size={tokens.iconSize.sm} />
                    ) : null}
                  </View>
                  <View className="min-w-0 flex-1 gap-2xs">
                    <AppText variant="label">{event.name}</AppText>
                    <AppText tone="muted" variant="caption">
                      {relativeDateLabel(event.dayOffset)}
                    </AppText>
                  </View>
                </MotionPressable>
              );
            })}
          </ScrollView>

          <View className="border-t border-borderSubtle px-lg pb-sm pt-md">
            <Button
              disabled={!selectedKeys.length}
              label={confirmLabel}
              loading={pending}
              onPress={onConfirm}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
