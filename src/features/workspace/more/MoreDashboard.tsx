import type { LucideIcon } from "lucide-react-native";
import { ChevronRight, Gift, Phone, Settings, UploadCloud, Users } from "lucide-react-native";
import { router } from "expo-router";
import { ScrollView, useWindowDimensions, View } from "react-native";

import {
  AppText,
  ErrorState,
  LoadingState,
  MotionPressable,
  PageHeader,
  Screen,
} from "@/components/ui";
import { toUserMessage } from "@/lib/errors";
import { isLargeText } from "@/lib/responsive";
import { tokens } from "@/theme";

import { useWorkspace } from "../provider";

export type MoreFeature = {
  description: string;
  icon: LucideIcon;
  route:
    "/more/backup" | "/more/emergency-contacts" | "/more/gifts" | "/more/guests" | "/more/settings";
  title: string;
};

const moreItems: MoreFeature[] = [
  {
    description: "Manage households, guest counts and RSVPs",
    icon: Users,
    route: "/more/guests",
    title: "Guests",
  },
  {
    description: "Track received gifts and follow-ups",
    icon: Gift,
    route: "/more/gifts",
    title: "Gifts",
  },
  {
    description: "Keep important family and vendor contacts close",
    icon: Phone,
    route: "/more/emergency-contacts",
    title: "Emergency contacts",
  },
  {
    description: "Export, import and protect your planning data",
    icon: UploadCloud,
    route: "/more/backup",
    title: "Backup & export",
  },
  {
    description: "Update wedding details and privacy controls",
    icon: Settings,
    route: "/more/settings",
    title: "Settings",
  },
];

export function MoreFeatureTile({
  item,
  stacked,
  wide,
}: {
  item: MoreFeature;
  stacked: boolean;
  wide?: boolean;
}) {
  const Icon = item.icon;

  if (wide) {
    return (
      <MotionPressable
        accessibilityHint={item.description}
        accessibilityLabel={`Open ${item.title}`}
        accessibilityRole="button"
        android_ripple={{ color: tokens.colors.primarySoft }}
        className="min-h-24 w-full flex-row items-center gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-md shadow-raised active:bg-surfaceMuted"
        onPress={() => router.navigate(item.route)}
        pressedScale={0.99}
        testID={`more-feature-row-${item.route}`}
      >
        <View className="h-12 w-12 items-center justify-center rounded-control bg-nightElevated">
          <Icon color={tokens.colors.nightAccent} size={tokens.iconSize.md} strokeWidth={1.8} />
        </View>
        <View className="min-w-0 flex-1 gap-2xs">
          <AppText variant="heading">{item.title}</AppText>
          <AppText tone="muted" variant="caption">
            {item.description}
          </AppText>
        </View>
        <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
      </MotionPressable>
    );
  }

  return (
    <MotionPressable
      accessibilityHint={item.description}
      accessibilityLabel={`Open ${item.title}`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.primarySoft }}
      className="min-h-40 gap-sm rounded-card border border-borderSubtle bg-elevatedSurface p-md shadow-raised active:bg-surfaceMuted"
      onPress={() => router.navigate(item.route)}
      pressedScale={0.99}
      style={stacked ? { width: "100%" } : { flexBasis: "47%", flexGrow: 1 }}
      testID={`more-feature-row-${item.route}`}
    >
      <View className="flex-row items-start justify-between gap-sm">
        <View className="h-12 w-12 items-center justify-center rounded-control bg-nightElevated">
          <Icon color={tokens.colors.nightAccent} size={tokens.iconSize.md} strokeWidth={1.8} />
        </View>
        <ChevronRight color={tokens.colors.textSecondary} size={tokens.iconSize.sm} />
      </View>
      <View className="min-w-0 flex-1 gap-2xs">
        <AppText numberOfLines={2} variant="heading">
          {item.title}
        </AppText>
        <AppText numberOfLines={stacked ? undefined : 3} tone="muted" variant="caption">
          {item.description}
        </AppText>
      </View>
    </MotionPressable>
  );
}

export function MoreDashboard() {
  const workspace = useWorkspace();
  const { fontScale } = useWindowDimensions();
  const stacked = isLargeText(fontScale);

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
      <ScrollView
        contentContainerClassName="gap-xl p-md pb-2xl"
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="More" />
        {stacked ? (
          <View className="gap-sm">
            {moreItems.map((item) => (
              <MoreFeatureTile item={item} key={item.title} stacked />
            ))}
          </View>
        ) : (
          <View className="gap-sm">
            {[moreItems.slice(0, 2), moreItems.slice(2, 4)].map((row) => (
              <View className="flex-row gap-sm" key={row[0].title}>
                {row.map((item) => (
                  <MoreFeatureTile item={item} key={item.title} stacked={false} />
                ))}
              </View>
            ))}
            <MoreFeatureTile item={moreItems[moreItems.length - 1]} stacked={false} wide />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
