import { ScrollView, View } from "react-native";

import { AppText, Card, ListRow, Screen, SectionHeader } from "@/components/ui";
import { PageHeader } from "@/features/workspace/ui";

export default function MoreScreen() {
  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <PageHeader title="More" />
        <Card className="gap-sm" variant="subtle">
          <AppText variant="heading">Your planning workspace</AppText>
          <AppText className="text-textSecondary">
            Wed Master keeps the wedding plan focused on what needs attention, what is coming up,
            and what has been spent.
          </AppText>
        </Card>
        <View className="gap-xs">
          <SectionHeader title="What is here" />
          <ListRow description="The wedding date, next event, and priority actions." title="Home" />
          <ListRow
            description="Editable events and tasks, kept separate so each stays clear."
            title="Plan"
          />
          <ListRow
            description="Planned costs, payments, and the current spending position."
            title="Budget"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
