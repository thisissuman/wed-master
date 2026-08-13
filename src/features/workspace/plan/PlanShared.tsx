import { View } from "react-native";

import { PageHeader, SegmentedControl } from "@/components/ui";

export type PlanView = "events" | "tasks";

export function PlanHeader({
  activeView,
  onViewChange,
}: {
  activeView: PlanView;
  onViewChange: (view: PlanView) => void;
}) {
  return (
    <View className="gap-md">
      <PageHeader title="Plan" />
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
