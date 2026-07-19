import { type ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { AppText } from "./AppText";
import { Card } from "./Card";
import { Screen } from "./Screen";

type PlaceholderScreenProps = { children?: ReactNode; description: string; title: string };

export function PlaceholderScreen({ children, description, title }: PlaceholderScreenProps) {
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md">
        <View className="gap-xs">
          <AppText variant="title">{title}</AppText>
          <AppText tone="muted">{description}</AppText>
        </View>
        <Card>
          <AppText variant="heading">Foundation placeholder</AppText>
          <AppText className="mt-xs" tone="muted">
            This destination is ready for its first complete vertical slice.
          </AppText>
        </Card>
        {children}
      </ScrollView>
    </Screen>
  );
}
