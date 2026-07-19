import { Modal, View } from "react-native";
import { CalendarPlus, CheckSquare2, ReceiptIndianRupee, Sparkles, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { AppText, IconButton, MotionPressable } from "@/components/ui";
import { tokens } from "@/theme";
import { sheetEnteringTransition } from "@/theme/motion";

type QuickAddSheetProps = {
  onAddEvent: () => void;
  onAddExpense: () => void;
  onAddTask: () => void;
  onClose: () => void;
  visible: boolean;
};

type AddOptionProps = {
  description: string;
  icon: typeof CheckSquare2;
  label: string;
  onPress: () => void;
};

function AddOption({ description, icon: Icon, label, onPress }: AddOptionProps) {
  return (
    <MotionPressable
      accessibilityLabel={`Add ${label}`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.primarySoft }}
      className="min-h-14 flex-row items-center gap-sm rounded-control border border-transparent px-sm active:border-borderSubtle active:bg-surfaceMuted"
      onPress={onPress}
    >
      <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
        <Icon color={tokens.colors.primary} size={tokens.iconSize.md} />
      </View>
      <View className="flex-1 gap-2xs">
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption">{description}</AppText>
      </View>
    </MotionPressable>
  );
}

export function QuickAddSheet({
  onAddEvent,
  onAddExpense,
  onAddTask,
  onClose,
  visible,
}: QuickAddSheetProps) {
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
            className="gap-lg rounded-t-sheet border border-borderSubtle bg-elevatedSurface p-lg shadow-elevated"
          >
            <View className="self-center h-1 w-12 rounded-full bg-borderStrong" />
            <View className="flex-row items-center gap-sm">
              <View className="flex-1 gap-2xs">
                <View className="flex-row items-center gap-xs">
                  <Sparkles color={tokens.colors.eventBotanical} size={tokens.iconSize.sm} />
                  <AppText tone="primary" variant="heading">
                    Add to your plan
                  </AppText>
                </View>
                <AppText variant="caption">Choose what needs attention next.</AppText>
              </View>
              <IconButton accessibilityLabel="Close add options" icon={X} onPress={onClose} />
            </View>
            <View className="gap-xs">
              <AddOption
                description="A clear action to complete"
                icon={CheckSquare2}
                label="Task"
                onPress={onAddTask}
              />
              <AddOption
                description="A cost or payment to track"
                icon={ReceiptIndianRupee}
                label="Expense"
                onPress={onAddExpense}
              />
              <AddOption
                description="A ceremony or gathering"
                icon={CalendarPlus}
                label="Event"
                onPress={onAddEvent}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
