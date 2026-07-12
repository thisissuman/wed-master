import { type PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

type CardProps = PropsWithChildren<ViewProps & { className?: string }>;

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View
      className={`rounded-card border border-border bg-surfaceRaised p-lg shadow-card ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
