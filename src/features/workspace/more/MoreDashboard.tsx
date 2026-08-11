import { ScrollView, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import type { LucideIcon } from "lucide-react-native";
import {
  ChevronRight,
  Gift,
  Phone,
  Settings,
  UploadCloud,
  Users,
  WalletCards,
} from "lucide-react-native";
import { router } from "expo-router";

import { MangalyaHeader } from "@/components/brand";
import { AppText, ErrorState, LoadingState, MotionPressable, Screen } from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";

import { useWorkspace } from "../provider";

export type MoreFeature = {
  description: string;
  icon: LucideIcon;
  route:
    | "/budget/overview"
    | "/more/backup"
    | "/more/emergency-contacts"
    | "/more/gifts"
    | "/more/guests"
    | "/more/settings";
  title: string;
};

const moreItems: MoreFeature[] = [
  {
    description: "See your target, spending trends, dates and categories",
    icon: WalletCards,
    route: "/budget/overview",
    title: "Budget & expenses",
  },
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
];

export function MoreFeatureCard({ item }: { item: MoreFeature }) {
  const Icon = item.icon;
  const { fontScale } = useWindowDimensions();
  const largeText = isLargeText(fontScale);

  return (
    <MotionPressable
      accessibilityHint={item.description}
      accessibilityLabel={`Open ${item.title}`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.primarySoft }}
      className={`flex-1 rounded-card border border-borderSubtle bg-elevatedSurface p-md shadow-card active:bg-surfaceMuted ${
        largeText ? "min-h-20 flex-row items-center gap-sm" : "gap-sm"
      }`}
      onPress={() => router.navigate(item.route)}
      pressedScale={0.985}
    >
      {largeText ? (
        <>
          <View className="h-12 w-12 items-center justify-center rounded-control bg-primarySoft">
            <Icon color={tokens.colors.primary} size={tokens.iconSize.lg} />
          </View>
          <View className="min-w-0 flex-1 gap-2xs">
            <AppText variant="heading">{item.title}</AppText>
            <AppText tone="muted" variant="caption">
              {item.description}
            </AppText>
          </View>
          <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
        </>
      ) : (
        <>
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
        </>
      )}
    </MotionPressable>
  );
}

export function MoreDashboard() {
  const workspace = useWorkspace();
  const { fontScale } = useWindowDimensions();
  const itemsPerRow = isLargeText(fontScale) ? 1 : 2;

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
          <AppText accessibilityRole="header" tone="primary" variant="display">
            More
          </AppText>
        </View>
        <View className="gap-sm" testID="more-feature-grid">
          {Array.from({ length: Math.ceil(moreItems.length / itemsPerRow) }, (_, rowIndex) => {
            const row = moreItems.slice(
              rowIndex * itemsPerRow,
              rowIndex * itemsPerRow + itemsPerRow,
            );
            return (
              <View
                className="flex-row items-stretch gap-sm"
                key={row[0]?.title}
                testID={`more-feature-row-${rowIndex}`}
              >
                {row.map((item) => (
                  <MoreFeatureCard item={item} key={item.title} />
                ))}
                {itemsPerRow > 1 && row.length === 1 ? <View className="flex-1" /> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
