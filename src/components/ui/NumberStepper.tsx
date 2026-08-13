import * as Haptics from "expo-haptics";
import { Minus, Plus } from "lucide-react-native";
import { TextInput, View } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";
import { FieldLabel } from "./FieldLabel";
import { MotionPressable } from "./MotionPressable";

export function NumberStepper({
  error,
  label,
  maximum = 999,
  minimum = 1,
  onChange,
  required,
  value,
}: {
  error?: string;
  label: string;
  maximum?: number;
  minimum?: number;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const parsed = Number.parseInt(value, 10);
  const current = Number.isFinite(parsed) ? parsed : minimum;
  const decrementDisabled = current <= minimum;
  const incrementDisabled = current >= maximum;

  const update = (next: number) => {
    onChange(String(Math.min(maximum, Math.max(minimum, next))));
    void Haptics.selectionAsync();
  };

  return (
    <View className="gap-2xs">
      <FieldLabel label={label} required={required} />
      <View
        className={`min-h-14 flex-row overflow-hidden rounded-control border bg-elevatedSurface ${
          error ? "border-danger" : "border-borderStrong"
        }`}
      >
        <MotionPressable
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: decrementDisabled }}
          className={`min-h-14 min-w-14 items-center justify-center border-r border-borderSubtle ${
            decrementDisabled ? "opacity-40" : "active:bg-primarySoft"
          }`}
          disabled={decrementDisabled}
          onPress={() => update(current - 1)}
          pressedScale={0.94}
        >
          <Minus color={tokens.colors.primary} size={tokens.iconSize.md} />
        </MotionPressable>
        <TextInput
          accessibilityLabel={label}
          className="min-h-14 min-w-16 flex-1 text-center text-heading text-textPrimary"
          keyboardType="number-pad"
          maxLength={String(maximum).length}
          onChangeText={(next) => onChange(next.replace(/\D/g, ""))}
          selectTextOnFocus
          style={{ fontFamily: tokens.fontFamily.sansSemibold }}
          value={value}
        />
        <MotionPressable
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: incrementDisabled }}
          className={`min-h-14 min-w-14 items-center justify-center border-l border-borderSubtle ${
            incrementDisabled ? "opacity-40" : "active:bg-primarySoft"
          }`}
          disabled={incrementDisabled}
          onPress={() => update(current + 1)}
          pressedScale={0.94}
        >
          <Plus color={tokens.colors.primary} size={tokens.iconSize.md} />
        </MotionPressable>
      </View>
      {error ? (
        <AppText accessibilityRole="alert" tone="danger" variant="caption">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
