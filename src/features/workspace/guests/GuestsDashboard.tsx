import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  BedDouble,
  Car,
  ChevronRight,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Users,
} from "lucide-react-native";
import { useDeferredValue, useMemo, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppText,
  CreatedItemPulse,
  EmptyState,
  ErrorState,
  LoadingState,
  MotionPressable,
  Screen,
  TextField,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { shouldStackCompactControls } from "@/lib/responsive";
import { tokens } from "@/theme";

import { useWorkspace } from "../provider";
import { useCreatedItemHighlight } from "../created-item-highlight";
import { filterHouseholds, householdGuestCount, householdSummary } from "../selectors";
import type { Household, HouseholdSide } from "../types";
import { MoreScreenHeader } from "../more/MoreScreenHeader";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const fabInset = Number.parseInt(tokens.spacing.md, 10);
const listBottomClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["4xl"], 10);

function sideLabel(side: HouseholdSide): string {
  if (side === "partnerOne") return "Partner one’s family";
  if (side === "partnerTwo") return "Partner two’s family";
  if (side === "both") return "Both families";
  return "Other guests";
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <View
      accessibilityLabel={`${label}, ${value}`}
      accessibilityRole="text"
      accessible
      className="min-h-12 flex-1 flex-row items-center justify-center gap-2xs px-xs"
    >
      <AppText variant="caption">{label}</AppText>
      <AppText style={{ fontVariant: ["tabular-nums"] }} tone="primary" variant="label">
        {value}
      </AppText>
    </View>
  );
}

function GuestSummaryStrip({
  confirmed,
  households,
  invited,
  stacked,
}: {
  confirmed: number;
  households: number;
  invited: number;
  stacked: boolean;
}) {
  const items = [
    { label: "Households", value: households },
    { label: "Invited", value: invited },
    { label: "Confirmed", value: confirmed },
  ];

  if (stacked) {
    return (
      <View
        className="gap-2xs rounded-control bg-surfaceMuted p-xs"
        testID="guest-summary-strip-stacked"
      >
        {items.map((item) => (
          <View
            accessibilityLabel={`${item.label}, ${item.value}`}
            accessibilityRole="text"
            accessible
            className="min-h-10 flex-row items-center justify-between px-sm"
            key={item.label}
          >
            <AppText variant="caption">{item.label}</AppText>
            <AppText style={{ fontVariant: ["tabular-nums"] }} tone="primary" variant="label">
              {item.value}
            </AppText>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center rounded-control bg-surfaceMuted px-xs"
      testID="guest-summary-strip-inline"
    >
      <SummaryItem label="Households" value={households} />
      <View className="h-6 w-px bg-borderStrong" />
      <SummaryItem label="Invited" value={invited} />
      <View className="h-6 w-px bg-borderStrong" />
      <SummaryItem label="Confirmed" value={confirmed} />
    </View>
  );
}

function HouseholdCard({ household }: { household: Household }) {
  const guestCount = householdGuestCount(household);
  const needsStay = household.accommodationStatus === "Needed";
  const needsTransport = household.transportStatus === "Needed";

  return (
    <Pressable
      accessibilityHint={`${sideLabel(household.side)}. ${guestCount} guests. RSVP ${household.rsvpStatus.toLowerCase()}. Invitation ${household.invitationStatus.toLowerCase()}.`}
      accessibilityLabel={`Open household: ${household.name}`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.surfaceMuted }}
      className="min-h-20 gap-xs rounded-control border border-borderSubtle bg-elevatedSurface p-sm active:bg-surfaceMuted"
      onPress={() => router.navigate(`/more/guests/${household.id}`)}
    >
      <View className="flex-row items-center gap-sm">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primarySoft">
          <Users color={tokens.colors.primary} size={tokens.iconSize.sm} />
        </View>
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText numberOfLines={2} variant="heading">
            {household.name}
          </AppText>
          <AppText tone="muted" variant="caption">
            {sideLabel(household.side)}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-xs">
            <AppText variant="caption">
              {guestCount} {guestCount === 1 ? "guest" : "guests"} · {household.rsvpStatus}
            </AppText>
            <View className="flex-row items-center gap-2xs">
              <Mail
                color={
                  household.invitationStatus === "Delivered"
                    ? tokens.colors.success
                    : tokens.colors.warning
                }
                size={tokens.iconSize.sm}
              />
              <AppText variant="caption">{household.invitationStatus}</AppText>
            </View>
          </View>
        </View>
        <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
      </View>
      {needsStay || needsTransport ? (
        <View className="flex-row flex-wrap gap-xs pl-12">
          {needsStay ? (
            <View className="flex-row items-center gap-2xs rounded-full bg-warningSoft px-xs py-2xs">
              <BedDouble color={tokens.colors.warning} size={tokens.iconSize.sm} />
              <AppText tone="warning" variant="caption">
                Stay needed
              </AppText>
            </View>
          ) : null}
          {needsTransport ? (
            <View className="flex-row items-center gap-2xs rounded-full bg-warningSoft px-xs py-2xs">
              <Car color={tokens.colors.warning} size={tokens.iconSize.sm} />
              <AppText tone="warning" variant="caption">
                Transport needed
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export function GuestsDashboard() {
  const { fontScale, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const workspace = useWorkspace();
  const createdHighlight = useCreatedItemHighlight((state) => state.current);
  const clearCreatedHighlight = useCreatedItemHighlight((state) => state.clear);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const stackCompactControls = shouldStackCompactControls(width, fontScale);

  const filtered = useMemo(
    () =>
      filterHouseholds(workspace.data?.households ?? [], {
        query: deferredSearch,
        side: "all",
        status: "all",
      }),
    [deferredSearch, workspace.data?.households],
  );

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
  const summary = householdSummary(households);

  const header = (
    <View className="gap-lg pb-md">
      <MoreScreenHeader title="Guests and households" />
      <GuestSummaryStrip
        confirmed={summary.confirmed}
        households={households.length}
        invited={summary.invited}
        stacked={stackCompactControls}
      />
      <TextField
        icon={Search}
        label="Search by name"
        onChangeText={setSearch}
        placeholder="Household name"
        value={search}
      />
      <AppText tone="muted" variant="caption">
        {filtered.length} households
      </AppText>
    </View>
  );

  return (
    <Screen>
      <FlashList
        contentContainerStyle={{
          padding: contentPadding,
          paddingBottom: listBottomClearance,
        }}
        data={filtered}
        ItemSeparatorComponent={() => <View className="h-sm" />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            actionIcon={households.length ? RotateCcw : undefined}
            actionLabel={households.length ? "Clear search" : undefined}
            description={households.length ? "Try another household or guest name." : undefined}
            onAction={households.length ? () => setSearch("") : undefined}
            title={households.length ? "No matching names" : "No guests added"}
          />
        }
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <CreatedItemPulse
            active={Boolean(
              createdHighlight?.kind === "household" && createdHighlight.ids.includes(item.id),
            )}
            onFinished={() => {
              if (createdHighlight) clearCreatedHighlight(createdHighlight.nonce);
            }}
          >
            <HouseholdCard household={item} />
          </CreatedItemPulse>
        )}
        showsVerticalScrollIndicator={false}
      />
      <View className="absolute right-md" style={{ bottom: insets.bottom + fabInset }}>
        <MotionPressable
          accessibilityHint="Opens the guest and household form"
          accessibilityLabel="Add guest or household"
          accessibilityRole="button"
          android_ripple={{ color: tokens.colors.primarySoft, radius: 28 }}
          className="h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-primary bg-primary shadow-elevated active:opacity-90"
          onPress={() => {
            void Haptics.selectionAsync();
            router.navigate("/more/guests/new");
          }}
          pressedScale={0.96}
        >
          <Plus color={tokens.colors.onPrimary} size={tokens.iconSize.lg} strokeWidth={2.2} />
        </MotionPressable>
      </View>
    </Screen>
  );
}
