import { Modal, Pressable, View } from "react-native";
import { CalendarPlus, CheckSquare2, ReceiptIndianRupee, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, IconButton } from "@/components/ui";
import { tokens } from "@/theme";

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
    <Pressable
      accessibilityLabel={`Add ${label}`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.brandSoft }}
      className="min-h-12 flex-row items-center gap-sm rounded-control px-sm active:bg-surfaceSubtle"
      onPress={onPress}
    >
      <View className="h-12 w-12 items-center justify-center rounded-control bg-brandSoft">
        <Icon color={tokens.colors.brand} size={tokens.iconSize.md} />
      </View>
      <View className="flex-1 gap-2xs">
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption">{description}</AppText>
      </View>
    </Pressable>
  );
}

export function QuickAddSheet({
  onAddEvent,
  onAddExpense,
  onAddTask,
  onClose,
  visible,
}: QuickAddSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/30">
        <SafeAreaView
          edges={["bottom"]}
          className="gap-lg rounded-t-sheet bg-surfaceRaised p-lg shadow-sheet"
        >
          <View className="flex-row items-center gap-sm">
            <View className="flex-1 gap-2xs">
              <AppText variant="heading">Add to your plan</AppText>
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
      </View>
    </Modal>
  );
}
