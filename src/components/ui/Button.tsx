import { Pressable, type PressableProps } from "react-native";

import { AppText } from "./AppText";

type ButtonVariant = "destructive" | "ghost" | "primary" | "secondary";

const variantClassNames: Record<ButtonVariant, string> = {
  destructive: "bg-danger",
  ghost: "bg-transparent",
  primary: "bg-brand",
  secondary: "bg-surfaceRaised border border-border",
};

const labelClassNames: Record<ButtonVariant, string> = {
  destructive: "text-brandOn",
  ghost: "text-brand",
  primary: "text-brandOn",
  secondary: "text-textPrimary",
};

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  disabled = false,
  label,
  loading = false,
  variant = "primary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      android_ripple={{ color: "transparent" }}
      disabled={isDisabled}
      className={`min-h-12 items-center justify-center rounded-control px-lg ${variantClassNames[variant]} ${
        isDisabled ? "opacity-50" : ""
      }`}
      {...props}
    >
      <AppText className={labelClassNames[variant]} variant="label">
        {loading ? "Loading…" : label}
      </AppText>
    </Pressable>
  );
}
