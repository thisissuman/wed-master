import Heart from "lucide-react-native/icons/heart";
import { View } from "react-native";

import { tokens } from "@/theme";

const mainHeartSize = Math.round(tokens.iconSize.sm * 0.67);
const companionHeartSize = Math.round(tokens.iconSize.sm * 0.44);
const heartGap = Number.parseInt(tokens.spacing["2xs"], 10) / 2;
const companionInset = heartGap / 2;
const mainHeartRotation = "-10deg";
const companionHeartRotation = "12deg";

export function MangalyaHeartAccent() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ alignItems: "flex-end", flexDirection: "row", gap: heartGap }}
      testID="mangalya-heart-accent"
    >
      <View style={{ transform: [{ rotate: mainHeartRotation }] }}>
        <Heart
          color={tokens.brand.bridalRed}
          fill={tokens.brand.bridalRed}
          size={mainHeartSize}
          strokeWidth={1.6}
        />
      </View>
      <View
        style={{
          paddingBottom: companionInset,
          transform: [{ rotate: companionHeartRotation }],
        }}
      >
        <Heart
          color={tokens.brand.plum}
          fill={tokens.brand.lavender}
          size={companionHeartSize}
          strokeWidth={1.5}
        />
      </View>
    </View>
  );
}
