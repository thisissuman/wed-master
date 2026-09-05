import { View } from "react-native";
import Search from "lucide-react-native/icons/search";

import { AppText } from "@/components/ui/AppText";
import { IconButton } from "@/components/ui/IconButton";
import { tokens, useAppTheme } from "@/theme";
import { MangalyaHeartAccent } from "./MangalyaHeartAccent";

const wordmarkShadowRadius = Number.parseInt(tokens.spacing["2xs"], 10);
const wordmarkShadowOffset = wordmarkShadowRadius / 2;

export function MangalyaHeader({ onSearch }: { onSearch?: () => void }) {
  const theme = useAppTheme();

  return (
    <View className="min-h-14 flex-row items-center justify-between">
      <View className="flex-row items-center gap-xs">
        <AppText
          accessibilityLabel="Mangalya"
          accessibilityRole="header"
          style={{
            textShadowColor: theme.colors.wordmarkShadow,
            textShadowOffset: { height: wordmarkShadowOffset, width: 0 },
            textShadowRadius: wordmarkShadowRadius,
          }}
          tone="brand"
          variant="wordmark"
        >
          Mangalya
        </AppText>
        <MangalyaHeartAccent />
      </View>
      {onSearch ? (
        <IconButton accessibilityLabel="Search" icon={Search} onPress={onSearch} />
      ) : null}
    </View>
  );
}
