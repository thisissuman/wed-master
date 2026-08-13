import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Check, ChevronDown, Search } from "lucide-react-native";
import { type ComponentRef, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, findNodeHandle, Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { tokens } from "@/theme";
import { motionTiming } from "@/theme/motion";

import { AppBottomSheet } from "./AppBottomSheet";
import { AppText } from "./AppText";
import { FieldLabel } from "./FieldLabel";
import { MotionPressable } from "./MotionPressable";
import { TextField } from "./TextField";

type OptionTone = "danger" | "muted" | "primary" | "success" | "warning";

export type SelectOption = {
  description?: string;
  icon?: LucideIcon;
  label: string;
  tone?: OptionTone;
  value: string;
};

type SelectFieldProps = {
  compact?: boolean;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  optional?: boolean;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  searchable?: boolean;
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
  compact = false,
  error,
  helperText,
  icon: Icon,
  label,
  onChange,
  optional,
  options,
  placeholder = "Select an option",
  required,
  searchable,
  value,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<ComponentRef<typeof Pressable>>(null);
  const rotation = useSharedValue(0);
  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon ?? Icon;
  const searchEnabled = searchable ?? options.length > 8;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredOptions = useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) =>
            `${option.label} ${option.description ?? ""}`
              .toLocaleLowerCase()
              .includes(normalizedQuery),
          )
        : options,
    [normalizedQuery, options],
  );
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    rotation.set(withTiming(open ? 180 : 0, motionTiming.state));
  }, [open, rotation]);

  const restoreTriggerFocus = () => {
    const reactTag = findNodeHandle(triggerRef.current);
    if (reactTag) AccessibilityInfo.setAccessibilityFocus(reactTag);
  };

  const closeSheet = () => {
    setOpen(false);
    setQuery("");
    restoreTriggerFocus();
  };

  return (
    <View className="gap-2xs">
      <FieldLabel label={label} optional={optional} required={required} />
      <MotionPressable
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        android_ripple={{ color: tokens.colors.surfaceMuted }}
        className={`min-h-14 flex-row items-center overflow-hidden rounded-control border bg-elevatedSurface ${
          error ? "border-danger" : open ? "border-primary bg-primarySoft" : "border-borderStrong"
        }`}
        onPress={() => setOpen(true)}
        ref={triggerRef}
      >
        {SelectedIcon ? (
          <View className="min-h-14 min-w-14 items-center justify-center">
            <SelectedIcon
              color={
                selected?.tone
                  ? toneColors[selected.tone]
                  : error
                    ? tokens.colors.danger
                    : open
                      ? tokens.colors.primary
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
          <View className="min-h-14 min-w-14 items-center justify-center">
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

      <AppBottomSheet
        closeLabel={`Close ${label.toLowerCase()} options`}
        description={compact ? undefined : "Choose one option"}
        onClose={closeSheet}
        title={label}
        visible={open}
      >
        {searchEnabled ? (
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            icon={Search}
            label="Search options"
            onChangeText={setQuery}
            placeholder={`Search ${label.toLowerCase()}`}
            value={query}
          />
        ) : null}
        <View
          accessibilityLabel={`${label} options`}
          accessibilityRole="radiogroup"
          className="gap-2xs"
        >
          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const optionSelected = option.value === value;
              const OptionIcon = option.icon;
              return (
                <MotionPressable
                  accessibilityLabel={option.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: optionSelected }}
                  android_ripple={{ color: tokens.colors.primarySoft }}
                  className={`${compact ? "min-h-12" : "min-h-14"} flex-row items-center gap-sm rounded-control px-md py-xs ${
                    optionSelected ? "bg-primarySoft" : "bg-elevatedSurface active:bg-surfaceMuted"
                  }`}
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    void Haptics.selectionAsync();
                    closeSheet();
                  }}
                  pressedScale={0.985}
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
            <View className="min-h-24 items-center justify-center p-lg">
              <AppText tone="muted">No matching options.</AppText>
            </View>
          )}
        </View>
      </AppBottomSheet>
    </View>
  );
}
