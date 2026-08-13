import { type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";

import { isLargeText } from "@/lib/responsive";

import { AppBottomSheet } from "./AppBottomSheet";
import { Button } from "./Button";

type FilterSheetProps = {
  children: ReactNode;
  clearLabel?: string;
  closeLabel?: string;
  doneLabel?: string;
  onClear: () => void;
  onClose: () => void;
  title?: string;
  visible: boolean;
};

export function FilterSheet({
  children,
  clearLabel = "Clear filters",
  closeLabel = "Close filters",
  doneLabel = "Show results",
  onClear,
  onClose,
  title = "Filter",
  visible,
}: FilterSheetProps) {
  const { fontScale } = useWindowDimensions();
  const stackActions = isLargeText(fontScale);

  return (
    <AppBottomSheet
      closeLabel={closeLabel}
      footer={
        <View className="gap-sm" style={{ flexDirection: stackActions ? "column" : "row" }}>
          <Button
            className={stackActions ? "w-full" : "flex-1"}
            label={clearLabel}
            onPress={onClear}
            variant="secondary"
          />
          <Button
            className={stackActions ? "w-full" : "flex-1"}
            label={doneLabel}
            onPress={onClose}
          />
        </View>
      }
      onClose={onClose}
      title={title}
      visible={visible}
    >
      {children}
    </AppBottomSheet>
  );
}
