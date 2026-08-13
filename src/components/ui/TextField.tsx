import type { LucideIcon } from "lucide-react-native";
import { forwardRef, useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { tokens } from "@/theme";

import { AppText } from "./AppText";
import { FieldLabel } from "./FieldLabel";

type TextFieldProps = Omit<TextInputProps, "className"> & {
  className?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  label: string;
  optional?: boolean;
  required?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    className = "",
    error,
    helperText,
    icon: Icon,
    label,
    multiline,
    onBlur,
    onFocus,
    optional,
    required,
    style,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const message = error ?? helperText;

  return (
    <View className="gap-2xs">
      <FieldLabel label={label} optional={optional} required={required} />
      <View
        className={`${multiline ? "min-h-28 items-start" : "min-h-14 items-center"} flex-row overflow-hidden rounded-control border bg-elevatedSurface ${
          error ? "border-danger" : focused ? "border-primary" : "border-borderStrong"
        }`}
        style={focused && !error ? { boxShadow: tokens.elevation.focus } : undefined}
      >
        {Icon ? (
          <View className={`${multiline ? "pt-sm" : ""} min-w-14 items-center justify-center`}>
            <Icon
              color={
                error
                  ? tokens.colors.danger
                  : focused
                    ? tokens.colors.primary
                    : tokens.colors.textSecondary
              }
              size={tokens.iconSize.md}
            />
          </View>
        ) : null}
        <TextInput
          ref={ref}
          accessibilityHint={error ?? helperText}
          accessibilityLabel={label}
          className={`${multiline ? "min-h-28 py-sm" : "min-h-14"} flex-1 text-body text-textPrimary ${
            Icon ? "pr-md" : "px-md"
          } ${className}`}
          multiline={multiline}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={tokens.colors.textMuted}
          style={[{ fontFamily: tokens.fontFamily.sansRegular }, style]}
          textAlignVertical={multiline ? "top" : "center"}
          {...props}
        />
      </View>
      {message ? (
        <AppText
          accessibilityRole={error ? "alert" : undefined}
          tone={error ? "danger" : "muted"}
          variant="caption"
        >
          {message}
        </AppText>
      ) : null}
    </View>
  );
});
