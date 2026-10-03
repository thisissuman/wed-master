import Check from "lucide-react-native/icons/check";
import X from "lucide-react-native/icons/x";
import {
  type ComponentRef,
  type PropsWithChildren,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import * as ReactNative from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isLargeText } from "@/lib/responsive";
import { tokens, useAppTheme } from "@/theme";
import { dialogEnteringTransition } from "@/theme/motion";

import { AppText } from "./AppText";
import { IconButton } from "./IconButton";
import { MotionPressable } from "./MotionPressable";

type AnchorRect = { height: number; width: number; x: number; y: number };

export type FilterPopoverProps = PropsWithChildren<{
  activeCount: number;
  anchorRef: RefObject<ComponentRef<typeof Pressable> | null>;
  onClose: () => void;
  onReset: () => void;
  title: string;
  visible: boolean;
}>;

const viewportInset = 16;
const anchorGap = 8;
const preferredWidth = 320;
const preferredHeight = 360;
const measurementTimeoutMilliseconds = 150;

export function FilterPopover({
  activeCount,
  anchorRef,
  children,
  onClose,
  onReset,
  title,
  visible,
}: FilterPopoverProps) {
  const { fontScale, height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [anchor, setAnchor] = useState<AnchorRect>();
  const [measurementFailed, setMeasurementFailed] = useState(false);
  const [popoverHeight, setPopoverHeight] = useState(0);
  const measurementSequenceRef = useRef(0);
  const fallbackDialog = isLargeText(fontScale) || height < 560 || measurementFailed;
  const panelWidth = Math.min(preferredWidth, Math.max(240, width - viewportInset * 2));
  const panelMaxHeight = Math.max(240, height - insets.top - insets.bottom - viewportInset * 2);

  useEffect(() => {
    const sequence = ++measurementSequenceRef.current;
    let measurementTimeout: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      if (sequence !== measurementSequenceRef.current) return;

      setAnchor(undefined);
      setMeasurementFailed(false);
      setPopoverHeight(0);
      if (!visible) return;

      const trigger = anchorRef.current;
      if (!trigger || typeof trigger.measureInWindow !== "function") {
        setMeasurementFailed(true);
        return;
      }
      measurementTimeout = setTimeout(() => {
        if (sequence === measurementSequenceRef.current) setMeasurementFailed(true);
      }, measurementTimeoutMilliseconds);
      trigger.measureInWindow((x, y, measuredWidth, measuredHeight) => {
        if (sequence !== measurementSequenceRef.current) return;
        if (measurementTimeout) clearTimeout(measurementTimeout);
        if (!measuredWidth || !measuredHeight) {
          setMeasurementFailed(true);
          return;
        }
        setAnchor({ height: measuredHeight, width: measuredWidth, x, y });
      });
    });
    return () => {
      measurementSequenceRef.current += 1;
      cancelAnimationFrame(frame);
      if (measurementTimeout) clearTimeout(measurementTimeout);
    };
  }, [anchorRef, visible]);

  const close = () => {
    onClose();
    requestAnimationFrame(() => {
      const reactTag = ReactNative.findNodeHandle(anchorRef.current);
      if (reactTag) AccessibilityInfo.setAccessibilityFocus(reactTag);
    });
  };

  const measuredHeight = Math.min(popoverHeight || preferredHeight, panelMaxHeight);
  const availableBottom = height - insets.bottom - viewportInset;
  const openBelow = anchor
    ? anchor.y + anchor.height + anchorGap + measuredHeight <= availableBottom
    : false;
  const anchoredTop = anchor
    ? openBelow
      ? anchor.y + anchor.height + anchorGap
      : Math.max(insets.top + viewportInset, anchor.y - measuredHeight - anchorGap)
    : insets.top + viewportInset;
  const anchoredLeft = anchor
    ? Math.min(
        width - panelWidth - viewportInset,
        Math.max(viewportInset, anchor.x + anchor.width - panelWidth),
      )
    : viewportInset;
  const ready = fallbackDialog || Boolean(anchor);

  return (
    <Modal
      animationType="none"
      navigationBarTranslucent
      onRequestClose={close}
      statusBarTranslucent
      testID="filter-popover-modal"
      transparent
      visible={visible}
    >
      <View className={`flex-1 ${fallbackDialog ? "items-center justify-center" : ""}`}>
        <Pressable
          accessibilityElementsHidden
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          onPress={close}
          style={StyleSheet.absoluteFill}
          testID="filter-popover-backdrop"
        >
          <View className="flex-1 bg-overlay" />
        </Pressable>
        {ready ? (
          <Animated.View
            accessibilityViewIsModal
            className="overflow-hidden rounded-card bg-elevatedSurface shadow-elevated"
            entering={dialogEnteringTransition}
            onLayout={(event) => setPopoverHeight(event.nativeEvent.layout.height)}
            style={
              fallbackDialog
                ? {
                    borderCurve: "continuous",
                    maxHeight: Math.min(panelMaxHeight, height * 0.72),
                    width: panelWidth,
                  }
                : {
                    borderCurve: "continuous",
                    left: anchoredLeft,
                    maxHeight: panelMaxHeight,
                    position: "absolute",
                    top: anchoredTop,
                    width: panelWidth,
                  }
            }
            testID="filter-popover-panel"
          >
            <View className="flex-row items-center gap-sm border-b border-borderSubtle px-md py-sm">
              <View className="min-w-0 flex-1">
                <AppText accessibilityRole="header" variant="heading">
                  {title}
                </AppText>
                <AppText tone="muted" variant="metadata">
                  {activeCount ? `${activeCount} active` : "Showing everything"}
                </AppText>
              </View>
              <MotionPressable
                accessibilityLabel="Reset filters"
                accessibilityRole="button"
                accessibilityState={{ disabled: activeCount === 0 }}
                className="min-h-4xl justify-center px-xs"
                disabled={activeCount === 0}
                onPress={onReset}
                pressedScale={0.98}
              >
                <AppText tone={activeCount ? "primary" : "muted"} variant="label">
                  Reset
                </AppText>
              </MotionPressable>
              <IconButton accessibilityLabel="Close filters" hitSlop={8} icon={X} onPress={close} />
            </View>
            <ScrollView
              contentContainerClassName="gap-md p-md"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

export function FilterChoiceGroup({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View className="gap-xs">
      <AppText variant="label">{label}</AppText>
      <View
        accessibilityLabel={`${label} filters`}
        accessibilityRole="radiogroup"
        className="flex-row flex-wrap gap-xs"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <MotionPressable
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              android_ripple={{ color: theme.colors.primarySoft }}
              className={`min-h-4xl flex-row items-center justify-center gap-2xs rounded-control border px-sm ${
                selected
                  ? "border-primary bg-primary"
                  : "border-borderStrong bg-elevatedSurface active:bg-surfaceMuted"
              }`}
              key={option.value}
              onPress={() => onChange(option.value)}
              pressedScale={0.98}
              style={{ flexBasis: "46%", flexGrow: 1 }}
            >
              {selected ? <Check color={theme.colors.onPrimary} size={tokens.iconSize.sm} /> : null}
              <AppText
                className="text-center"
                tone={selected ? "onPrimary" : undefined}
                variant="label"
              >
                {option.label}
              </AppText>
            </MotionPressable>
          );
        })}
      </View>
    </View>
  );
}
