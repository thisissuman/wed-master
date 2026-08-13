import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Heart } from "lucide-react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { AppText, MotionPressable } from "@/components/ui";
import { formatDateOnly } from "@/lib/dates";
import { isLargeText } from "@/lib/responsive";
import { motionDurations, tokens } from "@/theme";
import { motionEasing } from "@/theme/motion";

import { displayedKeepsakeMessage } from "../wedding-profile";

const compactLayoutWidth = 390;
const compactAvatarSize = 82;
const regularAvatarSize = 92;
const focusedCardMaxWidth =
  tokens.layout.expandedWidth - Number.parseInt(tokens.spacing["3xl"], 10);
const focusedCardHorizontalInset = Number.parseInt(tokens.spacing.md, 10);
const focusedCardTravel = tokens.touchTarget * 3;
const focusedCardInitialScale = 0.96;
const focusedCardInitialOpacity = 0.72;
const keepsakePerspective = tokens.layout.expandedWidth * 2;
const flipMidpoint = 0.5;
const faceSwapWindow = 0.02;
const heroGradient = [
  tokens.gradients.weddingNight[0],
  tokens.gradients.weddingNight[1],
  tokens.gradients.weddingNight[2],
] as const;
const keepsakeGradient = [
  tokens.gradients.weddingNight[2],
  tokens.gradients.weddingNight[1],
  tokens.gradients.weddingNight[0],
] as const;
const avatarFallbackColors = [
  tokens.colors.nightElevated,
  tokens.colors.primary,
  tokens.colors.nightSurface,
] as const;
const flipDuration = motionDurations.entrance + motionDurations.fast;

type WeddingHeroProps = {
  completedTasks: number;
  coverPhotoUri?: string;
  daysUntilWedding: number;
  isPhotoPending: boolean;
  keepsakeMessage?: string;
  name: string;
  onKeepsakeFocusChange?: (focused: boolean) => void;
  onPhotoPress: () => void;
  totalTasks: number;
  weddingDate: string;
};

const weddingDayCopy = (daysUntilWedding: number) => {
  if (daysUntilWedding > 0) {
    return {
      accessibilityLabel: `${daysUntilWedding} ${daysUntilWedding === 1 ? "day" : "days"} until the wedding`,
      count: daysUntilWedding,
      label: daysUntilWedding === 1 ? "day to go" : "days to go",
    };
  }
  if (daysUntilWedding === 0) {
    return { accessibilityLabel: "Wedding day", count: 0, label: "wedding day" };
  }
  return { accessibilityLabel: "Wedding date has passed", count: 0, label: "date passed" };
};

function HeroOrnament({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      className={`absolute h-52 w-52 ${mirrored ? "-bottom-16 -left-16" : "-right-10 -top-12"}`}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={mirrored ? { transform: [{ rotate: "180deg" }] } : undefined}
    >
      <Svg height="100%" viewBox="0 0 200 200" width="100%">
        <Circle
          cx="100"
          cy="100"
          fill="none"
          opacity="0.22"
          r="68"
          stroke={tokens.colors.nightAccent}
          strokeWidth="1.2"
        />
        <Circle
          cx="100"
          cy="100"
          fill="none"
          opacity="0.12"
          r="84"
          stroke={tokens.colors.onNight}
          strokeWidth="1"
        />
        <Path
          d="M42 128c30-36 66-55 112-54"
          fill="none"
          opacity="0.16"
          stroke={tokens.colors.nightAccent}
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </Svg>
    </View>
  );
}

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
          opacity="0.48"
          r="34"
          stroke={tokens.colors.nightAccent}
          strokeWidth="1.4"
        />
        <Path
          d="M25 68c15-25 35-35 58-30M31 61c-8-15-6-27 8-36 7 14 4 27-8 36Zm35-24c-2-12 4-21 17-26 2 12-4 21-17 26Z"
          fill="none"
          opacity="0.62"
          stroke={tokens.colors.onNight}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.3"
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
        className="overflow-hidden rounded-full border-2 border-nightBorder bg-nightElevated"
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
      <MotionPressable
        accessibilityLabel={`${hasUsableCover ? "Change" : "Add"} wedding cover photo`}
        accessibilityRole="button"
        accessibilityState={{ busy: isPhotoPending, disabled: isPhotoPending }}
        className="absolute -bottom-1 -right-1 min-h-12 min-w-12 items-center justify-center rounded-full border border-nightBorder bg-nightElevated disabled:opacity-60"
        disabled={isPhotoPending}
        onPress={(event) => {
          event.stopPropagation();
          onPhotoPress();
        }}
        pressedScale={0.94}
      >
        <Camera color={tokens.colors.nightAccent} size={tokens.iconSize.sm} strokeWidth={1.9} />
      </MotionPressable>
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
      <View className="flex-row items-center justify-between gap-sm">
        <AppText tone="onNightMuted" variant="caption">
          Planning progress
        </AppText>
        <AppText style={{ fontVariant: ["tabular-nums"] }} tone="nightAccent" variant="label">
          {percentage}%
        </AppText>
      </View>
      <View
        accessibilityLabel="Planning progress"
        accessibilityRole="progressbar"
        accessibilityValue={{ max: 100, min: 0, now: clampedPercentage, text: accessibilityText }}
        accessible
        className="h-1.5 overflow-hidden rounded-full bg-nightSoft"
      >
        <LinearGradient
          colors={[tokens.gradients.homeProgress[0], tokens.gradients.homeProgress[1]]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={{ height: "100%", width: `${clampedPercentage}%` }}
        />
      </View>
    </View>
  );
}

function WeddingCountdown({ daysUntilWedding }: { daysUntilWedding: number }) {
  const copy = weddingDayCopy(daysUntilWedding);

  return (
    <View
      accessibilityLabel={copy.accessibilityLabel}
      accessibilityRole="text"
      accessible
      className="min-w-20 items-center justify-center rounded-card bg-nightSoft px-sm py-xs"
    >
      <View importantForAccessibility="no-hide-descendants">
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={{ fontVariant: ["tabular-nums"], textAlign: "center" }}
          tone="onNight"
          variant="countdown"
        >
          {copy.count}
        </AppText>
        <AppText className="text-center" numberOfLines={2} tone="onNightMuted" variant="caption">
          {copy.label}
        </AppText>
      </View>
    </View>
  );
}

type WeddingCardFaceProps = WeddingHeroProps & {
  failedImageUri?: string;
  onImageError: () => void;
  onOpen?: () => void;
};

function WeddingCardFace({
  completedTasks,
  coverPhotoUri,
  daysUntilWedding,
  failedImageUri,
  isPhotoPending,
  name,
  onImageError,
  onOpen,
  onPhotoPress,
  totalTasks,
  weddingDate,
}: WeddingCardFaceProps) {
  const { fontScale, width } = useWindowDimensions();
  const compact = width <= compactLayoutWidth;
  const stacked = isLargeText(fontScale) || width < 350;
  const avatarSize = compact ? compactAvatarSize : regularAvatarSize;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const content = (
    <View className="gap-lg p-lg">
      <HeroOrnament />
      <View
        className="gap-md"
        style={{
          alignItems: stacked ? "flex-start" : "center",
          flexDirection: stacked ? "column" : "row",
        }}
      >
        <WeddingAvatar
          coverPhotoUri={coverPhotoUri}
          failedImageUri={failedImageUri}
          isPhotoPending={isPhotoPending}
          onImageError={onImageError}
          onPhotoPress={onPhotoPress}
          size={avatarSize}
        />
        <View className="min-w-0 flex-1 gap-xs">
          <AppText
            accessibilityRole="header"
            numberOfLines={stacked ? undefined : 2}
            tone="onNight"
            variant={compact ? "heroCompact" : "hero"}
          >
            {name}
          </AppText>
          <AppText tone="onNightMuted" variant="body">
            {formatDateOnly(weddingDate)}
          </AppText>
        </View>
        <WeddingCountdown daysUntilWedding={daysUntilWedding} />
      </View>
      <PlanningProgress percentage={percentage} totalTasks={totalTasks} />
    </View>
  );

  if (!onOpen) {
    return (
      <LinearGradient
        colors={heroGradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          borderRadius: Number.parseInt(tokens.radius.hero, 10),
          overflow: "hidden",
        }}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <MotionPressable
      accessibilityHint="Moves the card to the middle of the screen"
      accessibilityLabel={`Wedding card for ${name}. Tap the card`}
      accessibilityRole="button"
      android_ripple={{ color: tokens.colors.nightSoft }}
      onPress={onOpen}
      pressedScale={0.985}
    >
      <LinearGradient
        colors={heroGradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{ borderRadius: Number.parseInt(tokens.radius.hero, 10), overflow: "hidden" }}
        testID="wedding-hero"
      >
        {content}
      </LinearGradient>
    </MotionPressable>
  );
}

function KeepsakeMessageFace({ message }: { message: string }) {
  return (
    <LinearGradient
      colors={keepsakeGradient}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ borderRadius: Number.parseInt(tokens.radius.hero, 10), flex: 1 }}
    >
      <View className="flex-1 items-center justify-center gap-lg overflow-hidden p-lg">
        <HeroOrnament mirrored />
        <View className="h-14 w-14 items-center justify-center rounded-full border border-nightBorder bg-nightSoft">
          <Heart color={tokens.colors.nightAccent} fill={tokens.colors.nightAccent} size={26} />
        </View>
        <View className="max-w-md gap-md">
          <AppText
            accessibilityRole="text"
            adjustsFontSizeToFit
            className="text-center"
            minimumFontScale={0.72}
            numberOfLines={6}
            tone="onNight"
            variant="hero"
          >
            “{message}”
          </AppText>
        </View>
      </View>
    </LinearGradient>
  );
}

function FocusedWeddingKeepsake({
  failedImageUri,
  onClose,
  onImageError,
  sourceCardHeight,
  sourceCardWidth,
  ...props
}: WeddingCardFaceProps & {
  onClose: () => void;
  sourceCardHeight?: number;
  sourceCardWidth?: number;
}) {
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const [flipped, setFlipped] = useState(false);
  const entrance = useSharedValue(reduceMotion ? 1 : 0);
  const flip = useSharedValue(0);
  const cardWidth = Math.min(
    sourceCardWidth ?? focusedCardMaxWidth,
    width - focusedCardHorizontalInset * 2,
  );
  const cardHeight = sourceCardHeight;
  const message = displayedKeepsakeMessage(props.keepsakeMessage);

  useEffect(() => {
    entrance.set(
      withTiming(1, {
        duration: reduceMotion
          ? motionDurations.fast
          : motionDurations.entrance + motionDurations.press,
        easing: motionEasing.enter,
      }),
    );
  }, [entrance, reduceMotion]);

  const flipCard = () => {
    const next = !flipped;
    setFlipped(next);
    flip.set(
      withTiming(next ? 1 : 0, {
        duration: reduceMotion ? motionDurations.fast : flipDuration,
        easing: motionEasing.move,
      }),
    );
    void Haptics.selectionAsync();
  };

  const frontStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 1 - flip.value };
    }
    return {
      opacity: interpolate(
        flip.value,
        [0, flipMidpoint - faceSwapWindow, flipMidpoint],
        [1, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [{ perspective: keepsakePerspective }, { rotateY: `${flip.value * 180}deg` }],
    };
  });
  const backStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: flip.value };
    }
    return {
      opacity: interpolate(
        flip.value,
        [flipMidpoint, flipMidpoint + faceSwapWindow, 1],
        [0, 1, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        { perspective: keepsakePerspective },
        { rotateY: `${180 + flip.value * 180}deg` },
      ],
    };
  });
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      entrance.value,
      [0, 1],
      [focusedCardInitialOpacity, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          entrance.value,
          [0, 1],
          [-focusedCardTravel, 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          entrance.value,
          [0, 1],
          [focusedCardInitialScale, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  return (
    <View className="flex-1 items-center justify-center">
      <View
        accessibilityElementsHidden
        className="absolute inset-0 bg-overlay"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
      />
      <Pressable
        accessibilityElementsHidden
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
        testID="wedding-keepsake-backdrop"
      />
      <Animated.View
        accessibilityViewIsModal
        className="items-center gap-md"
        style={[{ width: cardWidth }, entranceStyle]}
        testID="wedding-keepsake-dialog"
      >
        <MotionPressable
          accessibilityHint={flipped ? "Shows the wedding summary" : "Reveals your message"}
          accessibilityLabel={flipped ? "Wedding message. Tap the card" : "Tap the card"}
          accessibilityRole="button"
          android_ripple={{ color: tokens.colors.nightSoft }}
          className="w-full shadow-elevated"
          onPress={flipCard}
          pressedScale={0.99}
          style={cardHeight ? { height: cardHeight } : undefined}
          testID="wedding-keepsake-card"
        >
          <Animated.View
            accessibilityElementsHidden={flipped}
            importantForAccessibility={flipped ? "no-hide-descendants" : "auto"}
            pointerEvents={flipped ? "none" : "auto"}
            style={[StyleSheet.absoluteFill, { backfaceVisibility: "hidden" }, frontStyle]}
          >
            <WeddingCardFace
              {...props}
              failedImageUri={failedImageUri}
              onImageError={onImageError}
            />
          </Animated.View>
          <Animated.View
            accessibilityElementsHidden={!flipped}
            importantForAccessibility={!flipped ? "no-hide-descendants" : "auto"}
            pointerEvents={flipped ? "auto" : "none"}
            style={[StyleSheet.absoluteFill, { backfaceVisibility: "hidden" }, backStyle]}
          >
            <KeepsakeMessageFace message={message} />
          </Animated.View>
        </MotionPressable>
        <AppText tone="nightAccent" variant="label">
          Tap the card
        </AppText>
      </Animated.View>
    </View>
  );
}

export function WeddingHero(props: WeddingHeroProps) {
  const [failedImageUri, setFailedImageUri] = useState<string>();
  const [keepsakeOpen, setKeepsakeOpen] = useState(false);
  const [sourceCardSize, setSourceCardSize] = useState({ height: 0, width: 0 });
  const closeKeepsake = () => {
    setKeepsakeOpen(false);
    props.onKeepsakeFocusChange?.(false);
  };

  return (
    <>
      <View
        onLayout={({ nativeEvent }) => {
          const { height, width } = nativeEvent.layout;
          if (height === sourceCardSize.height && width === sourceCardSize.width) return;
          setSourceCardSize({ height, width });
        }}
      >
        <WeddingCardFace
          {...props}
          failedImageUri={failedImageUri}
          onImageError={() => setFailedImageUri(props.coverPhotoUri)}
          onOpen={() => {
            props.onKeepsakeFocusChange?.(true);
            setKeepsakeOpen(true);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
      </View>
      <Modal
        animationType="fade"
        onRequestClose={closeKeepsake}
        statusBarTranslucent
        transparent
        visible={keepsakeOpen}
      >
        {keepsakeOpen ? (
          <FocusedWeddingKeepsake
            {...props}
            failedImageUri={failedImageUri}
            onClose={closeKeepsake}
            onImageError={() => setFailedImageUri(props.coverPhotoUri)}
            sourceCardHeight={sourceCardSize.height || undefined}
            sourceCardWidth={sourceCardSize.width || undefined}
          />
        ) : null}
      </Modal>
    </>
  );
}
