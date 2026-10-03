import { Pressable, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { memo } from "react";
import CalendarHeart from "lucide-react-native/icons/calendar-heart";
import Diamond from "lucide-react-native/icons/diamond";
import Flame from "lucide-react-native/icons/flame";
import Flower2 from "lucide-react-native/icons/flower-2";
import Hand from "lucide-react-native/icons/hand";
import HeartHandshake from "lucide-react-native/icons/heart-handshake";
import House from "lucide-react-native/icons/house";
import Music2 from "lucide-react-native/icons/music-2";
import Pencil from "lucide-react-native/icons/pencil";

import { AppText, CreatedItemPulse, EmptyState, IconButton } from "@/components/ui";
import { tokens, useAppTheme } from "@/theme";

import type { EventIconKey, WeddingEvent } from "../types";
import type { CreatedItemHighlight } from "../created-item-highlight";

const contentPadding = Number.parseInt(tokens.spacing.md, 10);
const itemGap = Number.parseInt(tokens.spacing.sm, 10);
const listFooterClearance = tokens.touchTarget + Number.parseInt(tokens.spacing["2xl"], 10) * 2;

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
  const theme = useAppTheme();
  const eventColorByKey = {
    botanical: { color: theme.colors.primary, soft: theme.colors.primarySoft },
    gold: { color: theme.colors.warning, soft: theme.colors.accentSoft },
    terracotta: { color: theme.colors.danger, soft: theme.colors.dangerSoft },
    sage: { color: theme.colors.success, soft: theme.colors.successSoft },
  } as const;
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
        className={`ml-2xs flex-1 overflow-hidden rounded-card border bg-elevatedSurface ${
          highlighted ? "border-primary" : "border-borderSubtle"
        }`}
      >
        <View className="flex-row items-center gap-sm p-md">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: highlighted ? theme.colors.primarySoft : eventColor.soft }}
          >
            <EventIcon
              color={highlighted ? theme.colors.primary : eventColor.color}
              event={event}
            />
          </View>
          <Pressable
            accessibilityHint={`${date.weekday}, ${date.spokenDate}. ${statusLabel}`}
            accessibilityLabel={`Open event: ${event.name}`}
            accessibilityRole="button"
            android_ripple={{ color: theme.colors.surfaceMuted }}
            className="min-h-14 min-w-0 flex-1 rounded-control active:bg-surfaceMuted"
            onPress={onPress}
          >
            <View className="min-w-0 flex-1 gap-xs py-2xs">
              <AppText numberOfLines={2} tone="primary" variant="heading">
                {event.name}
              </AppText>
              <View className="flex-row flex-wrap items-center gap-xs">
                <AppText tone="muted" variant="caption">
                  {date.weekday}, {date.day} {date.month}
                </AppText>
                <View className="max-w-full rounded-control bg-primarySoft px-xs py-2xs">
                  <AppText tone={highlighted ? "primary" : "muted"} variant="caption">
                    {statusLabel}
                  </AppText>
                </View>
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
  progressForEvent,
  weddingDate,
  createdHighlight,
  onCreatedHighlightFinished,
}: {
  events: WeddingEvent[];
  onEdit: (event: WeddingEvent) => void;
  onEventPress: (event: WeddingEvent) => void;
  progressForEvent: (id: string) => { completed: number; total: number };
  weddingDate: string;
  createdHighlight?: CreatedItemHighlight;
  onCreatedHighlightFinished: (nonce: number) => void;
}) {
  const header = (
    <View className="gap-md pb-md">
      <AppText accessibilityRole="header" variant="heading">
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
      extraData={createdHighlight?.nonce}
      ItemSeparatorComponent={() => <View style={{ height: itemGap }} />}
      keyExtractor={(event) => event.id}
      ListEmptyComponent={<EmptyState title="No events yet" />}
      ListHeaderComponent={header}
      renderItem={({ index, item }) => (
        <CreatedItemPulse
          active={Boolean(createdHighlight?.ids.includes(item.id))}
          onFinished={() => {
            if (createdHighlight) onCreatedHighlightFinished(createdHighlight.nonce);
          }}
        >
          <EventTimelineCard
            event={item}
            highlighted={item.date === weddingDate}
            isFirst={index === 0}
            isLast={index === events.length - 1}
            onEdit={() => onEdit(item)}
            onPress={() => onEventPress(item)}
            progress={progressForEvent(item.id)}
          />
        </CreatedItemPulse>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
