import { type ReactNode } from "react";
import { Modal, ScrollView, View } from "react-native";
import { X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { sheetEnteringTransition } from "@/theme/motion";

import { AppText } from "./AppText";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

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
  const reduceMotion = useReducedMotion();
  return (
    <Modal
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end bg-overlay">
        <Animated.View entering={sheetEnteringTransition}>
          <SafeAreaView
            accessibilityViewIsModal
            edges={["bottom"]}
            className="max-h-[80%] gap-md rounded-t-sheet border border-borderSubtle bg-elevatedSurface px-md pb-md pt-sm shadow-elevated"
          >
            <View className="self-center h-1 w-12 rounded-full bg-borderStrong" />
            <View className="flex-row items-center gap-sm">
              <AppText className="min-w-0 flex-1" tone="primary" variant="heading">
                {title}
              </AppText>
              <IconButton accessibilityLabel={closeLabel} icon={X} onPress={onClose} />
            </View>
            <ScrollView
              contentContainerClassName="gap-md pb-xs"
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            <View className="flex-row gap-sm">
              <Button className="flex-1" label={clearLabel} onPress={onClear} variant="secondary" />
              <Button className="flex-1" label={doneLabel} onPress={onClose} />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
