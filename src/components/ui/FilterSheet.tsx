import { type ReactNode } from "react";
import { Modal, ScrollView, View } from "react-native";
import { SlidersHorizontal, Sparkles, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { tokens } from "@/theme";
import { sheetEnteringTransition } from "@/theme/motion";

import { AppText } from "./AppText";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

type FilterSheetProps = {
  children: ReactNode;
  onClear: () => void;
  onClose: () => void;
  title?: string;
  visible: boolean;
};

export function FilterSheet({
  children,
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
            edges={["bottom"]}
            className="max-h-[80%] gap-lg rounded-t-sheet border border-borderSubtle bg-elevatedSurface p-lg shadow-elevated"
          >
            <View className="self-center h-1 w-12 rounded-full bg-borderStrong" />
            <View className="flex-row items-center gap-sm">
              <View className="flex-1 flex-row items-center gap-xs">
                <View className="h-10 w-10 items-center justify-center rounded-control bg-primarySoft">
                  <SlidersHorizontal color={tokens.colors.primary} size={tokens.iconSize.md} />
                </View>
                <View className="gap-2xs">
                  <AppText tone="primary" variant="heading">
                    {title}
                  </AppText>
                  <View className="flex-row items-center gap-2xs">
                    <Sparkles color={tokens.colors.eventBotanical} size={tokens.iconSize.sm} />
                    <AppText tone="muted" variant="caption">
                      Refine what you see
                    </AppText>
                  </View>
                </View>
              </View>
              <IconButton accessibilityLabel="Close filters" icon={X} onPress={onClose} />
            </View>
            <ScrollView
              contentContainerClassName="gap-lg pb-sm"
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            <View className="flex-row gap-sm">
              <Button
                className="flex-1"
                label="Clear filters"
                onPress={onClear}
                variant="secondary"
              />
              <Button className="flex-1" label="Show results" onPress={onClose} />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
