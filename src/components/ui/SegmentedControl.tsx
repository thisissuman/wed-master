import { Pressable, View } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";

export type SegmentOption<Value extends string> = {
  label: string;
  value: Value;
};

export type SegmentedControlProps<Value extends string> = {
  accessibilityLabel: string;
  onChange: (value: Value) => void;
  options: SegmentOption<Value>[];
  value: Value;
};

export function SegmentedControl<Value extends string>({
  accessibilityLabel,
  onChange,
  options,
  value,
}: SegmentedControlProps<Value>) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className="flex-row rounded-card border border-borderStrong bg-elevatedSurface p-2xs"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityLabel={option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            android_ripple={{ color: tokens.colors.primarySoft }}
            className={`min-h-12 flex-1 items-center justify-center rounded-control px-sm ${
              selected ? "bg-primary" : "active:bg-surfaceMuted"
            }`}
            key={option.value}
            onPress={() => onChange(option.value)}
          >
            <AppText tone={selected ? "onPrimary" : undefined} variant="body">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
