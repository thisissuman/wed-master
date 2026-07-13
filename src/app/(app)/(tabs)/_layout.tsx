import { MoreHorizontal, NotebookTabs, House, WalletCards } from "lucide-react-native";
import { Tabs } from "expo-router";

import { tokens } from "@/theme";

const tabIconSize = tokens.iconSize.md;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.brand,
        tabBarInactiveTintColor: tokens.colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: tokens.colors.surfaceRaised,
          borderTopColor: tokens.colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarAccessibilityLabel: "Home",
          tabBarIcon: ({ color }) => <House color={color} size={tabIconSize} />,
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          tabBarAccessibilityLabel: "Plan",
          tabBarIcon: ({ color }) => <NotebookTabs color={color} size={tabIconSize} />,
          title: "Plan",
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarAccessibilityLabel: "Budget",
          tabBarIcon: ({ color }) => <WalletCards color={color} size={tabIconSize} />,
          title: "Budget",
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarAccessibilityLabel: "More",
          tabBarIcon: ({ color }) => <MoreHorizontal color={color} size={tabIconSize} />,
          title: "More",
        }}
      />
    </Tabs>
  );
}
