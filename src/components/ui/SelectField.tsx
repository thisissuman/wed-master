import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { tokens } from "@/theme";
import { exitTransition, motionTiming, sheetEnteringTransition } from "@/theme/motion";

import { AppText } from "./AppText";
import { FieldLabel } from "./FieldLabel";
import { IconButton } from "./IconButton";
import { MotionPressable } from "./MotionPressable";

type OptionTone = "danger" | "muted" | "primary" | "success" | "warning";

export type SelectOption = {
  description?: string;
  icon?: LucideIcon;
  label: string;
  tone?: OptionTone;
  value: string;
};

type SelectFieldProps = {
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  optional?: boolean;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  value: string;
};

const toneColors: Record<OptionTone, string> = {
  danger: tokens.colors.danger,
  muted: tokens.colors.textMuted,
  primary: tokens.colors.primary,
  success: tokens.colors.success,
  warning: tokens.colors.warning,
};

export function SelectField({
  error,
  helperText,
  icon: Icon,
  label,
  onChange,
  optional,
  options,
  placeholder = "Select an option",
  required,
  value,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const rotation = useSharedValue(0);
  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon ?? Icon;
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const setSheetOpen = (next: boolean) => {
    rotation.set(withTiming(next ? 180 : 0, motionTiming.state));
    setOpen(next);
  };

  return (
    <View className="gap-2xs">
      <FieldLabel label={label} optional={optional} required={required} />
      <MotionPressable
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        android_ripple={{ color: tokens.colors.surfaceMuted }}
        className={`min-h-12 flex-row items-center rounded-control border bg-elevatedSurface active:opacity-80 ${
          error ? "border-danger" : open ? "border-primary bg-primarySoft" : "border-borderStrong"
        }`}
        onPress={() => setSheetOpen(!open)}
      >
        {SelectedIcon ? (
          <View className="min-w-12 items-center justify-center">
            <SelectedIcon
              color={
                selected?.tone
                  ? toneColors[selected.tone]
                  : error
                    ? tokens.colors.danger
                    : tokens.colors.textSecondary
              }
              size={tokens.iconSize.md}
            />
          </View>
        ) : null}
        <View className={`${SelectedIcon ? "" : "pl-md"} min-w-0 flex-1 py-xs pr-xs`}>
          <AppText tone={selected ? selected.tone : "muted"}>
            {selected?.label ?? placeholder}
          </AppText>
          {selected?.description ? (
            <AppText numberOfLines={1} tone="muted" variant="caption">
              {selected.description}
            </AppText>
          ) : null}
        </View>
        <Animated.View style={chevronStyle}>
          <View className="min-h-12 min-w-12 items-center justify-center">
            <ChevronDown color={tokens.colors.textSecondary} size={tokens.iconSize.md} />
          </View>
        </Animated.View>
      </MotionPressable>
      {error || helperText ? (
        <AppText
          accessibilityRole={error ? "alert" : undefined}
          tone={error ? "danger" : "muted"}
          variant="caption"
        >
          {error ?? helperText}
        </AppText>
      ) : null}
      {open ? (
        <Animated.View
          entering={sheetEnteringTransition}
          exiting={exitTransition}
          className="max-h-80 overflow-hidden rounded-sheet border border-borderStrong bg-elevatedSurface shadow-elevated"
        >
          <View className="flex-row items-center gap-sm border-b border-borderSubtle px-md py-xs">
            <View className="min-w-0 flex-1">
              <AppText tone="primary" variant="label">
                {label}
              </AppText>
              <AppText tone="muted" variant="caption">
                Choose one option
              </AppText>
            </View>
            <IconButton
              accessibilityLabel="Close options"
              icon={X}
              onPress={() => setSheetOpen(false)}
              variant="subtle"
            />
          </View>
          <ScrollView
            accessibilityLabel={`${label} options`}
            accessibilityRole="radiogroup"
            contentContainerClassName="gap-2xs p-xs"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {options.length ? (
              options.map((option) => {
                const optionSelected = option.value === value;
                const OptionIcon = option.icon;
                return (
                  <MotionPressable
                    accessibilityLabel={option.label}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: optionSelected }}
                    android_ripple={{ color: tokens.colors.primarySoft }}
                    className={`min-h-14 flex-row items-center gap-sm rounded-control border px-md py-xs ${
                      optionSelected
                        ? "border-primary bg-primarySoft"
                        : "border-transparent bg-elevatedSurface active:bg-surfaceMuted"
                    }`}
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      void Haptics.selectionAsync();
                      setSheetOpen(false);
                    }}
                  >
                    {OptionIcon ? (
                      <View className="h-10 w-10 items-center justify-center rounded-control bg-surfaceMuted">
                        <OptionIcon
                          color={option.tone ? toneColors[option.tone] : tokens.colors.primary}
                          size={tokens.iconSize.md}
                        />
                      </View>
                    ) : option.tone ? (
                      <View
                        className="h-sm w-sm rounded-full"
                        style={{ backgroundColor: toneColors[option.tone] }}
                      />
                    ) : null}
                    <View className="min-w-0 flex-1 gap-2xs">
                      <AppText tone={optionSelected ? "primary" : option.tone} variant="label">
                        {option.label}
                      </AppText>
                      {option.description ? (
                        <AppText tone="muted" variant="caption">
                          {option.description}
                        </AppText>
                      ) : null}
                    </View>
                    {optionSelected ? (
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                        <Check color={tokens.colors.onPrimary} size={tokens.iconSize.sm} />
                      </View>
                    ) : null}
                  </MotionPressable>
                );
              })
            ) : (
              <View className="items-center p-xl">
                <AppText tone="muted">No options available.</AppText>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}
