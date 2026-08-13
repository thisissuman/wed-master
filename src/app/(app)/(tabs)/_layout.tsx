import { useEffect } from "react";
import { useWindowDimensions, View, type ColorValue } from "react-native";
import { Grid2X2, House, IndianRupee, NotebookTabs, type LucideIcon } from "lucide-react-native";
import { Tabs, usePathname } from "expo-router";
import { PlatformPressable } from "expo-router/build/react-navigation/elements";
import type { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motionDurations, tokens } from "@/theme";
import { motionEasing } from "@/theme/motion";
import { isRootTabPath, moreTabResetOptions } from "@/lib/navigation";
import { adaptiveTabBarConfig, adaptiveTabBarItemStyle } from "@/lib/responsive";

const tabIconSize = tokens.iconSize.md;
const tabInset = Number.parseInt(tokens.spacing.sm, 10);
const tabOuterGap = Number.parseInt(tokens.spacing.xs, 10);
const tabInnerGap = Number.parseInt(tokens.spacing["2xs"], 10);

function AdaptiveTabBarButton({ style, ...props }: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      style={[
        style,
        {
          alignSelf: "stretch",
          flex: 1,
          minHeight: tokens.touchTarget,
          minWidth: tokens.touchTarget,
          paddingHorizontal: 0,
          width: "100%",
        },
      ]}
    />
  );
}

function TabIcon({
  color,
  expanded,
  focused,
  icon: Icon,
}: {
  color: ColorValue;
  expanded: boolean;
  focused: boolean;
  icon: LucideIcon;
}) {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.set(
      withTiming(focused ? 1 : 0, {
        duration: motionDurations.tab,
        easing: motionEasing.enter,
      }),
    );
  }, [focus, focused]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [{ scale: 0.9 + focus.value * 0.1 }],
  }));

  return (
    <View className="h-8 w-14 items-center justify-center">
      <Animated.View
        className={`absolute inset-0 rounded-full ${expanded ? "bg-nightSoft" : "bg-primarySoft"}`}
        style={indicatorStyle}
      />
      {expanded && focused ? (
        <View className="absolute -left-xs h-5 w-0.5 rounded-full bg-nightAccent" />
      ) : null}
      <Icon color={color} size={tabIconSize} strokeWidth={1.9} />
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const showTabBar = isRootTabPath(pathname);
  const tabBar = adaptiveTabBarConfig(width);
  const expanded = tabBar.position === "left";
  const itemLayout = adaptiveTabBarItemStyle(width);

  return (
    <Tabs
      screenOptions={{
        animation: reduceMotion ? "none" : "fade",
        headerShown: false,
        sceneStyle: { backgroundColor: tokens.colors.canvas },
        tabBarActiveBackgroundColor: "transparent",
        tabBarActiveTintColor: expanded ? tokens.colors.nightAccent : tokens.colors.primary,
        tabBarButton: AdaptiveTabBarButton,
        tabBarHideOnKeyboard: true,
        tabBarInactiveBackgroundColor: "transparent",
        tabBarInactiveTintColor: expanded
          ? tokens.colors.onNightMuted
          : tokens.colors.textSecondary,
        tabBarLabelPosition: "below-icon",
        tabBarItemStyle: {
          borderRadius: Number.parseInt(tokens.radius.control, 10),
          marginHorizontal: expanded ? 0 : tabInnerGap,
          marginVertical: expanded ? tabOuterGap : tabInnerGap,
          ...itemLayout,
        },
        tabBarLabelStyle: {
          fontFamily: tokens.fontFamily.sansMedium,
          fontSize: 11,
          lineHeight: 14,
        },
        tabBarPosition: tabBar.position,
        tabBarStyle: !showTabBar
          ? { display: "none" }
          : expanded
            ? {
                backgroundColor: tokens.colors.navigationSurface,
                borderColor: tokens.colors.nightBorder,
                borderRadius: Number.parseInt(tokens.radius.tab, 10),
                borderWidth: 1,
                boxShadow: tokens.elevation.elevated,
                marginBottom: tabInset,
                marginLeft: tabOuterGap,
                marginTop: tabInset,
                paddingHorizontal: tabInnerGap,
                paddingVertical: tabInnerGap,
                width: tokens.navigation.railWidth,
              }
            : {
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.borderSubtle,
                borderRadius: Number.parseInt(tokens.radius.tab, 10),
                borderTopColor: tokens.colors.borderSubtle,
                borderWidth: 1,
                boxShadow: tokens.elevation.floating,
                height: tokens.navigation.tabBarHeight,
                marginBottom: tabOuterGap,
                marginHorizontal: tabInset,
                paddingBottom: tabInnerGap,
                paddingHorizontal: tabInnerGap,
                paddingTop: tabInnerGap,
              },
        tabBarVariant: tabBar.variant,
        transitionSpec: {
          animation: "timing",
          config: { duration: reduceMotion ? 0 : motionDurations.tab },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} expanded={expanded} focused={focused} icon={House} />
          ),
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarAccessibilityLabel: "Plan",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} expanded={expanded} focused={focused} icon={NotebookTabs} />
          ),
          title: "Plan",
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarAccessibilityLabel: "Money",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} expanded={expanded} focused={focused} icon={IndianRupee} />
          ),
          title: "Money",
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          ...moreTabResetOptions,
          tabBarAccessibilityLabel: "More",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} expanded={expanded} focused={focused} icon={Grid2X2} />
          ),
          title: "More",
        }}
      />
    </Tabs>
  );
}
