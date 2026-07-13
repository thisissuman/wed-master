import { type ReactNode } from "react";
import { Modal, ScrollView, View } from "react-native";
import { SlidersHorizontal, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { tokens } from "@/theme";

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
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/30">
        <SafeAreaView
          edges={["bottom"]}
          className="max-h-[80%] gap-lg rounded-t-sheet bg-surfaceRaised p-lg shadow-sheet"
        >
          <View className="flex-row items-center gap-sm">
            <View className="flex-1 flex-row items-center gap-xs">
              <SlidersHorizontal color={tokens.colors.brand} size={tokens.iconSize.md} />
              <AppText variant="heading">{title}</AppText>
            </View>
            <IconButton accessibilityLabel="Close filters" icon={X} onPress={onClose} />
          </View>
          <ScrollView contentContainerClassName="gap-lg pb-sm" keyboardShouldPersistTaps="handled">
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
      </View>
    </Modal>
  );
}
