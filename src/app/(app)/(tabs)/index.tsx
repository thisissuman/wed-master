import { ScrollView, View } from "react-native";

import { AppText, Button, Card, EmptyState, Screen, StatusBadge } from "@/components/ui";
import { getSupabaseEnvironment } from "@/lib/supabase";

export default function HomeScreen() {
  const environment = getSupabaseEnvironment();

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md">
        <View className="gap-2xs">
          <AppText variant="display">Wed Master</AppText>
          <AppText className="text-textSecondary">
            Foundation preview — no wedding data yet.
          </AppText>
        </View>

        <Card className="gap-sm">
          <AppText variant="heading">Your planning workspace</AppText>
          <AppText className="text-textSecondary">
            Events, tasks, and budget tracking will be added as focused product slices.
          </AppText>
          <StatusBadge
            label={environment.isConfigured ? "Supabase configured" : "Supabase setup required"}
            tone={environment.isConfigured ? "success" : "warning"}
          />
        </Card>

        <View className="gap-xs">
          <AppText variant="heading">Next step</AppText>
          <EmptyState
            actionLabel="Create first event"
            description="This action is intentionally a placeholder while wedding setup is not implemented."
            onAction={() => undefined}
            title="Your wedding plan will appear here"
          />
        </View>

        {!environment.isConfigured && __DEV__ ? (
          <Button
            accessibilityHint="Open the project environment example to configure Supabase values."
            label="Add Supabase environment values"
            onPress={() => undefined}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
