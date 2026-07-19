import { Platform, View, type ColorValue } from "react-native";
import { Grid2X2, House, IndianRupee, NotebookTabs, type LucideIcon } from "lucide-react-native";
import { Tabs, usePathname } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";

import { motionDurations, tokens } from "@/theme";

const tabIconSize = tokens.iconSize.md;
const tabInset = Number.parseInt(tokens.spacing.sm, 10);
const tabOuterGap = Number.parseInt(tokens.spacing.xs, 10);
const tabInnerGap = Number.parseInt(tokens.spacing["2xs"], 10);

function TabIcon({
  color,
  focused,
  icon: Icon,
}: {
  color: ColorValue;
  focused: boolean;
  icon: LucideIcon;
}) {
  return (
    <View className="w-14 items-center justify-center">
      {focused ? <View className="absolute -top-sm h-0.5 w-14 rounded-full bg-primary" /> : null}
      <Icon color={color} size={tabIconSize} strokeWidth={1.9} />
    </View>
  );
}

export default function TabLayout() {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const isFormRoute = /\/(?:edit|new)$/.test(pathname);

  return (
    <Tabs
      screenOptions={{
        animation: reduceMotion ? "none" : "fade",
        headerShown: false,
        sceneStyle: { backgroundColor: tokens.colors.canvas },
        tabBarActiveTintColor: tokens.colors.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: tokens.colors.textSecondary,
        tabBarItemStyle: {
          borderRadius: Number.parseInt(tokens.radius.control, 10),
          marginHorizontal: tabInnerGap,
          marginVertical: tabInnerGap,
          minHeight: tokens.touchTarget,
        },
        tabBarLabelStyle: {
          fontFamily: tokens.fontFamily.sansMedium,
          fontSize: 11,
        },
        tabBarStyle: isFormRoute
          ? { display: "none" }
          : {
              backgroundColor:
                Platform.OS === "android"
                  ? tokens.colors.elevatedSurface
                  : tokens.colors.translucentSurface,
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
            <TabIcon color={color} focused={focused} icon={House} />
          ),
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarAccessibilityLabel: "Plan",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} icon={NotebookTabs} />
          ),
          title: "Plan",
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarAccessibilityLabel: "Money",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} icon={IndianRupee} />
          ),
          title: "Money",
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarAccessibilityLabel: "More",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} icon={Grid2X2} />
          ),
          title: "More",
        }}
      />
    </Tabs>
  );
}
