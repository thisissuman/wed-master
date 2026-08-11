import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { ArrowDownUp, Gift, IndianRupee, Plus, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FilterSheet,
  IconButton,
  LoadingState,
  Screen,
  SegmentedControl,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { formatInr, formatInrCompact } from "@/lib/money";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";

import { useWorkspace } from "../provider";
import type { GiftRecord } from "../types";
import { MoreScreenHeader } from "../more/MoreScreenHeader";

type GiftSort = "name" | "recent" | "value";

function Metric({
  accessibilityValue,
  divider,
  icon: Icon,
  label,
  stacked,
  value,
}: {
  accessibilityValue: string;
  divider: boolean;
  icon: typeof Gift;
  label: string;
  stacked: boolean;
  value: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${accessibilityValue}`}
      className={`min-w-0 ${
        stacked
          ? `min-h-12 flex-row items-center justify-between gap-sm py-xs ${
              divider ? "border-b border-borderSubtle" : ""
            }`
          : `flex-1 items-center gap-2xs px-xs ${divider ? "border-r border-borderSubtle" : ""}`
      }`}
    >
      <View className="flex-row items-center gap-2xs">
        <Icon color={tokens.colors.primary} size={tokens.iconSize.sm} />
        <AppText tone="muted" variant="caption">
          {label}
        </AppText>
      </View>
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        numberOfLines={1}
        style={{ fontVariant: ["tabular-nums"] }}
        tone="primary"
        variant="heading"
      >
        {value}
      </AppText>
    </View>
  );
}

function GiftCard({ gift }: { gift: GiftRecord }) {
  return (
    <Pressable
      accessibilityLabel={`Edit gift from ${gift.personName}`}
      accessibilityRole="button"
      className="min-h-20 flex-row items-center gap-sm rounded-card bg-accentSoft p-md"
      onPress={() => router.navigate({ pathname: "/more/gifts/edit", params: { id: gift.id } })}
    >
      <View className="h-12 w-12 items-center justify-center rounded-control bg-elevatedSurface">
        <Gift color={tokens.colors.accent} size={tokens.iconSize.md} />
      </View>
      <View className="min-w-0 flex-1 gap-2xs">
        <AppText numberOfLines={2} variant="heading">
          {gift.personName}
        </AppText>
        {gift.itemName || gift.relationship ? (
          <AppText numberOfLines={2} tone="muted" variant="caption">
            {[gift.itemName, gift.relationship].filter(Boolean).join(" · ")}
          </AppText>
        ) : (
          <AppText tone="muted" variant="caption">
            Received gift
          </AppText>
        )}
      </View>
      <AppText className="shrink-0 text-right" tone="primary" variant="heading">
        {gift.valuePaise !== undefined ? formatInr(gift.valuePaise) : "—"}
      </AppText>
    </Pressable>
  );
}

export function GiftsDashboard() {
  const workspace = useWorkspace();
  const { fontScale } = useWindowDimensions();
  const [sort, setSort] = useState<GiftSort>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const gifts = useMemo(() => {
    const filtered = (workspace.data?.gifts ?? []).filter(
      (gift) => (gift.kind ?? "Received") === "Received",
    );
    if (sort === "recent") return [...filtered].reverse();
    return [...filtered].sort((a, b) =>
      sort === "value"
        ? (b.valuePaise ?? 0) - (a.valuePaise ?? 0)
        : a.personName.localeCompare(b.personName),
    );
  }, [sort, workspace.data]);
  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError)
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open gifts"
          />
        </Screen>
      );
    return (
      <Screen>
        <LoadingState label="Opening gifts" />
      </Screen>
    );
  }
  const totalValue = gifts.reduce((sum, gift) => sum + (gift.valuePaise ?? 0), 0);
  const stackedSummary = isLargeText(fontScale);
  const sortLabel = sort === "value" ? "Highest value" : sort === "name" ? "Name" : "Most recent";
  const header = (
    <View className="gap-lg pb-md">
      <MoreScreenHeader title="Received gifts" />
      <Card
        className="p-sm"
        style={{ flexDirection: stackedSummary ? "column" : "row" }}
        testID="received-gift-summary"
      >
        <Metric
          accessibilityValue={String(gifts.length)}
          divider
          icon={Users}
          label="Total"
          stacked={stackedSummary}
          value={String(gifts.length)}
        />
        <Metric
          accessibilityValue={formatInr(totalValue)}
          divider={false}
          icon={IndianRupee}
          label="Value"
          stacked={stackedSummary}
          value={formatInrCompact(totalValue)}
        />
      </Card>
      <View className="flex-row items-center justify-between gap-sm">
        <AppText tone="muted" variant="caption">
          {gifts.length} {gifts.length === 1 ? "gift" : "gifts"}
        </AppText>
        <IconButton
          accessibilityLabel={`Sort gifts, ${sortLabel}`}
          icon={ArrowDownUp}
          onPress={() => setSortOpen(true)}
          variant="subtle"
        />
      </View>
    </View>
  );
  return (
    <Screen>
      <FlashList
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        data={gifts}
        ItemSeparatorComponent={() => <View className="h-sm" />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            actionLabel="Add gift"
            description="No received gifts have been recorded."
            onAction={() => router.navigate("/more/gifts/new")}
            title="No gifts yet"
          />
        }
        ListHeaderComponent={header}
        renderItem={({ item }) => <GiftCard gift={item} />}
        showsVerticalScrollIndicator={false}
      />
      {gifts.length ? (
        <View className="absolute bottom-md right-md">
          <Button
            icon={Plus}
            label="Add gift"
            onPress={() => router.navigate("/more/gifts/new")}
            variant="primary"
          />
        </View>
      ) : null}
      <FilterSheet
        clearLabel="Use most recent"
        closeLabel="Close sort"
        doneLabel="Done"
        onClear={() => setSort("recent")}
        onClose={() => setSortOpen(false)}
        title="Sort gifts"
        visible={sortOpen}
      >
        <SegmentedControl<GiftSort>
          accessibilityLabel="Gift sort order"
          onChange={setSort}
          options={[
            { label: "Recent", value: "recent" },
            { label: "Value", value: "value" },
            { label: "Name", value: "name" },
          ]}
          value={sort}
        />
      </FilterSheet>
    </Screen>
  );
}
