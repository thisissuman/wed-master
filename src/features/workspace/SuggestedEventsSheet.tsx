import * as Haptics from "expo-haptics";
import { Check, Sparkles } from "lucide-react-native";
import { View } from "react-native";

import { AppBottomSheet, AppText, Button, MotionPressable } from "@/components/ui";
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
  const selected = new Set(selectedKeys);
  const allSelected =
    availableEvents.length > 0 && availableEvents.every((event) => selected.has(event.key));

  const toggle = (key: StarterEventKey) => {
    onChange(
      selected.has(key)
        ? selectedKeys.filter((candidate) => candidate !== key)
        : [...selectedKeys, key],
    );
    void Haptics.selectionAsync();
  };

  return (
    <AppBottomSheet
      closeLabel="Close suggested events"
      description="Choose only what fits your family. Names and dates stay editable."
      footer={
        <Button
          disabled={!selectedKeys.length}
          label={confirmLabel}
          loading={pending}
          onPress={onConfirm}
        />
      }
      icon={Sparkles}
      onClose={onClose}
      title="Suggested events"
      visible={visible}
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
            pressedScale={0.985}
          >
            <View
              className={`h-7 w-7 items-center justify-center rounded-sm border ${
                checked ? "border-primary bg-primary" : "border-borderStrong bg-canvas"
              }`}
            >
              {checked ? <Check color={tokens.colors.onPrimary} size={tokens.iconSize.sm} /> : null}
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
    </AppBottomSheet>
  );
}
