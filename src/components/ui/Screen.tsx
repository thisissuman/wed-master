import { type PropsWithChildren } from "react";
import { SafeAreaView, type SafeAreaViewProps } from "react-native-safe-area-context";

type ScreenProps = PropsWithChildren<SafeAreaViewProps & { className?: string }>;

export function Screen({ children, className = "", ...props }: ScreenProps) {
  return (
    <SafeAreaView
      className={`flex-1 bg-canvas ${className}`}
      edges={["top", "left", "right"]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
