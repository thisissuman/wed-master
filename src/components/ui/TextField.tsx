import { TextInput, View, type TextInputProps } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  error?: string;
  helperText?: string;
  label: string;
};

export function TextField({ error, helperText, label, ...props }: TextFieldProps) {
  const message = error ?? helperText;

  return (
    <View className="gap-2xs">
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        className={`min-h-12 rounded-control border bg-surfaceRaised px-md text-body text-textPrimary ${
          error ? "border-danger" : "border-border"
        }`}
        placeholderTextColor={tokens.colors.textSecondary}
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
