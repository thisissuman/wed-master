import { Stack } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";

import { tokens } from "@/theme";

export default function AppLayout() {
  const reduceMotion = useReducedMotion();
  const detailAnimation = reduceMotion ? "none" : "default";
  const modalAnimation = reduceMotion ? "none" : "slide_from_bottom";

  return (
    <Stack
      screenOptions={{
        animation: detailAnimation,
        contentStyle: { backgroundColor: tokens.colors.canvas },
        headerShown: false,
        statusBarStyle: "light",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="events/[id]" />
      <Stack.Screen
        name="events/new"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen
        name="events/edit"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen name="tasks/[id]" />
      <Stack.Screen
        name="tasks/new"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen
        name="tasks/edit"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen name="expenses/[id]" />
      <Stack.Screen
        name="expenses/new"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
      <Stack.Screen
        name="expenses/edit"
        options={{ animation: modalAnimation, presentation: "modal" }}
      />
    </Stack>
  );
}
