import type { LucideIcon } from "lucide-react-native";
import X from "lucide-react-native/icons/x";
import { type PropsWithChildren, type ReactNode, useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  KeyboardAvoidingView as KeyboardControllerAvoidingView,
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { isExpandedLayout } from "@/lib/responsive";
import { motionDurations, tokens, useAppTheme } from "@/theme";
import { dialogEnteringTransition, exitTransition } from "@/theme/motion";

import { AppText } from "./AppText";
import { IconButton } from "./IconButton";

export type AppBottomSheetPresentation = "dialog" | "sheet";

type AppBottomSheetProps = PropsWithChildren<{
  closeLabel?: string;
  description?: string;
  footer?: ReactNode;
  icon?: LucideIcon;
  onAfterClose?: () => void;
  onClose: () => void;
  presentation?: AppBottomSheetPresentation;
  scrollable?: boolean;
  title: string;
  visible: boolean;
}>;

const expandedPanelWidth = 520;
const expandedPanelHeight = 720;
const expandedPanelInset = 32;
const phonePanelHeightRatio = 0.86;
const phoneDialogHeightRatio = 0.7;
const phoneDialogWidth = 360;
const phonePanelInset = 16;
const phonePanelBottomGap = 12;

type SheetPhase = "closed" | "closing" | "open";

function useSheetPresence(
  visible: boolean,
  reduceMotion: boolean,
  onAfterClose: (() => void) | undefined,
) {
  const [phase, setPhase] = useState<SheetPhase>(visible ? "open" : "closed");
  const phaseRef = useRef<SheetPhase>(phase);
  const visibleRef = useRef(visible);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onAfterCloseRef = useRef(onAfterClose);

  useEffect(() => {
    visibleRef.current = visible;
    onAfterCloseRef.current = onAfterClose;
  }, [onAfterClose, visible]);

  useEffect(() => {
    if (visible && closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }

    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = undefined;

      if (visible) {
        if (phaseRef.current !== "open") {
          phaseRef.current = "open";
          setPhase("open");
        }
        return;
      }

      if (phaseRef.current === "closed") return;

      if (phaseRef.current === "open") {
        phaseRef.current = "closing";
        setPhase("closing");
      }
      if (closeTimerRef.current) return;

      closeTimerRef.current = setTimeout(
        () => {
          closeTimerRef.current = undefined;
          if (visibleRef.current || phaseRef.current !== "closing") return;

          phaseRef.current = "closed";
          setPhase("closed");
          onAfterCloseRef.current?.();
        },
        reduceMotion ? 0 : motionDurations.exit,
      );
    }, 0);

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = undefined;
      }
    };
  }, [reduceMotion, visible]);

  useEffect(
    () => () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  return {
    contentVisible: phase === "open",
    mounted: phase !== "closed",
  };
}

export function AppBottomSheet({
  children,
  closeLabel = "Close",
  description,
  footer,
  icon: Icon,
  onAfterClose,
  onClose,
  presentation = "sheet",
  scrollable = true,
  title,
  visible,
}: AppBottomSheetProps) {
  const theme = useAppTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [footerHeight, setFooterHeight] = useState(0);
  const { contentVisible, mounted } = useSheetPresence(visible, reduceMotion, onAfterClose);
  const expanded = isExpandedLayout(width);
  const dialogLike = expanded || presentation === "dialog";
  const panelWidth = expanded
    ? Math.min(expandedPanelWidth, width - expandedPanelInset * 2)
    : dialogLike
      ? Math.min(phoneDialogWidth, width - phonePanelInset * 2)
      : width - phonePanelInset * 2;
  const panelMaxHeight = expanded
    ? Math.min(expandedPanelHeight, height - expandedPanelInset * 2)
    : height * (dialogLike ? phoneDialogHeightRatio : phonePanelHeightRatio);

  const content = scrollable ? (
    process.env.EXPO_OS === "web" ? (
      <ScrollView
        contentContainerClassName="gap-md px-lg py-md"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    ) : (
      <KeyboardAwareScrollView
        bottomOffset={footerHeight + Number.parseInt(tokens.spacing.sm, 10)}
        contentContainerClassName="gap-md px-lg py-md"
        disableScrollOnKeyboardHide
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        mode="insets"
        showsVerticalScrollIndicator={false}
        testID="bottom-sheet-keyboard-aware-scroll"
      >
        {children}
      </KeyboardAwareScrollView>
    )
  ) : (
    <View className="gap-md px-lg py-md">{children}</View>
  );

  return (
    <Modal
      animationType="none"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      testID="app-bottom-sheet-modal"
      transparent
      visible={mounted}
    >
      <KeyboardControllerAvoidingView
        behavior="padding"
        className={`flex-1 items-center ${dialogLike ? "justify-center" : "justify-end"}`}
        style={{
          paddingBottom: dialogLike
            ? phonePanelInset
            : Math.max(insets.bottom, phonePanelBottomGap),
          paddingHorizontal: expanded ? expandedPanelInset : phonePanelInset,
          paddingTop: dialogLike ? Math.max(insets.top, phonePanelInset) : insets.top,
        }}
        testID="app-bottom-sheet-layout"
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
        {contentVisible ? (
          <Animated.View
            entering={dialogEnteringTransition}
            exiting={exitTransition}
            className="overflow-hidden rounded-sheet bg-elevatedSurface shadow-elevated"
            style={{ borderCurve: "continuous", maxHeight: panelMaxHeight, width: panelWidth }}
            testID="app-bottom-sheet-panel"
          >
            <SafeAreaView accessibilityViewIsModal edges={[]} style={{ maxHeight: "100%" }}>
              <View className="flex-row items-start gap-sm border-b border-borderSubtle px-lg py-md">
                {Icon ? (
                  <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
                    <Icon color={theme.colors.primary} size={tokens.iconSize.md} />
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
                <IconButton
                  accessibilityLabel={closeLabel}
                  hitSlop={8}
                  icon={X}
                  onPress={onClose}
                />
              </View>
              {content}
              {footer ? (
                <View
                  className="border-t border-borderSubtle px-lg pb-md pt-md"
                  onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
                >
                  {footer}
                </View>
              ) : null}
            </SafeAreaView>
          </Animated.View>
        ) : null}
      </KeyboardControllerAvoidingView>
    </Modal>
  );
}
