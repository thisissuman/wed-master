import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="events/[id]" />
      <Stack.Screen name="events/new" options={{ presentation: "modal" }} />
      <Stack.Screen name="events/edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="tasks/[id]" />
      <Stack.Screen name="tasks/new" options={{ presentation: "modal" }} />
      <Stack.Screen name="tasks/edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="expenses/[id]" />
      <Stack.Screen name="expenses/new" options={{ presentation: "modal" }} />
      <Stack.Screen name="expenses/edit" options={{ presentation: "modal" }} />
    </Stack>
  );
}
