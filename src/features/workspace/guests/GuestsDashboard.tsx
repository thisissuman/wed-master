import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import BedDouble from "lucide-react-native/icons/bed-double";
import Car from "lucide-react-native/icons/car";
import CheckCircle2 from "lucide-react-native/icons/circle-check";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Clock3 from "lucide-react-native/icons/clock-3";
import Mail from "lucide-react-native/icons/mail";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import Search from "lucide-react-native/icons/search";
import SlidersHorizontal from "lucide-react-native/icons/sliders-horizontal";
import XCircle from "lucide-react-native/icons/circle-x";
import { type ComponentRef, useDeferredValue, useMemo, useRef, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppText,
  CreatedItemPulse,
  EmptyState,
  ErrorState,
  FilterChip,
  FilterChoiceGroup,
  FilterPopover,
  FloatingActionButton,
  LoadingState,
  PersonAvatar,
  ProgressBar,
  Screen,
  StatusPill,
  TextField,
  useKeyboardSettledAction,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { isExpandedLayout, shouldStackCompactControls } from "@/lib/responsive";
import { tokens, useAppTheme } from "@/theme";

import { useCreatedItemHighlight } from "../created-item-highlight";
import { MoreScreenHeader } from "../more/MoreScreenHeader";
import { useWorkspace } from "../provider";
import {
  emptyGuestFilters,
  filterHouseholds,
  guestFilterCount,
  householdGuestCount,
  householdSummary,
  type GuestFilterState,
} from "../selectors";
import type { Household, HouseholdSide } from "../types";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const fabInset = Number.parseInt(tokens.spacing.md, 10);
const listBottomClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["4xl"], 10);

function sideLabel(side: HouseholdSide): string {
  if (side === "partnerOne") return "Partner one’s family";
  if (side === "partnerTwo") return "Partner two’s family";
  if (side === "both") return "Both families";
  return "Other guests";
}

function GuestSummaryPanel({
  confirmed,
  households,
  invited,
  stacked,
  totalGuests,
}: {
  confirmed: number;
  households: number;
  invited: number;
  stacked: boolean;
  totalGuests: number;
}) {
  const confirmationRate = totalGuests ? (confirmed / totalGuests) * 100 : 0;
  const metrics = [
    { label: "Households", value: households },
    { label: "Guests", value: totalGuests },
    { label: "Invited", value: invited },
  ];

  return (
    <View className="gap-sm rounded-card bg-surfaceMuted p-md">
      <View
        className={stacked ? "gap-2xs" : "flex-row items-center"}
        testID={stacked ? "guest-summary-strip-stacked" : "guest-summary-strip-inline"}
      >
        {metrics.map((item, index) =>
          stacked ? (
            <View
              accessibilityLabel={`${item.label}, ${item.value}`}
              accessibilityRole="text"
              accessible
              className="min-h-10 flex-row items-center justify-between px-sm"
              key={item.label}
            >
              <AppText tone="muted" variant="caption">
                {item.label}
              </AppText>
              <AppText style={{ fontVariant: ["tabular-nums"] }} tone="primary" variant="label">
                {item.value}
              </AppText>
            </View>
          ) : (
            <View className="flex-1 flex-row items-center" key={item.label}>
              {index ? <View className="h-8 w-px bg-borderStrong" /> : null}
              <View
                accessibilityLabel={`${item.label}, ${item.value}`}
                accessibilityRole="text"
                accessible
                className="min-h-12 flex-1 items-center justify-center gap-2xs px-xs"
              >
                <AppText style={{ fontVariant: ["tabular-nums"] }} tone="primary" variant="heading">
                  {item.value}
                </AppText>
                <AppText tone="muted" variant="metadata">
                  {item.label}
                </AppText>
              </View>
            </View>
          ),
        )}
      </View>
      <View className="gap-xs border-t border-borderSubtle pt-sm">
        <View className="flex-row items-center justify-between gap-sm">
          <AppText variant="label">RSVP progress</AppText>
          <AppText style={{ fontVariant: ["tabular-nums"] }} tone="muted" variant="caption">
            {confirmed} of {totalGuests} confirmed
          </AppText>
        </View>
        <ProgressBar
          accessibilityLabel={`RSVP progress, ${Math.round(confirmationRate)} percent`}
          tone="success"
          value={confirmationRate}
        />
      </View>
    </View>
  );
}

function rsvpPresentation(status: Household["rsvpStatus"]) {
  if (status === "Confirmed") return { icon: CheckCircle2, tone: "success" as const };
  if (status === "Declined") return { icon: XCircle, tone: "danger" as const };
  return { icon: Clock3, tone: "warning" as const };
}

function HouseholdCard({ household }: { household: Household }) {
  const theme = useAppTheme();
  const guestCount = householdGuestCount(household);
  const needsStay = household.accommodationStatus === "Needed";
  const needsTransport = household.transportStatus === "Needed";
  const rsvp = rsvpPresentation(household.rsvpStatus);
  const invitationTone =
    household.invitationStatus === "Delivered"
      ? "success"
      : household.invitationStatus === "Sent"
        ? "primary"
        : "neutral";

  return (
    <Pressable
      accessibilityHint={`${sideLabel(household.side)}. ${guestCount} guests. RSVP ${household.rsvpStatus.toLowerCase()}. Invitation ${household.invitationStatus.toLowerCase()}.`}
      accessibilityLabel={`Open household: ${household.name}`}
      accessibilityRole="button"
      android_ripple={{ color: theme.colors.surfaceMuted }}
      className="min-h-24 gap-sm overflow-hidden rounded-card bg-elevatedSurface p-md shadow-card active:bg-surfaceMuted"
      onPress={() => router.navigate(`/more/guests/${household.id}`)}
    >
      <View className="flex-row items-center gap-sm">
        <PersonAvatar name={household.name} />
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText numberOfLines={2} variant="heading">
            {household.name}
          </AppText>
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {sideLabel(household.side)} · {guestCount} {guestCount === 1 ? "guest" : "guests"}
          </AppText>
        </View>
        <ChevronRight color={theme.colors.textSecondary} size={tokens.iconSize.sm} />
      </View>
      <View className="flex-row flex-wrap gap-xs pl-14">
        <StatusPill icon={rsvp.icon} label={household.rsvpStatus} tone={rsvp.tone} />
        <StatusPill icon={Mail} label={household.invitationStatus} tone={invitationTone} />
        {needsStay ? <StatusPill icon={BedDouble} label="Stay needed" tone="warning" /> : null}
        {needsTransport ? <StatusPill icon={Car} label="Transport needed" tone="warning" /> : null}
      </View>
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
  const [filters, setFilters] = useState<GuestFilterState>(() => emptyGuestFilters());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterAnchorRef = useRef<ComponentRef<typeof Pressable>>(null);
  const deferredSearch = useDeferredValue(search);
  const columns = isExpandedLayout(width) ? 2 : 1;
  const stackSummary = shouldStackCompactControls(width, fontScale);
  const activeFilterCount = guestFilterCount(filters);
  const openFilters = useKeyboardSettledAction(() => setFiltersOpen(true));

  const filtered = useMemo(
    () =>
      filterHouseholds(workspace.data?.households ?? [], {
        ...filters,
        query: deferredSearch,
      }),
    [deferredSearch, filters, workspace.data?.households],
  );

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open guests"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening guests" />
      </Screen>
    );
  }

  const households = workspace.data.households;
  const summary = householdSummary(households);
  const totalGuests = households.reduce(
    (total, household) => total + householdGuestCount(household),
    0,
  );
  const clearFilters = () => {
    setSearch("");
    setFilters(emptyGuestFilters());
  };
  const hasActiveFilter = Boolean(search.trim()) || activeFilterCount > 0;
  const header = (
    <View className="gap-lg pb-md">
      <MoreScreenHeader title="Guests and households" />
      <GuestSummaryPanel
        confirmed={summary.confirmed}
        households={households.length}
        invited={summary.invited}
        stacked={stackSummary}
        totalGuests={totalGuests}
      />
      <TextField
        icon={Search}
        label="Search guests"
        onChangeText={setSearch}
        placeholder="Name or household"
        value={search}
      />
      <View className="flex-row items-center justify-between gap-sm">
        <AppText
          accessibilityLiveRegion="polite"
          className="min-w-0 flex-1"
          tone="muted"
          variant="caption"
        >
          {filtered.length} {filtered.length === 1 ? "household" : "households"}
        </AppText>
        <FilterChip
          count={activeFilterCount || undefined}
          icon={SlidersHorizontal}
          label="Filters"
          onPress={openFilters.run}
          ref={filterAnchorRef}
          selected={activeFilterCount > 0}
        />
      </View>
    </View>
  );

  return (
    <Screen>
      <FlashList
        testID="guest-list"
        contentContainerStyle={{
          padding: contentPadding,
          paddingBottom: listBottomClearance,
        }}
        data={filtered}
        key={`guest-grid-${columns}`}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            actionIcon={hasActiveFilter ? RotateCcw : undefined}
            actionLabel={hasActiveFilter ? "Clear filters" : undefined}
            description={
              hasActiveFilter ? "Try another name or clear the current filters." : undefined
            }
            onAction={hasActiveFilter ? clearFilters : undefined}
            title={hasActiveFilter ? "No matching households" : "No guests added"}
          />
        }
        ListHeaderComponent={header}
        numColumns={columns}
        renderItem={({ item }) => (
          <View className={`${columns > 1 ? "px-xs" : ""} pb-sm`}>
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
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
      <FloatingActionButton
        accessibilityHint="Opens the guest and household form"
        accessibilityLabel="Add guest or household"
        bottomInset={insets.bottom + fabInset}
        onPress={() => router.navigate("/more/guests/new")}
      />
      <FilterPopover
        activeCount={activeFilterCount}
        anchorRef={filterAnchorRef}
        onClose={() => setFiltersOpen(false)}
        onReset={() => setFilters(emptyGuestFilters())}
        title="Filter guests"
        visible={filtersOpen}
      >
        <FilterChoiceGroup
          label="RSVP status"
          onChange={(value) => {
            if (
              value === "All" ||
              value === "Pending" ||
              value === "Confirmed" ||
              value === "Declined"
            ) {
              setFilters((current) => ({ ...current, status: value }));
            }
          }}
          options={[
            { label: "All statuses", value: "All" },
            { label: "Pending", value: "Pending" },
            { label: "Confirmed", value: "Confirmed" },
            { label: "Declined", value: "Declined" },
          ]}
          value={filters.status}
        />
        <FilterChoiceGroup
          label="Support"
          onChange={(value) =>
            setFilters((current) => ({ ...current, needsSupport: value === "needed" }))
          }
          options={[
            { label: "Any support", value: "any" },
            { label: "Needs support", value: "needed" },
          ]}
          value={filters.needsSupport ? "needed" : "any"}
        />
      </FilterPopover>
    </Screen>
  );
}
