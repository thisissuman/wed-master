import DateTimePicker from "@react-native-community/datetimepicker";
import type { LucideIcon } from "lucide-react-native";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import X from "lucide-react-native/icons/x";
import { useState } from "react";
import { View } from "react-native";

import { formatDateOnly, toDateOnly } from "@/lib/dates";
import { tokens, useAppTheme } from "@/theme";

import { AppText } from "./AppText";
import { FieldLabel } from "./FieldLabel";
import { MotionPressable } from "./MotionPressable";
import { useKeyboardSettledAction } from "./useKeyboardSettledAction";

type DateFieldProps = {
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  optional?: boolean;
  required?: boolean;
  value: string;
};

const dateFromValue = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();

export function DateField({
  error,
  helperText,
  icon: Icon = CalendarDays,
  label,
  onChange,
  optional,
  required,
  value,
}: DateFieldProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const openPicker = useKeyboardSettledAction(() => setOpen(true));
  const formattedValue = value ? formatDateOnly(value) : "Select date";
  return (
    <View className="gap-2xs">
      <FieldLabel label={label} optional={optional} required={required} />
      <View
        className={`min-h-14 flex-row overflow-hidden rounded-control border bg-elevatedSurface ${
          error ? "border-danger" : "border-borderStrong"
        }`}
      >
        <MotionPressable
          accessibilityLabel={`${label}: ${formattedValue}`}
          accessibilityRole="button"
          android_ripple={{ color: theme.colors.surfaceMuted }}
          className="min-h-14 min-w-0 flex-1 flex-row items-center active:opacity-80"
          onPress={openPicker.run}
        >
          <View className="min-w-14 items-center justify-center">
            <Icon
              color={error ? theme.colors.danger : theme.colors.textSecondary}
              size={tokens.iconSize.md}
            />
          </View>
          <AppText className="flex-1" tone={value ? undefined : "muted"}>
            {formattedValue}
          </AppText>
          {!optional || !value ? (
            <View className="min-h-14 min-w-14 items-center justify-center">
              <ChevronDown color={theme.colors.textSecondary} size={tokens.iconSize.sm} />
            </View>
          ) : null}
        </MotionPressable>
        {optional && value ? (
          <MotionPressable
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            accessibilityRole="button"
            className="min-h-14 min-w-14 items-center justify-center border-l border-borderSubtle active:bg-surfaceMuted"
            onPress={() => onChange("")}
            pressedScale={0.94}
          >
            <X color={theme.colors.textSecondary} size={tokens.iconSize.sm} />
          </MotionPressable>
        ) : null}
      </View>
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
        <DateTimePicker
          display="default"
          mode="date"
          onDismiss={() => setOpen(false)}
          onValueChange={(_, selectedDate) => {
            setOpen(false);
            onChange(toDateOnly(selectedDate));
          }}
          testID="date-picker"
          value={dateFromValue(value)}
        />
      ) : null}
    </View>
  );
}
