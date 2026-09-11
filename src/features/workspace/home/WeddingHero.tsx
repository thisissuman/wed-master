import { type ComponentRef, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Camera from "lucide-react-native/icons/camera";
import Heart from "lucide-react-native/icons/heart";
import X from "lucide-react-native/icons/x";
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
import { runNonCriticalNativeEffect } from "@/lib/native-effects";
import { isLargeText } from "@/lib/responsive";
import { motionDurations, tokens, useAppTheme, type AppThemeId } from "@/theme";
import { motionEasing } from "@/theme/motion";

import { displayedKeepsakeMessage } from "../wedding-profile";
import {
  defaultWeddingCardThemeId,
  getWeddingCardTheme,
  weddingCardArtworkAspectRatio,
  type WeddingCardTheme,
} from "./wedding-card-themes";

const compactLayoutWidth = 390;
const focusedCardMaxWidth =
  tokens.layout.expandedWidth - Number.parseInt(tokens.spacing["3xl"], 10);
const focusedCardHorizontalInset = Number.parseInt(tokens.spacing.md, 10);
const heroPageHorizontalPadding = focusedCardHorizontalInset * 2;
const heroPortalSizeRatio = 0.272;
const cameraButtonVisualSize = tokens.touchTarget - Number.parseInt(tokens.spacing.xs, 10);
const focusedCardTravel = tokens.touchTarget * 3;
const focusedCardInitialScale = 0.96;
const focusedCardInitialOpacity = 0.72;
const keepsakePerspective = tokens.layout.expandedWidth * 2;
const flipMidpoint = 0.5;
const faceSwapWindow = 0.02;
const flipDuration = motionDurations.entrance + motionDurations.fast;
const heroArtworkLayout = {
  countdown: {
    height: "42%",
    position: "absolute",
    right: "8.5%",
    top: "18%",
    width: "19%",
  },
  names: {
    height: "54%",
    left: "37.5%",
    position: "absolute",
    top: "10.5%",
    width: "27%",
  },
  portal: { left: "7.3%", position: "absolute", top: "16.6%" },
  progress: {
    bottom: "8.7%",
    height: "15.5%",
    left: "10%",
    position: "absolute",
    right: "10%",
  },
} as const;

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
  weddingCardThemeId?: AppThemeId;
  weddingDate: string;
};

const weddingDayCopy = (daysUntilWedding: number) => {
  if (daysUntilWedding === 0) {
    return {
      accessibilityLabel: "Wedding day",
      count: undefined,
      label: "Wedding day",
    };
  }

  const count = Math.abs(daysUntilWedding);
  const label =
    daysUntilWedding > 0
      ? count === 1
        ? "day remaining"
        : "days remaining"
      : count === 1
        ? "day since the wedding"
        : "days since the wedding";

  return {
    accessibilityLabel: `${count} ${label}`,
    count,
    label,
  };
};

const splitWeddingCardName = (name: string) => {
  const [firstName, ...partnerNameParts] = name.split(/\s+&\s+/);
  return {
    firstName: firstName?.trim() || name,
    partnerName: partnerNameParts.join(" & ").trim(),
  };
};

function HeroOrnament({
  mirrored = false,
  theme,
}: {
  mirrored?: boolean;
  theme: WeddingCardTheme;
}) {
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
          stroke={theme.keepsakeAccent}
          strokeWidth="1.2"
        />
        <Circle
          cx="100"
          cy="100"
          fill="none"
          opacity="0.12"
          r="84"
          stroke={theme.keepsakeText}
          strokeWidth="1"
        />
        <Path
          d="M42 128c30-36 66-55 112-54"
          fill="none"
          opacity="0.16"
          stroke={theme.keepsakeAccent}
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </Svg>
    </View>
  );
}

export function WeddingAvatarMonogram({
  name,
  size,
  theme,
}: {
  name: string;
  size: number;
  theme: WeddingCardTheme;
}) {
  const { firstName, partnerName } = splitWeddingCardName(name);
  const fallbackNames = partnerName
    ? [firstName, partnerName]
    : name.trim().split(/\s+/).slice(0, 2);
  const initials = [
    fallbackNames[0]?.[0] ?? "M",
    fallbackNames[1]?.[0] ?? fallbackNames[0]?.[0] ?? "M",
  ].map((initial) => initial.toLocaleUpperCase("en-IN"));
  const portraitSize = size * 0.68;

  return (
    <View
      accessibilityElementsHidden
      className="h-full w-full flex-row items-center justify-center"
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      testID="wedding-default-cover-monogram"
    >
      {initials.map((initial, index) => (
        <View
          className="items-center justify-center rounded-full border"
          key={`${initial}-${index}`}
          style={{
            backgroundColor: index === 0 ? theme.avatarSurface : theme.keepsakeIconSurface,
            borderColor: theme.keepsakeAccent,
            height: portraitSize,
            marginLeft: index === 0 ? 0 : -portraitSize * 0.22,
            width: portraitSize,
          }}
        >
          <AppText
            style={{ color: index === 0 ? theme.nameText : theme.keepsakeText }}
            variant="heading"
          >
            {initial}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function WeddingAvatar({
  coverPhotoUri,
  failedImageUri,
  isPhotoPending,
  onImageError,
  onPhotoPress,
  name,
  size,
  theme,
}: {
  coverPhotoUri?: string;
  failedImageUri?: string;
  isPhotoPending: boolean;
  onImageError: () => void;
  onPhotoPress: () => void;
  name: string;
  size: number;
  theme: WeddingCardTheme;
}) {
  const appTheme = useAppTheme();
  const hasUsableCover = Boolean(coverPhotoUri && coverPhotoUri !== failedImageUri);

  return (
    <View style={{ height: size + 10, width: size + 10 }}>
      <View
        className="overflow-hidden rounded-full"
        style={{ backgroundColor: theme.avatarSurface, height: size, width: size }}
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
          <WeddingAvatarMonogram name={name} size={size} theme={theme} />
        )}
      </View>
      <MotionPressable
        accessibilityLabel={`${hasUsableCover ? "Change" : "Add"} wedding cover photo`}
        accessibilityRole="button"
        accessibilityState={{ busy: isPhotoPending, disabled: isPhotoPending }}
        android_ripple={{ borderless: true, color: theme.ripple, radius: 24 }}
        className="absolute -bottom-1 -right-1 min-h-4xl min-w-4xl rounded-full disabled:opacity-60"
        disabled={isPhotoPending}
        onPress={(event) => {
          event.stopPropagation();
          onPhotoPress();
        }}
        pressedScale={0.94}
        style={{ alignItems: "center", bottom: 0, justifyContent: "center", right: -4 }}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{
            alignItems: "center",
            backgroundColor: theme.cameraSurface,
            borderColor: theme.cameraBorder,
            borderRadius: cameraButtonVisualSize / 2,
            borderWidth: 1,
            boxShadow: appTheme.elevation.raised,
            height: cameraButtonVisualSize,
            justifyContent: "center",
            width: cameraButtonVisualSize,
          }}
        >
          <Camera color={theme.cameraIcon} size={tokens.iconSize.sm} strokeWidth={1.9} />
        </View>
      </MotionPressable>
    </View>
  );
}

function PlanningProgress({
  compact,
  percentage,
  theme,
  totalTasks,
}: {
  compact: boolean;
  percentage: number;
  theme: WeddingCardTheme;
  totalTasks: number;
}) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const accessibilityText = totalTasks
    ? `${percentage}% of active planning tasks complete`
    : "No planning tasks yet, 0% planned";

  return (
    <View className="h-full">
      <View
        className="absolute left-0 right-0 top-0 flex-row items-center gap-xs"
        style={{ paddingLeft: compact ? 34 : 52 }}
      >
        <AppText
          className="flex-1"
          numberOfLines={1}
          style={{ color: theme.mutedText }}
          variant="caption"
        >
          Planning progress
        </AppText>
        <AppText
          style={{
            color: theme.progressText,
            fontVariant: ["tabular-nums"],
            textShadowColor: theme.textShadow,
            textShadowOffset: { height: 1, width: 0 },
            textShadowRadius: 4,
          }}
          variant="label"
        >
          {percentage}%
        </AppText>
      </View>
      <View
        accessibilityLabel="Planning progress"
        accessibilityRole="progressbar"
        accessibilityValue={{ max: 100, min: 0, now: clampedPercentage, text: accessibilityText }}
        accessible
        className="absolute left-0 right-0 h-2"
        style={{
          backgroundColor: "transparent",
          bottom: "5%",
        }}
      >
        <LinearGradient
          colors={theme.progressGradient}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={{
            borderRadius: Number.parseInt(tokens.radius.pill, 10),
            boxShadow: theme.progressShadow,
            height: "100%",
            width: `${clampedPercentage}%`,
          }}
        />
      </View>
    </View>
  );
}

function WeddingCountdown({
  daysUntilWedding,
  flexible = false,
  theme,
}: {
  daysUntilWedding: number;
  flexible?: boolean;
  theme: WeddingCardTheme;
}) {
  const copy = weddingDayCopy(daysUntilWedding);

  return (
    <View
      accessibilityLabel={copy.accessibilityLabel}
      accessibilityRole="text"
      accessible
      className={`${flexible ? "min-h-20" : "h-full"} w-full items-center justify-center`}
    >
      <View className="w-full items-center" importantForAccessibility="no-hide-descendants">
        {copy.count === undefined ? null : (
          <AppText
            adjustsFontSizeToFit={!flexible}
            className="w-full text-center"
            minimumFontScale={flexible ? undefined : 0.62}
            numberOfLines={flexible ? undefined : 1}
            style={{
              color: theme.countdown,
              fontVariant: ["tabular-nums"],
              textAlign: "center",
              textShadowColor: theme.textShadow,
              textShadowOffset: { height: 1, width: 0 },
              textShadowRadius: 5,
            }}
            variant={flexible ? "title" : "countdown"}
          >
            {copy.count}
          </AppText>
        )}
        <AppText
          adjustsFontSizeToFit={!flexible}
          className="w-full text-center"
          minimumFontScale={flexible ? undefined : 0.72}
          numberOfLines={flexible ? undefined : 2}
          style={{ color: theme.mutedText }}
          variant={flexible && copy.count === undefined ? "heading" : "caption"}
        >
          {copy.label}
        </AppText>
      </View>
    </View>
  );
}

function FlexiblePlanningProgress({
  percentage,
  theme,
  totalTasks,
}: {
  percentage: number;
  theme: WeddingCardTheme;
  totalTasks: number;
}) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const accessibilityText = totalTasks
    ? `${percentage}% of active planning tasks complete`
    : "No planning tasks yet, 0% planned";

  return (
    <View className="gap-xs">
      <View className="flex-row items-center gap-xs">
        <AppText className="flex-1" style={{ color: theme.mutedText }} variant="caption">
          Planning progress
        </AppText>
        <AppText
          style={{ color: theme.progressText, fontVariant: ["tabular-nums"] }}
          variant="label"
        >
          {percentage}%
        </AppText>
      </View>
      <View
        accessibilityLabel="Planning progress"
        accessibilityRole="progressbar"
        accessibilityValue={{ max: 100, min: 0, now: clampedPercentage, text: accessibilityText }}
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: theme.avatarSurface }}
      >
        <LinearGradient
          colors={theme.progressGradient}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={{ height: "100%", width: `${clampedPercentage}%` }}
        />
      </View>
    </View>
  );
}

function WeddingNames({
  compact,
  name,
  theme,
  weddingDate,
}: {
  compact: boolean;
  name: string;
  theme: WeddingCardTheme;
  weddingDate: string;
}) {
  const { firstName, partnerName } = splitWeddingCardName(name);
  const nameVariant = compact ? "heroCompact" : "hero";
  const nameShadow = {
    color: theme.nameText,
    textShadowColor: theme.textShadow,
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 4,
  } as const;

  return (
    <View
      accessibilityLabel={name}
      accessibilityRole="header"
      accessible
      className="items-center justify-center"
      style={heroArtworkLayout.names}
    >
      <View className="h-full w-full" importantForAccessibility="no-hide-descendants">
        <View className="absolute left-0 right-0 top-0 h-3/4 items-center justify-center">
          <AppText
            adjustsFontSizeToFit
            className="w-full text-center"
            minimumFontScale={0.62}
            numberOfLines={1}
            style={nameShadow}
            variant={nameVariant}
          >
            {firstName}
          </AppText>
          {partnerName ? (
            <>
              <AppText
                style={{
                  color: theme.keepsakeAccent,
                  lineHeight: compact ? 25 : 30,
                  textAlign: "center",
                  textShadowColor: theme.textShadow,
                  textShadowOffset: { height: 1, width: 0 },
                  textShadowRadius: 5,
                }}
                variant={nameVariant}
              >
                &
              </AppText>
              <AppText
                adjustsFontSizeToFit
                className="w-full text-center"
                minimumFontScale={0.62}
                numberOfLines={1}
                style={nameShadow}
                variant={nameVariant}
              >
                {partnerName}
              </AppText>
            </>
          ) : null}
        </View>
        <AppText
          adjustsFontSizeToFit
          className="absolute bottom-0 left-0 right-0 w-full text-center"
          minimumFontScale={0.72}
          numberOfLines={1}
          style={{ color: theme.mutedText }}
          variant="caption"
        >
          {formatDateOnly(weddingDate)}
        </AppText>
      </View>
    </View>
  );
}

type WeddingCardFaceProps = WeddingHeroProps & {
  failedImageUri?: string;
  onImageError: () => void;
};

function WeddingCardFace({
  completedTasks,
  coverPhotoUri,
  daysUntilWedding,
  failedImageUri,
  isPhotoPending,
  name,
  onImageError,
  onPhotoPress,
  totalTasks,
  weddingCardThemeId = defaultWeddingCardThemeId,
  weddingDate,
}: WeddingCardFaceProps) {
  const { fontScale, width } = useWindowDimensions();
  const cardWidth = Math.min(Math.max(width - heroPageHorizontalPadding, 0), focusedCardMaxWidth);
  const compact = cardWidth <= compactLayoutWidth;
  const largeText = isLargeText(fontScale);
  const avatarSize = cardWidth * heroPortalSizeRatio;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const theme = getWeddingCardTheme(weddingCardThemeId);
  const cardSurface = (
    <LinearGradient
      colors={theme.heroGradient}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{
        aspectRatio: largeText ? undefined : weddingCardArtworkAspectRatio,
        borderRadius: Number.parseInt(tokens.radius.card, 10),
        minHeight: largeText ? tokens.touchTarget * 7 : undefined,
        overflow: "hidden",
        width: "100%",
      }}
      testID="wedding-hero"
    >
      <Image
        accessible={false}
        accessibilityElementsHidden
        contentFit="fill"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        source={theme.artwork}
        style={StyleSheet.absoluteFill}
        testID="wedding-hero-artwork"
        transition={motionDurations.state}
      />
      {largeText ? (
        <View className="gap-lg p-md">
          <View className="flex-row flex-wrap items-center gap-md">
            <WeddingAvatar
              coverPhotoUri={coverPhotoUri}
              failedImageUri={failedImageUri}
              isPhotoPending={isPhotoPending}
              name={name}
              onImageError={onImageError}
              onPhotoPress={onPhotoPress}
              size={tokens.touchTarget * 2}
              theme={theme}
            />
            <View className="min-w-40 flex-1 gap-xs">
              <AppText
                accessibilityRole="header"
                style={{ color: theme.nameText, textShadowColor: theme.textShadow }}
                variant="title"
              >
                {name}
              </AppText>
              <AppText style={{ color: theme.mutedText }} variant="body">
                {formatDateOnly(weddingDate)}
              </AppText>
            </View>
          </View>
          <WeddingCountdown daysUntilWedding={daysUntilWedding} flexible theme={theme} />
          <FlexiblePlanningProgress percentage={percentage} theme={theme} totalTasks={totalTasks} />
        </View>
      ) : (
        <>
          <View style={{ ...heroArtworkLayout.portal, height: avatarSize, width: avatarSize }}>
            <WeddingAvatar
              coverPhotoUri={coverPhotoUri}
              failedImageUri={failedImageUri}
              isPhotoPending={isPhotoPending}
              name={name}
              onImageError={onImageError}
              onPhotoPress={onPhotoPress}
              size={avatarSize}
              theme={theme}
            />
          </View>
          <WeddingNames compact={compact} name={name} theme={theme} weddingDate={weddingDate} />
          <View style={heroArtworkLayout.countdown}>
            <WeddingCountdown daysUntilWedding={daysUntilWedding} theme={theme} />
          </View>
          <View style={heroArtworkLayout.progress}>
            <PlanningProgress
              compact={compact}
              percentage={percentage}
              theme={theme}
              totalTasks={totalTasks}
            />
          </View>
        </>
      )}
    </LinearGradient>
  );
  return cardSurface;
}

function KeepsakeMessageFace({ message, theme }: { message: string; theme: WeddingCardTheme }) {
  return (
    <LinearGradient
      colors={theme.keepsakeGradient}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ borderRadius: Number.parseInt(tokens.radius.hero, 10), flex: 1 }}
    >
      <View className="flex-1 items-center justify-center gap-lg overflow-hidden p-lg">
        <HeroOrnament mirrored theme={theme} />
        <View
          className="h-14 w-14 items-center justify-center rounded-full border"
          style={{
            backgroundColor: theme.keepsakeIconSurface,
            borderColor: theme.keepsakeAccent,
          }}
        >
          <Heart color={theme.keepsakeAccent} fill={theme.keepsakeAccent} size={26} />
        </View>
        <View className="max-w-md gap-md">
          <AppText
            accessibilityRole="text"
            adjustsFontSizeToFit
            className="text-center"
            minimumFontScale={0.72}
            numberOfLines={6}
            style={{ color: theme.keepsakeText }}
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
  const closeButtonRef = useRef<ComponentRef<typeof Pressable>>(null);
  const entrance = useSharedValue(reduceMotion ? 1 : 0);
  const flip = useSharedValue(0);
  const cardWidth = Math.min(
    sourceCardWidth ?? focusedCardMaxWidth,
    width - focusedCardHorizontalInset * 2,
  );
  const cardHeight = sourceCardHeight;
  const message = displayedKeepsakeMessage(props.keepsakeMessage);
  const theme = getWeddingCardTheme(props.weddingCardThemeId);

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

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const reactTag = findNodeHandle(closeButtonRef.current);
      if (reactTag) AccessibilityInfo.setAccessibilityFocus(reactTag);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const flipCard = () => {
    const next = !flipped;
    setFlipped(next);
    flip.set(
      withTiming(next ? 1 : 0, {
        duration: reduceMotion ? motionDurations.fast : flipDuration,
        easing: motionEasing.move,
      }),
    );
    runNonCriticalNativeEffect(() => Haptics.selectionAsync());
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
          android_ripple={{ color: theme.ripple }}
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
            <KeepsakeMessageFace message={message} theme={theme} />
          </Animated.View>
        </MotionPressable>
        <AppText tone="nightAccent" variant="label">
          Tap the card
        </AppText>
        <MotionPressable
          accessibilityLabel="Close keepsake"
          accessibilityRole="button"
          className="min-h-4xl flex-row items-center justify-center gap-xs rounded-control border border-translucentBorder bg-translucentSurface px-md"
          onPress={onClose}
          pressedScale={0.97}
          ref={closeButtonRef}
        >
          <X color={theme.keepsakeAccent} size={tokens.iconSize.sm} />
          <AppText tone="nightAccent" variant="label">
            Close
          </AppText>
        </MotionPressable>
      </Animated.View>
    </View>
  );
}

export function WeddingHero(props: WeddingHeroProps) {
  const appTheme = useAppTheme();
  const [failedImageUri, setFailedImageUri] = useState<string>();
  const [keepsakeOpen, setKeepsakeOpen] = useState(false);
  const [sourceCardSize, setSourceCardSize] = useState({ height: 0, width: 0 });
  const openKeepsakeRef = useRef<ComponentRef<typeof Pressable>>(null);
  const closeKeepsake = () => {
    setKeepsakeOpen(false);
    props.onKeepsakeFocusChange?.(false);
    requestAnimationFrame(() => {
      const reactTag = findNodeHandle(openKeepsakeRef.current);
      if (reactTag) AccessibilityInfo.setAccessibilityFocus(reactTag);
    });
  };

  const openKeepsake = () => {
    props.onKeepsakeFocusChange?.(true);
    setKeepsakeOpen(true);
    runNonCriticalNativeEffect(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  };

  return (
    <>
      <View
        className="items-center gap-sm"
        style={{ alignSelf: "center", maxWidth: focusedCardMaxWidth, width: "100%" }}
      >
        <MotionPressable
          accessibilityHint="Opens your wedding card and message"
          accessibilityLabel={`Wedding card for ${props.name}`}
          accessibilityRole="button"
          android_ripple={{ color: appTheme.colors.primarySoft }}
          onLayout={({ nativeEvent }) => {
            const { height, width } = nativeEvent.layout;
            if (height === sourceCardSize.height && width === sourceCardSize.width) return;
            setSourceCardSize({ height, width });
          }}
          onPress={openKeepsake}
          pressedScale={0.985}
          ref={openKeepsakeRef}
          style={{ width: "100%" }}
          testID="wedding-hero-source"
        >
          <WeddingCardFace
            {...props}
            failedImageUri={failedImageUri}
            onImageError={() => setFailedImageUri(props.coverPhotoUri)}
          />
        </MotionPressable>
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
