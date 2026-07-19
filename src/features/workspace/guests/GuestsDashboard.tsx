import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { BedDouble, Car, CheckCircle2, ChevronRight, Mail, Plus, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SelectField,
  TextField,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";

import { useWorkspace } from "../provider";
import { householdGuestCount } from "../selectors";
import type { Household, HouseholdSide } from "../types";
import { MoreScreenHeader } from "../more/MoreScreenHeader";

function sideLabel(side: HouseholdSide, weddingName: string): string {
  const names = weddingName
    .split(/&|\band\b/i)
    .map((name) => name.trim())
    .filter(Boolean);
  if (side === "partnerOne") return `${names[0] ?? "Partner one"}'s family`;
  if (side === "partnerTwo") return `${names[1] ?? "Partner two"}'s family`;
  if (side === "both") return "Both families";
  return "Other guests";
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <View className="w-1/3 items-center gap-2xs py-xs">
      <Icon color={tokens.colors.primary} size={tokens.iconSize.md} />
      <AppText tone="primary" variant="heading">
        {value}
      </AppText>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function HouseholdCard({ household, weddingName }: { household: Household; weddingName: string }) {
  const confirmed = household.guests.filter((guest) => guest.rsvpStatus === "Confirmed").length;
  const accommodationLabel =
    household.accommodationStatus === "Booked"
      ? "Stay booked"
      : household.accommodationStatus === "Needed"
        ? "Stay needed"
        : "No stay needed";
  const transportLabel =
    household.transportStatus === "Booked"
      ? "Transport booked"
      : household.transportStatus === "Needed"
        ? "Transport needed"
        : "No transport needed";
  return (
    <Pressable
      accessibilityLabel={`Open ${household.name}`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.surfaceMuted }}
      className="min-h-24 gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-md shadow-card"
      onPress={() => router.push(`/more/guests/${household.id}`)}
    >
      <View className="flex-row items-center gap-sm">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primarySoft">
          <Users color={tokens.colors.primary} size={tokens.iconSize.md} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText numberOfLines={1} variant="heading">
            {household.name}
          </AppText>
          <AppText tone="muted" variant="caption">
            {sideLabel(household.side, weddingName)}
          </AppText>
        </View>
        <View className="items-center">
          <AppText variant="heading">{householdGuestCount(household)}</AppText>
          <AppText tone="muted" variant="caption">
            Guests
          </AppText>
        </View>
        <View className="items-center">
          <AppText variant="heading">{confirmed}</AppText>
          <AppText tone="muted" variant="caption">
            Confirmed
          </AppText>
        </View>
        <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
      </View>
      <View className="flex-row flex-wrap gap-xs pl-14">
        <View className="flex-row items-center gap-2xs">
          <BedDouble
            color={
              household.accommodationStatus === "Booked"
                ? tokens.colors.success
                : tokens.colors.textSecondary
            }
            size={tokens.iconSize.sm}
          />
          <AppText variant="caption">{accommodationLabel}</AppText>
        </View>
        <View className="flex-row items-center gap-2xs">
          <Car
            color={
              household.transportStatus === "Booked"
                ? tokens.colors.success
                : tokens.colors.textSecondary
            }
            size={tokens.iconSize.sm}
          />
          <AppText variant="caption">{transportLabel}</AppText>
        </View>
        <View className="flex-row items-center gap-2xs">
          <Mail
            color={
              household.invitationStatus === "Delivered"
                ? tokens.colors.success
                : tokens.colors.warning
            }
            size={tokens.iconSize.sm}
          />
          <AppText variant="caption">Invite {household.invitationStatus.toLowerCase()}</AppText>
        </View>
      </View>
    </Pressable>
  );
}

export function GuestsDashboard() {
  const workspace = useWorkspace();
  const [side, setSide] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!workspace.data) return [];
    const query = search.trim().toLowerCase();
    return workspace.data.households.filter((household) => {
      const sideMatches = side === "all" || household.side === side;
      const statusMatches =
        status === "all" || household.guests.some((guest) => guest.rsvpStatus === status);
      const searchMatches =
        !query ||
        household.name.toLowerCase().includes(query) ||
        household.guests.some((guest) => guest.name.toLowerCase().includes(query));
      return sideMatches && statusMatches && searchMatches;
    });
  }, [search, side, status, workspace.data]);

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError)
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open guests"
          />
        </Screen>
      );
    return (
      <Screen>
        <LoadingState label="Opening guests" />
      </Screen>
    );
  }
  const households = workspace.data.households;
  const allGuests = households.flatMap((household) => household.guests);
  const invited = households
    .filter((household) => household.invitationStatus !== "Not Sent")
    .reduce((sum, household) => sum + householdGuestCount(household), 0);
  const confirmed = allGuests.filter((guest) => guest.rsvpStatus === "Confirmed").length;
  const stayBooked = households
    .filter((household) => household.accommodationStatus === "Booked")
    .reduce((sum, household) => sum + householdGuestCount(household), 0);
  const transportBooked = households
    .filter((household) => household.transportStatus === "Booked")
    .reduce((sum, household) => sum + householdGuestCount(household), 0);

  const header = (
    <View className="gap-xl pb-lg">
      <MoreScreenHeader title="Guests and households" weddingName={workspace.data.wedding.name} />
      <Card className="flex-row flex-wrap">
        <Summary icon={Users} label="Households" value={households.length} />
        <Summary icon={Mail} label="Invited" value={invited} />
        <Summary icon={CheckCircle2} label="Confirmed" value={confirmed} />
        <Summary icon={BedDouble} label="Stay" value={stayBooked} />
        <Summary icon={Car} label="Transport" value={transportBooked} />
      </Card>
      <TextField
        label="Search"
        onChangeText={setSearch}
        placeholder="Household or guest name"
        value={search}
      />
      <View className="flex-row gap-sm">
        <View className="flex-1">
          <SelectField
            label="Side"
            onChange={setSide}
            options={[
              { label: "All sides", value: "all" },
              { label: "Partner one", value: "partnerOne" },
              { label: "Partner two", value: "partnerTwo" },
              { label: "Both families", value: "both" },
              { label: "Other", value: "other" },
            ]}
            value={side}
          />
        </View>
        <View className="flex-1">
          <SelectField
            label="RSVP"
            onChange={setStatus}
            options={[
              { label: "All statuses", value: "all" },
              { label: "Pending", value: "Pending" },
              { label: "Confirmed", value: "Confirmed" },
              { label: "Declined", value: "Declined" },
            ]}
            value={status}
          />
        </View>
      </View>
      <AppText tone="muted" variant="caption">
        {filtered.length} households
      </AppText>
    </View>
  );

  return (
    <Screen>
      <FlashList
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        data={filtered}
        ItemSeparatorComponent={() => <View className="h-sm" />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            actionLabel={households.length ? undefined : "Add household"}
            description={
              households.length
                ? "Try a different search or filter."
                : "Add your first household to manage invitations and RSVPs."
            }
            imageSource={
              households.length
                ? undefined
                : require("../../../../assets/images/mangalya/empty-guests.jpg")
            }
            onAction={households.length ? undefined : () => router.push("/more/guests/new")}
            title={households.length ? "No matching households" : "No guests added"}
          />
        }
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <HouseholdCard household={item} weddingName={workspace.data.wedding.name} />
        )}
        showsVerticalScrollIndicator={false}
      />
      <View className="absolute bottom-md right-md">
        <Button
          icon={Plus}
          label="Add household"
          onPress={() => router.push("/more/guests/new")}
          variant="primary"
        />
      </View>
    </Screen>
  );
}
