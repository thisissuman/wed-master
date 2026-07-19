import { View } from "react-native";
import { Search } from "lucide-react-native";

import { AppText, IconButton } from "@/components/ui";

export function MangalyaHeader({ onSearch }: { onSearch?: () => void }) {
  return (
    <View className="min-h-14 flex-row items-center justify-between">
      <AppText accessibilityLabel="Mangalya" accessibilityRole="header" variant="wordmark">
        Mangalya
      </AppText>
      {onSearch ? (
        <IconButton accessibilityLabel="Search" icon={Search} onPress={onSearch} />
      ) : null}
    </View>
  );
}
