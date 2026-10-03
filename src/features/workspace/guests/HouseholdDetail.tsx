import { router } from "expo-router";
import BedDouble from "lucide-react-native/icons/bed-double";
import Car from "lucide-react-native/icons/car";
import Mail from "lucide-react-native/icons/mail";
import NotebookPen from "lucide-react-native/icons/notebook-pen";
import Pencil from "lucide-react-native/icons/pencil";
import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import {
  AppText,
  Button,
  ConfirmationDialog,
  LoadingState,
  PersonAvatar,
  Screen,
  StatusPill,
} from "@/components/ui";
import { tokens, useAppTheme } from "@/theme";
import { useFeedbackStore } from "@/features/feedback/feedback-store";

import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useWorkspace, useWorkspaceMutation } from "../provider";
import { RouteNotFound } from "../routes/RouteStates";
import { householdGuestCount } from "../selectors";
import type { Household, HouseholdSide } from "../types";

function sideLabel(side: HouseholdSide): string {
  if (side === "partnerOne") return "Partner one’s family";
  if (side === "partnerTwo") return "Partner two’s family";
  if (side === "both") return "Both families";
  return "Other guests";
}

function rsvpTone(status: Household["rsvpStatus"]) {
  if (status === "Confirmed") return "success" as const;
  if (status === "Declined") return "danger" as const;
  return "warning" as const;
}

function PlanningRow({
  icon: Icon,
  label,
  status,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  status: string;
  tone: "neutral" | "primary" | "success" | "warning";
}) {
  const theme = useAppTheme();

  return (
    <View className="min-h-16 flex-row items-center gap-sm py-sm">
      <View className="h-11 w-11 items-center justify-center rounded-control bg-primarySoft">
        <Icon color={theme.colors.primary} size={tokens.iconSize.md} />
      </View>
      <AppText className="min-w-0 flex-1" variant="label">
        {label}
      </AppText>
      <StatusPill label={status} tone={tone} />
    </View>
  );
}

export function HouseholdDetail({ householdId }: { householdId: string }) {
  const theme = useAppTheme();
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
  const invitationTone =
    household.invitationStatus === "Delivered"
      ? "success"
      : household.invitationStatus === "Sent"
        ? "primary"
        : "neutral";
  const serviceTone = (status: Household["accommodationStatus"]) =>
    status === "Booked" ? "success" : status === "Needed" ? "warning" : "neutral";

  return (
    <Screen edges={["top", "right", "bottom", "left"]}>
      <ScrollView
        contentContainerClassName="gap-lg p-md pb-2xl"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-3xl self-center gap-lg">
          <MoreScreenHeader title="Household details" />

          <View className="gap-lg rounded-card bg-elevatedSurface p-lg shadow-card">
            <View className="flex-row items-center gap-md">
              <PersonAvatar name={household.name} size="lg" />
              <View className="min-w-0 flex-1 gap-2xs">
                <AppText accessibilityRole="header" variant="title">
                  {household.name}
                </AppText>
                <AppText tone="muted" variant="caption">
                  {sideLabel(household.side)}
                </AppText>
              </View>
              <StatusPill label={household.rsvpStatus} tone={rsvpTone(household.rsvpStatus)} />
            </View>
            <View className="flex-row items-center justify-between rounded-control bg-primarySoft px-md py-sm">
              <View className="gap-2xs">
                <AppText tone="muted" variant="metadata">
                  Guest count
                </AppText>
                <AppText style={{ fontVariant: ["tabular-nums"] }} tone="primary" variant="heading">
                  {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
                </AppText>
              </View>
              <AppText tone="muted" variant="caption">
                Household RSVP
              </AppText>
            </View>
          </View>

          <View className="rounded-card bg-surfaceMuted px-md py-xs">
            <AppText className="pb-xs pt-sm" variant="heading">
              Planning details
            </AppText>
            <PlanningRow
              icon={Mail}
              label="Invitation"
              status={household.invitationStatus}
              tone={invitationTone}
            />
            <View className="h-px bg-borderSubtle" />
            <PlanningRow
              icon={BedDouble}
              label="Accommodation"
              status={household.accommodationStatus}
              tone={serviceTone(household.accommodationStatus)}
            />
            <View className="h-px bg-borderSubtle" />
            <PlanningRow
              icon={Car}
              label="Transport"
              status={household.transportStatus}
              tone={serviceTone(household.transportStatus)}
            />
          </View>

          {household.notes ? (
            <View className="gap-sm rounded-card bg-elevatedSurface p-lg">
              <View className="flex-row items-center gap-xs">
                <NotebookPen color={theme.colors.primary} size={tokens.iconSize.sm} />
                <AppText variant="heading">Notes</AppText>
              </View>
              <AppText selectable>{household.notes}</AppText>
            </View>
          ) : null}

          <Button
            icon={Pencil}
            label="Edit household"
            onPress={() =>
              router.navigate({ pathname: "/more/guests/new", params: { id: household.id } })
            }
          />
          <View className="border-t border-borderSubtle pt-sm">
            <Button
              label="Delete household"
              onPress={() => setDeleteOpen(true)}
              variant="dangerGhost"
            />
          </View>
        </View>
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
