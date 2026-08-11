import { View } from "react-native";

import { MangalyaHeader } from "@/components/brand";
import { AppText, SegmentedControl } from "@/components/ui";

export type PlanView = "events" | "tasks";

export function PlanHeader({
  activeView,
  onViewChange,
}: {
  activeView: PlanView;
  onViewChange: (view: PlanView) => void;
}) {
  return (
    <View className="gap-lg">
      <MangalyaHeader />
      <AppText tone="primary" variant="display">
        Plan
      </AppText>
      <SegmentedControl
        accessibilityLabel="Plan view"
        onChange={onViewChange}
        options={[
          { label: "Tasks", value: "tasks" },
          { label: "Events", value: "events" },
        ]}
        value={activeView}
      />
    </View>
  );
}
