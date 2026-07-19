import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  ConfirmationDialog,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
  StatusBadge,
} from "@/components/ui";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { householdGuestCount } from "../selectors";
import { rsvpStatuses, type Guest } from "../types";

function nextRsvp(guest: Guest): Guest["rsvpStatus"] {
  const index = rsvpStatuses.indexOf(guest.rsvpStatus);
  return rsvpStatuses[(index + 1) % rsvpStatuses.length];
}

export function HouseholdDetail({ householdId }: { householdId: string }) {
  const workspace = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!workspace.data) {
    return (
      <Screen>
        <LoadingState label="Opening household" />
      </Screen>
    );
  }
  const household = workspace.data.households.find((item) => item.id === householdId);
  if (!household) {
    return (
      <Screen className="justify-center p-md">
        <ErrorState message="This household may have been deleted." title="Household not found" />
      </Screen>
    );
  }
  const totalGuests = householdGuestCount(household);
  const unnamedGuests = Math.max(0, totalGuests - household.guests.length);
  const remove = async () => {
    await mutation.mutateAsync((repositories) =>
      repositories.households.deleteHousehold(household.id),
    );
    router.back();
  };
  const cycleRsvp = (guest: Guest) => {
    mutation.mutate((repositories) =>
      repositories.households.updateHousehold({
        ...household,
        guests: household.guests.map((item) =>
          item.id === guest.id ? { ...item, rsvpStatus: nextRsvp(item) } : item,
        ),
      }),
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-xl p-md pb-2xl">
        <MoreScreenHeader title={household.name} weddingName={workspace.data.wedding.name} />
        <Card className="gap-md">
          <View className="flex-row justify-between">
            <AppText>Guest count</AppText>
            <AppText variant="label">{totalGuests}</AppText>
          </View>
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
        </Card>
        <View className="gap-xs">
          <SectionHeader title="Guests" />
          <AppText tone="muted" variant="caption">
            Tap a guest to move between Pending, Confirmed, and Declined.
          </AppText>
          {household.guests.map((guest) => (
            <Pressable
              accessibilityLabel={`${guest.name}, RSVP ${guest.rsvpStatus}. Change RSVP`}
              accessibilityRole="button"
              accessibilityState={{ disabled: mutation.isPending }}
              className="min-h-14 flex-row items-center justify-between rounded-card border border-borderSubtle bg-elevatedSurface px-lg shadow-card"
              disabled={mutation.isPending}
              key={guest.id}
              onPress={() => cycleRsvp(guest)}
            >
              <AppText>{guest.name}</AppText>
              <StatusBadge
                label={guest.rsvpStatus}
                tone={
                  guest.rsvpStatus === "Confirmed"
                    ? "success"
                    : guest.rsvpStatus === "Declined"
                      ? "danger"
                      : "warning"
                }
              />
            </Pressable>
          ))}
          {unnamedGuests ? (
            <View className="min-h-14 justify-center rounded-card border border-dashed border-borderStrong bg-surfaceMuted px-lg">
              <AppText tone="muted">
                {unnamedGuests} {unnamedGuests === 1 ? "guest name" : "guest names"} can be added
                later
              </AppText>
            </View>
          ) : null}
        </View>
        {household.notes ? (
          <Card className="gap-xs">
            <SectionHeader title="Notes" />
            <AppText>{household.notes}</AppText>
          </Card>
        ) : null}
        <Button
          label="Edit household"
          onPress={() =>
            router.push({ pathname: "/more/guests/new", params: { id: household.id } })
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
        description="All guests in this household will be removed from this device."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void remove()}
        pending={mutation.isPending}
        title="Delete this household?"
        visible={deleteOpen}
      />
    </Screen>
  );
}
