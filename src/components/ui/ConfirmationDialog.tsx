import { Modal, View } from "react-native";

import { AppText } from "./AppText";
import { Button } from "./Button";

type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
  title: string;
  visible: boolean;
};

export function ConfirmationDialog({
  cancelLabel = "Cancel",
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  pending = false,
  title,
  visible,
}: ConfirmationDialogProps) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-black/30 p-md">
        <View
          accessibilityRole="alert"
          className="w-full gap-lg rounded-sheet bg-surfaceRaised p-xl shadow-sheet"
        >
          <View className="gap-xs">
            <AppText variant="heading">{title}</AppText>
            <AppText className="text-textSecondary">{description}</AppText>
          </View>
          <View className="flex-row gap-sm">
            <Button className="flex-1" label={cancelLabel} onPress={onCancel} variant="secondary" />
            <Button
              className="flex-1"
              label={confirmLabel}
              loading={pending}
              onPress={onConfirm}
              variant="destructive"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
