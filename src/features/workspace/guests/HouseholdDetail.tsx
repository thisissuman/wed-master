import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  LoadingState,
  Screen,
  StatusBadge,
} from "@/components/ui";
import { useFeedbackStore } from "@/features/feedback/feedback-store";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { RouteNotFound } from "../routes/RouteStates";
import { householdGuestCount } from "../selectors";

export function HouseholdDetail({ householdId }: { householdId: string }) {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const showFeedback = useFeedbackStore((state) => state.show);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!workspace.data) {
    return (
      <Screen edges={["top", "right", "bottom", "left"]}>
        <LoadingState label="Opening household" />
      </Screen>
    );
  }
  const household = workspace.data.households.find((item) => item.id === householdId);
  if (!household) {
    return <RouteNotFound entity="Household" fallback="/more/guests" />;
  }
  const totalGuests = householdGuestCount(household);
  const remove = async () => {
    await mutation.mutateAsync((repositories) =>
      repositories.households.deleteHousehold(household.id),
    );
    showFeedback({
      actionLabel: "Undo",
      message: "Household deleted",
      onAction: () =>
        mutation.mutateAsync((repositories) => repositories.households.restoreHousehold(household)),
    });
    router.back();
  };

  return (
    <Screen edges={["top", "right", "bottom", "left"]}>
      <ScrollView contentContainerClassName="gap-lg p-md pb-2xl">
        <MoreScreenHeader title={household.name} />
        <Card className="gap-sm shadow-none">
          <View className="flex-row justify-between">
            <AppText>Guest count</AppText>
            <AppText variant="label">{totalGuests}</AppText>
          </View>
          <View className="flex-row items-center justify-between gap-sm rounded-control bg-primarySoft px-sm py-xs">
            <AppText>Household RSVP</AppText>
            <StatusBadge
              label={household.rsvpStatus}
              tone={
                household.rsvpStatus === "Confirmed"
                  ? "success"
                  : household.rsvpStatus === "Declined"
                    ? "danger"
                    : "warning"
              }
            />
          </View>
        </Card>
        <View className="gap-sm rounded-card bg-surfaceMuted p-md">
          <AppText variant="heading">Planning details</AppText>
          <View className="flex-row justify-between">
            <AppText>Invitation</AppText>
            <StatusBadge
              label={household.invitationStatus}
              tone={household.invitationStatus === "Delivered" ? "success" : "neutral"}
            />
          </View>
          <View className="flex-row justify-between">
            <AppText>Accommodation</AppText>
            <StatusBadge
              label={household.accommodationStatus}
              tone={household.accommodationStatus === "Booked" ? "success" : "neutral"}
            />
          </View>
          <View className="flex-row justify-between">
            <AppText>Transport</AppText>
            <StatusBadge
              label={household.transportStatus}
              tone={household.transportStatus === "Booked" ? "success" : "neutral"}
            />
          </View>
          {household.notes ? (
            <View className="gap-2xs border-t border-borderStrong pt-sm">
              <AppText tone="muted" variant="caption">
                Notes
              </AppText>
              <AppText>{household.notes}</AppText>
            </View>
          ) : null}
        </View>
        <Button
          label="Edit household"
          onPress={() =>
            router.navigate({ pathname: "/more/guests/new", params: { id: household.id } })
          }
        />
        <Button
          label="Delete household"
          onPress={() => setDeleteOpen(true)}
          variant="dangerGhost"
        />
      </ScrollView>
      <ConfirmationDialog
        confirmLabel="Delete household"
        description="This household and its planning details will be removed from this device."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void remove()}
        pending={mutation.isPending}
        title="Delete this household?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
