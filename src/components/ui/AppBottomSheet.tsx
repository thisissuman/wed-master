import type { LucideIcon } from "lucide-react-native";
import { X } from "lucide-react-native";
import { type PropsWithChildren, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { isExpandedLayout } from "@/lib/responsive";
import { tokens } from "@/theme";
import {
  dialogEnteringTransition,
  exitTransition,
  sheetEnteringTransition,
  sheetExitTransition,
} from "@/theme/motion";

import { AppText } from "./AppText";
import { IconButton } from "./IconButton";

type AppBottomSheetProps = PropsWithChildren<{
  closeLabel?: string;
  description?: string;
  footer?: ReactNode;
  icon?: LucideIcon;
  onClose: () => void;
  scrollable?: boolean;
  title: string;
  visible: boolean;
}>;

const expandedPanelWidth = 520;
const expandedPanelHeight = 720;
const expandedPanelInset = 32;
const phonePanelHeightRatio = 0.86;

export function AppBottomSheet({
  children,
  closeLabel = "Close",
  description,
  footer,
  icon: Icon,
  onClose,
  scrollable = true,
  title,
  visible,
}: AppBottomSheetProps) {
  const { height, width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const expanded = isExpandedLayout(width);
  const panelWidth = expanded
    ? Math.min(expandedPanelWidth, width - expandedPanelInset * 2)
    : width;
  const panelMaxHeight = expanded
    ? Math.min(expandedPanelHeight, height - expandedPanelInset * 2)
    : height * phonePanelHeightRatio;

  const content = scrollable ? (
    <ScrollView
      contentContainerClassName="gap-md px-lg py-md"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="gap-md px-lg py-md">{children}</View>
  );

  return (
    <Modal
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
      statusBarTranslucent
      testID="app-bottom-sheet-modal"
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
        className={`flex-1 ${expanded ? "items-center justify-center p-xl" : "justify-end"}`}
      >
        <Pressable
          accessibilityElementsHidden
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          testID="app-bottom-sheet-backdrop"
        >
          <View className="flex-1 bg-overlay" />
        </Pressable>
        <Animated.View
          entering={expanded ? dialogEnteringTransition : sheetEnteringTransition}
          exiting={expanded ? exitTransition : sheetExitTransition}
          className={`overflow-hidden bg-elevatedSurface shadow-elevated ${
            expanded ? "rounded-sheet" : "rounded-t-sheet"
          }`}
          style={{ maxHeight: panelMaxHeight, width: panelWidth }}
        >
          <SafeAreaView
            accessibilityViewIsModal
            edges={expanded ? [] : ["bottom"]}
            style={{ maxHeight: "100%" }}
          >
            <View className="flex-row items-start gap-sm border-b border-borderSubtle px-lg py-md">
              {Icon ? (
                <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
                  <Icon color={tokens.colors.primary} size={tokens.iconSize.md} />
                </View>
              ) : null}
              <View className="min-w-0 flex-1 gap-2xs py-2xs">
                <AppText accessibilityRole="header" variant="heading">
                  {title}
                </AppText>
                {description ? (
                  <AppText tone="muted" variant="caption">
                    {description}
                  </AppText>
                ) : null}
              </View>
              <IconButton accessibilityLabel={closeLabel} icon={X} onPress={onClose} />
            </View>
            {content}
            {footer ? (
              <View className="border-t border-borderSubtle px-lg pb-sm pt-md">{footer}</View>
            ) : null}
          </SafeAreaView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
