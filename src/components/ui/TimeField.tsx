import DateTimePicker from "@react-native-community/datetimepicker";
import type { LucideIcon } from "lucide-react-native";
import { ChevronDown, Clock3, X } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";
import { FieldLabel } from "./FieldLabel";
import { MotionPressable } from "./MotionPressable";

type TimeFieldProps = {
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  label: string;
  onChange: (value: string) => void;
  optional?: boolean;
  value: string;
};

function timeFromValue(value: string): Date {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  const date = new Date();
  date.setSeconds(0, 0);
  if (match) date.setHours(Number(match[1]), Number(match[2]));
  return date;
}

function formatTime(value: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return "Select time";
  const hour = Number(match[1]);
  const minute = match[2];
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

export function TimeField({
  error,
  helperText,
  icon: Icon = Clock3,
  label,
  onChange,
  optional,
  value,
}: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const formatted = formatTime(value);
  return (
    <View className="gap-2xs">
      <FieldLabel label={label} optional={optional} />
      <View
        className={`min-h-12 flex-row overflow-hidden rounded-control border bg-elevatedSurface ${
          error ? "border-danger" : "border-borderStrong"
        }`}
      >
        <MotionPressable
          accessibilityLabel={`${label}: ${formatted}`}
          accessibilityRole="button"
          android_ripple={{ color: tokens.colors.surfaceMuted }}
          className="min-h-12 min-w-0 flex-1 flex-row items-center active:opacity-80"
          onPress={() => setOpen(true)}
        >
          <View className="min-w-12 items-center justify-center">
            <Icon
              color={error ? tokens.colors.danger : tokens.colors.textSecondary}
              size={tokens.iconSize.md}
            />
          </View>
          <AppText className="flex-1" tone={value ? undefined : "muted"}>
            {formatted}
          </AppText>
          {!optional || !value ? (
            <View className="min-h-12 min-w-12 items-center justify-center">
              <ChevronDown color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
            </View>
          ) : null}
        </MotionPressable>
        {optional && value ? (
          <MotionPressable
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            accessibilityRole="button"
            className="min-h-12 min-w-12 items-center justify-center border-l border-borderSubtle active:bg-surfaceMuted"
            onPress={() => onChange("")}
            pressedScale={0.94}
          >
            <X color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
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
          mode="time"
          onDismiss={() => setOpen(false)}
          onValueChange={(_, selectedTime) => {
            setOpen(false);
            const hours = String(selectedTime.getHours()).padStart(2, "0");
            const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
            onChange(`${hours}:${minutes}`);
          }}
          value={timeFromValue(value)}
        />
      ) : null}
    </View>
  );
}
