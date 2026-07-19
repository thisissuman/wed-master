import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import type { LucideIcon } from "lucide-react-native";
import {
  CalendarHeart,
  ChevronRight,
  Gift,
  Headphones,
  Info,
  MessageSquare,
  Phone,
  Settings,
  UploadCloud,
  Users,
} from "lucide-react-native";
import { router } from "expo-router";

import { MangalyaHeader, showComingSoon } from "@/components/brand";
import { AppText, ErrorState, LoadingState, Screen } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { tokens } from "@/theme";

import { useWorkspace } from "../provider";

export type MoreFeature = {
  description: string;
  icon: LucideIcon;
  route?:
    "/more/backup" | "/more/emergency-contacts" | "/more/gifts" | "/more/guests" | "/more/settings";
  title: string;
};

const moreItems: MoreFeature[] = [
  {
    description: "Manage your preferences and app settings",
    icon: Settings,
    route: "/more/settings",
    title: "Settings",
  },
  {
    description: "View, manage and organize your guest list",
    icon: Users,
    route: "/more/guests",
    title: "Guests",
  },
  {
    description: "Track gifts, values and follow-ups",
    icon: Gift,
    route: "/more/gifts",
    title: "Gifts",
  },
  {
    description: "Back up your data and export important details",
    icon: UploadCloud,
    route: "/more/backup",
    title: "Backup & Export",
  },
  {
    description: "Add and manage important contact details",
    icon: Phone,
    route: "/more/emergency-contacts",
    title: "Emergency Contacts",
  },
  { description: "Learn more about Mangalya and our mission", icon: Info, title: "About the App" },
];

function ShortcutCard({
  icon: Icon,
  onPress,
  title,
}: {
  icon: LucideIcon;
  onPress: () => void;
  title: string;
}) {
  const compact = useWindowDimensions().width < 380;

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.primarySoft }}
      className={`min-h-16 flex-1 flex-row items-center rounded-card border border-borderSubtle bg-elevatedSurface shadow-card active:bg-surfaceMuted ${
        compact ? "gap-2xs p-xs" : "gap-sm p-sm"
      }`}
      onPress={onPress}
    >
      <View
        className={`${compact ? "h-10 w-10" : "h-12 w-12"} items-center justify-center rounded-full bg-primary`}
      >
        <Icon color={tokens.colors.onPrimary} size={tokens.iconSize.md} />
      </View>
      <AppText className="min-w-0 flex-1" numberOfLines={1} variant="label">
        {title}
      </AppText>
      <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
    </Pressable>
  );
}

export function MoreFeatureCard({ item }: { item: MoreFeature }) {
  const Icon = item.icon;
  return (
    <Pressable
      accessibilityLabel={item.route ? `Open ${item.title}` : `${item.title}, coming soon`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.primarySoft }}
      className="flex-1 gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-md shadow-card active:bg-surfaceMuted"
      onPress={() => (item.route ? router.push(item.route) : showComingSoon(item.title))}
    >
      <View className="flex-row items-start justify-between gap-sm">
        <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
          <Icon color={tokens.colors.primary} size={tokens.iconSize.lg} />
        </View>
        <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
      </View>
      <View className="gap-2xs">
        <AppText variant="heading">{item.title}</AppText>
        <AppText tone="muted" variant="caption">
          {item.description}
        </AppText>
      </View>
    </Pressable>
  );
}

export function MoreDashboard() {
  const workspace = useWorkspace();

  if (workspace.isLoading || !workspace.data) {
    if (workspace.isError) {
      return (
        <Screen className="justify-center p-md">
          <ErrorState
            message={toUserMessage(workspace.error)}
            onRetry={() => void workspace.refetch()}
            title="We could not open More"
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <LoadingState label="Opening more tools" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Image
        accessible={false}
        accessibilityElementsHidden
        contentFit="contain"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        source={require("../../../../assets/images/mangalya-botanical.jpg")}
        style={{
          height: tokens.illustrationSize.botanical,
          opacity: 0.42,
          position: "absolute",
          right: 0,
          top: tokens.touchTarget * 2,
          width: tokens.illustrationSize.botanical,
        }}
      />
      <ScrollView
        contentContainerClassName="gap-xl p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <MangalyaHeader />
        <View className="gap-2xs">
          <AppText tone="primary" variant="display">
            More
          </AppText>
          <AppText variant="body">Helpful tools and extra features</AppText>
        </View>
        <View className="flex-row gap-sm">
          <ShortcutCard
            icon={CalendarHeart}
            onPress={() => router.push("/plan")}
            title="Planning"
          />
          <ShortcutCard
            icon={Headphones}
            onPress={() => showComingSoon("Support")}
            title="Support"
          />
        </View>
        <View className="gap-sm">
          {Array.from({ length: Math.ceil(moreItems.length / 2) }, (_, rowIndex) => {
            const row = moreItems.slice(rowIndex * 2, rowIndex * 2 + 2);
            return (
              <View className="flex-row items-stretch gap-sm" key={row[0]?.title}>
                {row.map((item) => (
                  <MoreFeatureCard item={item} key={item.title} />
                ))}
                {row.length === 1 ? <View className="flex-1" /> : null}
              </View>
            );
          })}
        </View>
        <Pressable
          accessibilityLabel="Feedback, coming soon"
          accessibilityRole="button"
          android_ripple={{ color: tokens.colors.primarySoft }}
          className="min-h-20 flex-row items-center gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-md shadow-card active:bg-surfaceMuted"
          onPress={() => showComingSoon("Feedback")}
        >
          <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
            <MessageSquare color={tokens.colors.primary} size={tokens.iconSize.lg} />
          </View>
          <View className="min-w-0 flex-1 gap-2xs">
            <AppText variant="heading">Feedback</AppText>
            <AppText tone="muted" variant="caption">
              Share your thoughts and help us improve
            </AppText>
          </View>
          <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
