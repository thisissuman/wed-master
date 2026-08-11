import { View } from "react-native";
import type { Href } from "expo-router";

import { MangalyaHeader } from "@/components/brand";

import { DetailHeader } from "../ui";

export function MoreScreenHeader({
  fallback = "/more",
  title,
}: {
  fallback?: Href;
  title: string;
}) {
  return (
    <View className="gap-lg">
      <MangalyaHeader />
      <DetailHeader fallback={fallback} title={title} />
    </View>
  );
}
