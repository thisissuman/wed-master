import { Modal, Pressable, ScrollView, View } from "react-native";
import { ChevronDown, X } from "lucide-react-native";
import { useState } from "react";

import { tokens } from "@/theme";
import { AppText } from "./AppText";

type Option = { label: string; value: string };
type SelectFieldProps = {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: Option[];
  value: string;
};
export function SelectField({ error, label, onChange, options, value }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View className="gap-2xs">
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityLabel={`${label}: ${selected?.label ?? "Select"}`}
        accessibilityRole="button"
        className={`min-h-12 flex-row items-center justify-between rounded-control border bg-surfaceRaised px-md ${error ? "border-danger" : "border-border"}`}
        onPress={() => setOpen(true)}
      >
        <AppText>{selected?.label ?? "Select"}</AppText>
        <ChevronDown color={tokens.colors.textSecondary} size={tokens.iconSize.md} />
      </Pressable>
      {error ? (
        <AppText className="text-danger" variant="caption">
          {error}
        </AppText>
      ) : null}
      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View className="flex-1 justify-end bg-black/30">
          <View className="max-h-[70%] rounded-t-sheet bg-surface p-lg">
            <View className="mb-md flex-row items-center justify-between">
              <AppText variant="heading">{label}</AppText>
              <Pressable
                accessibilityLabel="Close options"
                className="min-h-12 min-w-12 items-center justify-center"
                onPress={() => setOpen(false)}
              >
                <X color={tokens.colors.textPrimary} size={tokens.iconSize.md} />
              </Pressable>
            </View>
            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  className="min-h-12 justify-center border-b border-border"
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <AppText className={option.value === value ? "text-brand" : ""}>
                    {option.label}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
