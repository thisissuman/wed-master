import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";

type DateFieldProps = {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

const dateFromValue = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date("2026-01-01T12:00:00");

export function DateField({ error, label, onChange, value }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <View className="gap-2xs">
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityLabel={`${label}: ${value || "Select date"}`}
        accessibilityRole="button"
        className={`min-h-12 flex-row items-center justify-between rounded-control border bg-surfaceRaised px-md ${error ? "border-danger" : "border-border"}`}
        onPress={() => setOpen(true)}
      >
        <AppText className={value ? "" : "text-textSecondary"}>{value || "Select date"}</AppText>
        <CalendarDays color={tokens.colors.textSecondary} size={tokens.iconSize.md} />
      </Pressable>
      {error ? (
        <AppText className="text-danger" variant="caption">
          {error}
        </AppText>
      ) : null}
      {open ? (
        <DateTimePicker
          display="default"
          mode="date"
          onChange={(_, selectedDate) => {
            setOpen(false);
            if (selectedDate) onChange(selectedDate.toISOString().slice(0, 10));
          }}
          value={dateFromValue(value)}
        />
      ) : null}
    </View>
  );
}
