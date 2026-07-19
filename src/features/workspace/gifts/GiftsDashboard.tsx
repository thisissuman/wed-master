import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { CheckCircle2, Gift, IndianRupee, Plus, Users } from "lucide-react-native";
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
  SegmentedControl,
  SelectField,
  StatusBadge,
} from "@/components/ui";
import { formatShortDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { formatInr } from "@/lib/money";
import { tokens } from "@/theme";

import { useWorkspace } from "../provider";
import type { GiftKind, GiftRecord } from "../types";
import { MoreScreenHeader } from "../more/MoreScreenHeader";

function Metric({ icon: Icon, label, value }: { icon: typeof Gift; label: string; value: string }) {
  return (
    <View className="w-1/2 items-center gap-2xs py-xs">
      <View className="rounded-full bg-primarySoft p-sm">
        <Icon color={tokens.colors.primary} size={tokens.iconSize.md} />
      </View>
      <AppText tone="primary" variant="heading">
        {value}
      </AppText>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function GiftCard({ gift }: { gift: GiftRecord }) {
  const initials = gift.personName
    .split(/\s+|&/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <Pressable
      accessibilityLabel={`Edit gift from ${gift.personName}`}
      accessibilityRole="button"
      className="min-h-28 gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-md shadow-card"
      onPress={() => router.push({ pathname: "/more/gifts/edit", params: { id: gift.id } })}
    >
      <View className="flex-row items-start gap-sm">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
          <AppText tone="onPrimary" variant="label">
            {initials}
          </AppText>
        </View>
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText numberOfLines={2} variant="heading">
            {gift.personName}
          </AppText>
          {gift.relationship ? (
            <AppText tone="muted" variant="caption">
              {gift.relationship}
            </AppText>
          ) : null}
          <View className="flex-row flex-wrap items-center gap-xs">
            <Gift color={tokens.colors.primary} size={tokens.iconSize.sm} />
            <AppText>{gift.itemName}</AppText>
            {gift.valuePaise !== undefined ? (
              <AppText variant="label">
                {formatInr(gift.valuePaise)}
                {gift.valueIsEstimated ? " (Est.)" : ""}
              </AppText>
            ) : null}
          </View>
        </View>
        {gift.date ? (
          <AppText tone="muted" variant="caption">
            {formatShortDateOnly(gift.date)}
          </AppText>
        ) : null}
      </View>
      <View className="flex-row flex-wrap gap-xs pl-14">
        <StatusBadge
          label={`Thanked: ${gift.thankedStatus}`}
          tone={gift.thankedStatus === "Done" ? "success" : "warning"}
        />
        <StatusBadge
          label={`Return: ${gift.returnGiftStatus}`}
          tone={gift.returnGiftStatus === "Done" ? "success" : "warning"}
        />
      </View>
    </Pressable>
  );
}

export function GiftsDashboard() {
  const workspace = useWorkspace();
  const [kind, setKind] = useState<GiftKind>("Received");
  const [sort, setSort] = useState("recent");
  const gifts = useMemo(() => {
    const filtered = (workspace.data?.gifts ?? []).filter((gift) => gift.kind === kind);
    return [...filtered].sort((a, b) =>
      sort === "value"
        ? (b.valuePaise ?? 0) - (a.valuePaise ?? 0)
        : sort === "name"
          ? a.personName.localeCompare(b.personName)
          : (b.date ?? "").localeCompare(a.date ?? ""),
    );
  }, [kind, sort, workspace.data]);
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
  const thanked = gifts.filter((gift) => gift.thankedStatus === "Done").length;
  const returned = gifts.filter((gift) => gift.returnGiftStatus === "Done").length;
  const header = (
    <View className="gap-xl pb-lg">
      <MoreScreenHeader title="Gifts" weddingName={workspace.data.wedding.name} />
      <AppText tone="muted">Track gifts, values, thank-yous, and return gifts.</AppText>
      <SegmentedControl
        accessibilityLabel="Gift type"
        onChange={(value) => setKind(value as GiftKind)}
        options={[
          { label: "Given", value: "Given" },
          { label: "Received", value: "Received" },
          { label: "Return gifts", value: "Return Gift" },
        ]}
        value={kind}
      />
      <Card className="flex-row flex-wrap">
        <Metric icon={Users} label="Total" value={String(gifts.length)} />
        <Metric icon={IndianRupee} label="Value" value={formatInr(totalValue)} />
        <Metric icon={CheckCircle2} label="Thanked" value={String(thanked)} />
        <Metric icon={Gift} label="Returned" value={String(returned)} />
      </Card>
      <SelectField
        label="Sort"
        onChange={setSort}
        options={[
          { label: "Most recent", value: "recent" },
          { label: "Highest value", value: "value" },
          { label: "Name", value: "name" },
        ]}
        value={sort}
      />
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
            description={`No ${kind.toLowerCase()} gifts have been recorded.`}
            onAction={() => router.push({ pathname: "/more/gifts/new", params: { kind } })}
            title="No gifts yet"
          />
        }
        ListHeaderComponent={header}
        renderItem={({ item }) => <GiftCard gift={item} />}
        showsVerticalScrollIndicator={false}
      />
      <View className="absolute bottom-md right-md">
        <Button
          icon={Plus}
          label="Add gift"
          onPress={() => router.push({ pathname: "/more/gifts/new", params: { kind } })}
          variant="primary"
        />
      </View>
    </Screen>
  );
}
