import { useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Camera } from "lucide-react-native";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient as SvgRadialGradient,
  Stop,
} from "react-native-svg";

import { AppText } from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { motionDurations, tokens } from "@/theme";

const compactLayoutWidth = 420;
const largeTextScale = 1.3;
const compactAvatarSize = 96;
const regularAvatarSize = 108;
const compactOrbSize = 92;
const regularOrbSize = 104;
const countdownHaloScale = 1.46;
const countdownHaloSource = require("../../../../assets/images/mangalya/countdown-halo.png");

const avatarFallbackColors = [
  tokens.gradients.avatarFallback[0],
  tokens.gradients.avatarFallback[1],
  tokens.gradients.avatarFallback[2],
] as const;

type WeddingHeroProps = {
  completedTasks: number;
  coverPhotoUri?: string;
  daysUntilWedding: number;
  isPhotoPending: boolean;
  name: string;
  onPhotoPress: () => void;
  totalTasks: number;
  weddingDate: string;
};

const weddingDayCopy = (daysUntilWedding: number) => {
  if (daysUntilWedding > 0) {
    return {
      accessibilityLabel: `${daysUntilWedding} ${daysUntilWedding === 1 ? "day" : "days"} until the wedding`,
      count: daysUntilWedding,
      label: daysUntilWedding === 1 ? "day" : "days",
    };
  }
  if (daysUntilWedding === 0) {
    return { accessibilityLabel: "Wedding day", count: 0, label: "wedding day" };
  }
  return { accessibilityLabel: "Wedding date has passed", count: 0, label: "date passed" };
};

function AvatarFallback({ size }: { size: number }) {
  return (
    <LinearGradient
      colors={avatarFallbackColors}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ height: size, width: size }}
    >
      <Svg height={size} style={{ pointerEvents: "none" }} viewBox="0 0 100 100" width={size}>
        <Circle
          cx="50"
          cy="50"
          fill="none"
          opacity="0.36"
          r="34"
          stroke={tokens.colors.primary}
          strokeWidth="1.5"
        />
        <Path
          d="M25 68c15-25 35-35 58-30M31 61c-8-15-6-27 8-36 7 14 4 27-8 36Zm35-24c-2-12 4-21 17-26 2 12-4 21-17 26Z"
          fill="none"
          opacity="0.5"
          stroke={tokens.colors.accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </Svg>
    </LinearGradient>
  );
}

function WeddingAvatar({
  coverPhotoUri,
  failedImageUri,
  isPhotoPending,
  onImageError,
  onPhotoPress,
  size,
}: {
  coverPhotoUri?: string;
  failedImageUri?: string;
  isPhotoPending: boolean;
  onImageError: () => void;
  onPhotoPress: () => void;
  size: number;
}) {
  const hasUsableCover = Boolean(coverPhotoUri && coverPhotoUri !== failedImageUri);

  return (
    <View style={{ height: size + 8, width: size + 8 }}>
      <View
        className="overflow-hidden rounded-full border-2 border-elevatedSurface bg-primarySoft shadow-card"
        style={{ height: size, width: size }}
      >
        {hasUsableCover ? (
          <Image
            accessible={false}
            accessibilityElementsHidden
            contentFit="cover"
            importantForAccessibility="no-hide-descendants"
            onError={onImageError}
            pointerEvents="none"
            source={{ uri: coverPhotoUri }}
            style={{ height: size, width: size }}
            testID="wedding-cover-image"
            transition={motionDurations.exit}
          />
        ) : (
          <AvatarFallback size={size} />
        )}
      </View>
      <Pressable
        accessibilityLabel={`${hasUsableCover ? "Change" : "Add"} wedding cover photo`}
        accessibilityRole="button"
        accessibilityState={{ busy: isPhotoPending, disabled: isPhotoPending }}
        className="absolute -bottom-1 -right-1 min-h-12 min-w-12 items-center justify-center rounded-full border border-borderSubtle bg-elevatedSurface shadow-card active:bg-primarySoft disabled:opacity-60"
        disabled={isPhotoPending}
        onPress={onPhotoPress}
      >
        <Camera color={tokens.colors.primary} size={tokens.iconSize.sm} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

function PlanningProgress({ percentage, totalTasks }: { percentage: number; totalTasks: number }) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const accessibilityText = totalTasks
    ? `${percentage}% of active planning tasks complete`
    : "No planning tasks yet, 0% planned";

  return (
    <View className="gap-xs">
      <View
        accessibilityLabel="Planning progress"
        accessibilityRole="progressbar"
        accessibilityValue={{ max: 100, min: 0, now: clampedPercentage, text: accessibilityText }}
        accessible
        className="h-xs overflow-hidden rounded-full bg-surfaceMuted"
      >
        <LinearGradient
          colors={[tokens.gradients.homeProgress[0], tokens.colors.primary]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={{ height: "100%", width: `${clampedPercentage}%` }}
        />
      </View>
      <AppText tone="muted" variant="caption">
        {percentage}% planned
      </AppText>
    </View>
  );
}

function CountdownOrb({ daysUntilWedding, size }: { daysUntilWedding: number; size: number }) {
  const copy = weddingDayCopy(daysUntilWedding);
  const center = size / 2;
  const haloSize = size * countdownHaloScale;

  return (
    <View
      accessibilityLabel={copy.accessibilityLabel}
      accessibilityRole="text"
      accessible
      className="items-center justify-center rounded-full shadow-elevated"
      style={{ height: size, overflow: "visible", width: size }}
    >
      <Svg height={size} style={{ pointerEvents: "none" }} viewBox="0 0 104 104" width={size}>
        <Defs>
          <SvgRadialGradient cx="38%" cy="32%" id="countdownGlass" r="72%">
            <Stop offset="0" stopColor={tokens.gradients.countdownGlass[2]} />
            <Stop offset="0.55" stopColor={tokens.gradients.countdownGlass[1]} />
            <Stop offset="1" stopColor={tokens.gradients.countdownGlass[0]} />
          </SvgRadialGradient>
        </Defs>
        <Circle
          cx="52"
          cy="52"
          fill="url(#countdownGlass)"
          r="44"
          stroke={tokens.colors.elevatedSurface}
          strokeWidth="2"
        />
        <Circle
          cx="52"
          cy="52"
          fill="none"
          opacity="0.58"
          r="42"
          stroke={tokens.colors.elevatedSurface}
          strokeWidth="1"
        />
      </Svg>
      <Image
        accessible={false}
        contentFit="contain"
        pointerEvents="none"
        source={countdownHaloSource}
        style={{
          height: haloSize,
          left: (size - haloSize) / 2,
          position: "absolute",
          top: (size - haloSize) / 2,
          width: haloSize,
        }}
        testID="countdown-halo"
      />
      <View
        className="absolute inset-0 items-center justify-center px-xs"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
      >
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.62}
          numberOfLines={1}
          style={{ maxWidth: center * 1.38, textAlign: "center" }}
          variant="countdown"
        >
          {copy.count}
        </AppText>
        <AppText className="text-center" numberOfLines={2} tone="muted" variant="caption">
          {copy.label}
        </AppText>
      </View>
    </View>
  );
}

export function WeddingHero({
  completedTasks,
  coverPhotoUri,
  daysUntilWedding,
  isPhotoPending,
  name,
  onPhotoPress,
  totalTasks,
  weddingDate,
}: WeddingHeroProps) {
  const { fontScale, width } = useWindowDimensions();
  const [failedImageUri, setFailedImageUri] = useState<string>();
  const compact = width <= compactLayoutWidth;
  const stacked = fontScale >= largeTextScale;
  const avatarSize = compact ? compactAvatarSize : regularAvatarSize;
  const orbSize = compact ? compactOrbSize : regularOrbSize;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <View
      className="gap-xs py-xs"
      style={{
        alignItems: "center",
        flexDirection: stacked ? "column" : "row",
      }}
    >
      <WeddingAvatar
        coverPhotoUri={coverPhotoUri}
        failedImageUri={failedImageUri}
        isPhotoPending={isPhotoPending}
        onImageError={() => setFailedImageUri(coverPhotoUri)}
        onPhotoPress={onPhotoPress}
        size={avatarSize}
      />
      <View
        className="min-w-0 flex-1 gap-sm"
        style={stacked ? { alignSelf: "stretch" } : undefined}
      >
        <View className="gap-2xs">
          <AppText
            numberOfLines={stacked ? undefined : 2}
            variant={compact ? "heroCompact" : "hero"}
          >
            {name}
          </AppText>
          <AppText tone="muted" variant="body">
            {formatDateOnly(weddingDate)}
          </AppText>
        </View>
        <PlanningProgress percentage={percentage} totalTasks={totalTasks} />
      </View>
      <CountdownOrb daysUntilWedding={daysUntilWedding} size={orbSize} />
    </View>
  );
}
