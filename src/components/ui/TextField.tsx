import { TextInput, View, type TextInputProps } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";

type TextFieldProps = Omit<TextInputProps, "className"> & {
  className?: string;
  error?: string;
  helperText?: string;
  label: string;
};

export function TextField({
  className = "",
  error,
  helperText,
  label,
  multiline,
  ...props
}: TextFieldProps) {
  const message = error ?? helperText;

  return (
    <View className="gap-2xs">
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        className={`${multiline ? "min-h-28 py-sm" : "min-h-12"} rounded-control border bg-surfaceRaised px-md text-body text-textPrimary ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        multiline={multiline}
        placeholderTextColor={tokens.colors.textSecondary}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
      {message ? (
        <AppText className={error ? "text-danger" : "text-textSecondary"} variant="caption">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}
