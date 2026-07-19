import { View } from "react-native";

import { MangalyaHeader } from "@/components/brand";

import { DetailHeader } from "../ui";

export function MoreScreenHeader({ title, weddingName }: { title: string; weddingName: string }) {
  return (
    <View className="gap-lg">
      <MangalyaHeader />
      <DetailHeader eyebrow={weddingName} title={title} />
    </View>
  );
}
