import { type PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

type CardProps = PropsWithChildren<
  ViewProps & { className?: string; variant?: "default" | "subtle" }
>;

const variantClassNames = {
  default: "border border-borderSubtle bg-elevatedSurface",
  subtle: "bg-surfaceMuted",
} as const;

export function Card({ children, className = "", variant = "default", ...props }: CardProps) {
  return (
    <View className={`rounded-card p-lg ${variantClassNames[variant]} ${className}`} {...props}>
      {children}
    </View>
  );
}
