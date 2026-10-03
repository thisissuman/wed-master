import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { shouldStackCompactControls } from "@/lib/responsive";

import { AppText } from "./AppText";
import { Button } from "./Button";

const dialogMaxWidth = 480;

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
  const { fontScale, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const stackActions = shouldStackCompactControls(width, fontScale);

  return (
    <Modal
      animationType={reduceMotion ? "none" : "fade"}
      navigationBarTranslucent
      onRequestClose={() => {
        if (!pending) onCancel();
      }}
      testID="confirmation-dialog-modal"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{
          paddingBottom: Math.max(insets.bottom, 16),
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top, 16),
        }}
      >
        <Pressable
          accessibilityElementsHidden
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          onPress={() => {
            if (!pending) onCancel();
          }}
          style={StyleSheet.absoluteFill}
          testID="confirmation-dialog-backdrop"
        >
          <View className="flex-1 bg-overlay" />
        </Pressable>
        <View
          accessibilityRole="alert"
          accessibilityViewIsModal
          className="w-full gap-lg rounded-sheet bg-elevatedSurface p-xl shadow-elevated"
          style={{ borderCurve: "continuous", maxWidth: dialogMaxWidth }}
          testID="confirmation-dialog-panel"
        >
          <View className="gap-xs">
            <AppText variant="heading">{title}</AppText>
            <AppText tone="muted">{description}</AppText>
          </View>
          <View
            className="gap-sm"
            style={{ flexDirection: stackActions ? "column" : "row" }}
            testID="confirmation-dialog-actions"
          >
            <Button
              className={stackActions ? "w-full" : "flex-1"}
              disabled={pending}
              label={cancelLabel}
              onPress={onCancel}
              variant="secondary"
            />
            <Button
              className={stackActions ? "w-full" : "flex-1"}
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
