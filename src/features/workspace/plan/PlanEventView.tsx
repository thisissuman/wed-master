import { Pressable, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { memo } from "react";
import {
  CalendarHeart,
  Diamond,
  Flame,
  Flower2,
  Hand,
  HeartHandshake,
  House,
  Music2,
  Pencil,
} from "lucide-react-native";

import { AppText, EmptyState, IconButton } from "@/components/ui";
import { tokens } from "@/theme";

import type { EventIconKey, WeddingEvent } from "../types";
import { PlanHeader, type PlanView } from "./PlanShared";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const itemGap = Number.parseInt(tokens.spacing.sm, 10);
const listFooterClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["2xl"], 10) * 2;

const eventColorByKey = {
  botanical: { color: tokens.colors.primary, soft: tokens.colors.primarySoft },
  gold: { color: tokens.colors.warning, soft: tokens.colors.accentSoft },
  terracotta: { color: tokens.colors.danger, soft: tokens.colors.dangerSoft },
  sage: { color: tokens.colors.success, soft: tokens.colors.successSoft },
} as const;

function iconKeyForEvent(event: WeddingEvent): EventIconKey {
  if (event.iconKey) return event.iconKey;
  const normalized = event.name.toLowerCase();
  if (/engagement|nirbandha/.test(normalized)) return "rings";
  if (/haldi/.test(normalized)) return "sparkles";
  if (/mehendi|henna/.test(normalized)) return "hand";
  if (/wedding|bahaghara|marriage/.test(normalized)) return "mandap";
  if (/reception|sangeet|music/.test(normalized)) return "music";
  if (/gruhapravesh|house|home/.test(normalized)) return "home";
  if (/puja|pooja|havan/.test(normalized)) return "lamp";
  return "calendar";
}

function EventIcon({ color, event }: { color: string; event: WeddingEvent }) {
  const props = { color, size: tokens.iconSize.md };
  switch (iconKeyForEvent(event)) {
    case "rings":
      return <Diamond {...props} />;
    case "sparkles":
      return <Flower2 {...props} />;
    case "hand":
      return <Hand {...props} />;
    case "mandap":
      return <HeartHandshake {...props} />;
    case "music":
      return <Music2 {...props} />;
    case "home":
      return <House {...props} />;
    case "lamp":
      return <Flame {...props} />;
    default:
      return <CalendarHeart {...props} />;
  }
}

function eventDateParts(date: string) {
  const value = new Date(`${date}T12:00:00`);
  return {
    day: new Intl.DateTimeFormat("en-IN", { day: "numeric" }).format(value),
    month: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(value),
    spokenDate: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(value),
    weekday: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(value),
  };
}

export type EventTimelineCardProps = {
  event: WeddingEvent;
  highlighted: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onPress: () => void;
  progress: { completed: number; total: number };
};

export const EventTimelineCard = memo(function EventTimelineCard({
  event,
  highlighted,
  isFirst,
  isLast,
  onEdit,
  onPress,
  progress,
}: EventTimelineCardProps) {
  const eventColor = eventColorByKey[event.colorToken ?? "gold"];
  const date = eventDateParts(event.date);
  const progressLabel = progress.total
    ? `${progress.completed}/${progress.total} tasks completed`
    : "No tasks linked";
  const statusLabel = highlighted ? `Wedding date · ${progressLabel}` : progressLabel;

  return (
    <View className="flex-row">
      <View className="w-lg items-center">
        {!isFirst ? <View className="absolute bottom-1/2 top-0 w-px bg-primary" /> : null}
        {!isLast ? <View className="absolute bottom-0 top-1/2 w-px bg-primary" /> : null}
        <View
          className={`mt-lg h-sm w-sm rounded-full border-2 ${
            highlighted ? "border-primary bg-primary" : "border-primary bg-canvas"
          }`}
        />
      </View>
      <View
        className={`ml-2xs flex-1 overflow-hidden rounded-card border bg-elevatedSurface shadow-card ${
          highlighted ? "border-primary" : "border-borderSubtle"
        }`}
      >
        <View className="flex-row items-center gap-xs p-xs">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: highlighted ? tokens.colors.primarySoft : eventColor.soft }}
          >
            <EventIcon
              color={highlighted ? tokens.colors.primary : eventColor.color}
              event={event}
            />
          </View>
          <Pressable
            accessibilityHint={`${date.weekday}, ${date.spokenDate}. ${statusLabel}`}
            accessibilityLabel={`Open event: ${event.name}`}
            accessibilityRole="button"
            android_ripple={{ color: tokens.colors.surfaceMuted }}
            className="min-h-14 min-w-0 flex-1 flex-row items-center gap-xs rounded-control active:bg-surfaceMuted"
            onPress={onPress}
          >
            <View className="w-14 items-center rounded-control bg-surfaceMuted px-2xs py-xs">
              <AppText tone="primary" variant="caption">
                {date.weekday}
              </AppText>
              <AppText tone="primary" variant="title">
                {date.day}
              </AppText>
              <AppText numberOfLines={1} variant="caption">
                {date.month}
              </AppText>
            </View>
            <View className="min-w-0 flex-1 gap-xs py-xs">
              <AppText numberOfLines={2} tone="primary" variant="heading">
                {event.name}
              </AppText>
              <View className="max-w-full self-start rounded-control bg-primarySoft px-xs py-2xs">
                <AppText tone={highlighted ? "primary" : "muted"} variant="caption">
                  {statusLabel}
                </AppText>
              </View>
            </View>
          </Pressable>
          <IconButton
            accessibilityLabel={`Edit event: ${event.name}`}
            icon={Pencil}
            onPress={onEdit}
            size="sm"
          />
        </View>
      </View>
    </View>
  );
});

export function PlanEventView({
  events,
  onEdit,
  onEventPress,
  onViewChange,
  progressForEvent,
  weddingDate,
}: {
  events: WeddingEvent[];
  onEdit: (event: WeddingEvent) => void;
  onEventPress: (event: WeddingEvent) => void;
  onViewChange: (view: PlanView) => void;
  progressForEvent: (id: string) => { completed: number; total: number };
  weddingDate: string;
}) {
  const header = (
    <View className="gap-lg pb-md">
      <PlanHeader activeView="events" onViewChange={onViewChange} />
      <AppText tone="primary" variant="title">
        Your wedding events
      </AppText>
    </View>
  );

  return (
    <FlashList
      contentContainerStyle={{
        paddingBottom: listFooterClearance,
        paddingHorizontal: contentPadding,
        paddingTop: contentPadding,
      }}
      data={events}
      ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
      keyExtractor={(event) => event.id}
      ListEmptyComponent={<EmptyState title="No events yet" />}
      ListHeaderComponent={header}
      renderItem={({ index, item }) => (
        <EventTimelineCard
          event={item}
          highlighted={item.date === weddingDate}
          isFirst={index === 0}
          isLast={index === events.length - 1}
          onEdit={() => onEdit(item)}
          onPress={() => onEventPress(item)}
          progress={progressForEvent(item.id)}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
