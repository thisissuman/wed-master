import { Image } from "expo-image";
import type { LucideIcon } from "lucide-react-native";
import CalendarDays from "lucide-react-native/icons/calendar-days";
import CheckSquare2 from "lucide-react-native/icons/square-check";
import IndianRupee from "lucide-react-native/icons/indian-rupee";
import Sparkles from "lucide-react-native/icons/sparkles";
import UsersRound from "lucide-react-native/icons/users-round";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { onboardingTheme as theme } from "./onboarding-theme";

const easeOut = Easing.bezier(0.23, 1, 0.32, 1);

const onboardingArtwork = {
  intro: [
    require("../../../../assets/images/mangalya/onboarding/intro-together.webp"),
    require("../../../../assets/images/mangalya/onboarding/intro-calm.webp"),
    require("../../../../assets/images/mangalya/onboarding/intro-family.webp"),
  ],
  names: require("../../../../assets/images/mangalya/onboarding/names.webp"),
  milestones: require("../../../../assets/images/mangalya/onboarding/date-budget.webp"),
  cover: require("../../../../assets/images/mangalya/onboarding/cover-photo.webp"),
  events: require("../../../../assets/images/mangalya/onboarding/events.webp"),
  review: require("../../../../assets/images/mangalya/onboarding/review.webp"),
  building: require("../../../../assets/images/mangalya/onboarding/building.webp"),
} as const;

function ArtworkFrame({
  children,
  dark = false,
  aspectRatio = 8 / 5,
  source,
}: PropsWithChildren<{
  aspectRatio?: number;
  dark?: boolean;
  source: number;
}>) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: dark ? theme.colors.nightSurface : theme.colors.primarySoft,
        borderColor: theme.colors.translucentBorder,
        borderRadius: theme.radius.card,
        borderWidth: 1,
        aspectRatio,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Image
        contentFit="cover"
        source={source}
        style={{ height: "100%", opacity: dark ? 0.92 : 1, width: "100%" }}
        transition={180}
      />
      {children}
    </View>
  );
}

function LiveValue({
  align = "center",
  color = theme.colors.artworkInk,
  family = "semibold",
  placeholder = "",
  reduceMotion,
  size = 22,
  testID,
  value,
}: {
  align?: "center" | "left" | "right";
  color?: string;
  family?: "body" | "medium" | "semibold" | "signature";
  placeholder?: string;
  reduceMotion: boolean;
  size?: number;
  testID?: string;
  value: string;
}) {
  const visibleValue = value.trim() || placeholder;
  return (
    <Animated.Text
      accessibilityLiveRegion="polite"
      entering={reduceMotion ? undefined : FadeInUp.duration(180)}
      key={visibleValue}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.68}
      style={{
        color: value.trim() ? color : theme.colors.artworkMutedInk,
        fontFamily: theme.fonts[family],
        fontSize: size,
        lineHeight: Math.round(size * 1.1),
        textAlign: align,
      }}
      testID={testID}
    >
      {visibleValue}
    </Animated.Text>
  );
}

function PaperSlot({
  children,
  height,
  left,
  rotate,
  testID,
  top,
  width,
}: {
  children: ReactNode;
  height: `${number}%`;
  left: `${number}%`;
  rotate?: `${number}deg`;
  testID?: string;
  top: `${number}%`;
  width: `${number}%`;
}) {
  return (
    <View
      testID={testID}
      style={{
        alignItems: "center",
        height,
        justifyContent: "center",
        left,
        paddingHorizontal: 8,
        position: "absolute",
        top,
        transform: rotate ? [{ rotate }] : undefined,
        width,
      }}
    >
      {children}
    </View>
  );
}

export function IntroVisual({ index, reduceMotion }: { index: number; reduceMotion: boolean }) {
  const scale = useSharedValue(reduceMotion ? 1 : 0.96);
  const offset = useSharedValue(reduceMotion ? 0 : 14);

  useEffect(() => {
    scale.set(withTiming(1, { duration: reduceMotion ? 0 : 520, easing: easeOut }));
    offset.set(withTiming(0, { duration: reduceMotion ? 0 : 520, easing: easeOut }));
  }, [index, offset, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - offset.value / 40,
    transform: [{ translateY: offset.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ maxWidth: 480, width: "100%" }, style]}>
      <ArtworkFrame
        aspectRatio={4 / 3}
        dark
        source={onboardingArtwork.intro[index] ?? onboardingArtwork.intro[0]}
      >
        <View
          style={{
            backgroundColor: "rgba(40,16,47,0.18)",
            bottom: 0,
            left: 0,
            position: "absolute",
            right: 0,
            top: 0,
          }}
        />
      </ArtworkFrame>
    </Animated.View>
  );
}

export function NamesVisual({
  partnerName,
  reduceMotion,
  yourName,
}: {
  partnerName: string;
  reduceMotion: boolean;
  yourName: string;
}) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(1, { duration: reduceMotion ? 0 : 560, easing: easeOut }));
  }, [progress, reduceMotion]);
  const panelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 18 * (1 - progress.value) }, { scale: 0.97 + progress.value * 0.03 }],
  }));

  return (
    <ArtworkFrame source={onboardingArtwork.names}>
      <Animated.View
        style={[
          {
            bottom: 0,
            left: 0,
            position: "absolute",
            right: 0,
            top: 0,
          },
          panelStyle,
        ]}
      >
        <PaperSlot height="22%" left="5%" testID="names-artwork-your-name" top="61%" width="37%">
          <LiveValue
            family="signature"
            reduceMotion={reduceMotion}
            size={23}
            testID="names-artwork-your-name-value"
            value={yourName}
          />
        </PaperSlot>
        <PaperSlot
          height="22%"
          left="58%"
          testID="names-artwork-partner-name"
          top="61%"
          width="37%"
        >
          <LiveValue
            family="signature"
            reduceMotion={reduceMotion}
            size={23}
            testID="names-artwork-partner-name-value"
            value={partnerName}
          />
        </PaperSlot>
      </Animated.View>
    </ArtworkFrame>
  );
}

export function DateBudgetVisual({
  budget,
  date,
  reduceMotion,
}: {
  budget: string;
  date: string;
  reduceMotion: boolean;
}) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(1, { duration: reduceMotion ? 0 : 560, easing: easeOut }));
  }, [progress, reduceMotion]);
  const leftStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: -12 * (1 - progress.value) }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: 12 * (1 - progress.value) }],
  }));

  return (
    <ArtworkFrame source={onboardingArtwork.milestones}>
      <Animated.View
        style={[{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }, leftStyle]}
      >
        <PaperSlot height="31%" left="9%" testID="milestones-artwork-date" top="28%" width="39%">
          <LiveValue
            reduceMotion={reduceMotion}
            size={21}
            testID="milestones-artwork-date-value"
            value={date}
          />
        </PaperSlot>
      </Animated.View>
      <Animated.View
        style={[{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }, rightStyle]}
      >
        <PaperSlot height="38%" left="60%" testID="milestones-artwork-budget" top="28%" width="32%">
          <LiveValue
            reduceMotion={reduceMotion}
            size={22}
            testID="milestones-artwork-budget-value"
            value={budget ? `₹${budget}` : ""}
          />
        </PaperSlot>
      </Animated.View>
    </ArtworkFrame>
  );
}

export function CoverVisual({
  photoUri,
  reduceMotion,
}: {
  photoUri?: string;
  reduceMotion: boolean;
}) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(1, { duration: reduceMotion ? 0 : 560, easing: easeOut }));
  }, [progress, reduceMotion]);
  const previewStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.97 + progress.value * 0.03 }],
  }));

  return (
    <ArtworkFrame source={onboardingArtwork.cover}>
      {photoUri ? (
        <Animated.View
          style={[
            {
              borderRadius: 11,
              height: "49%",
              left: "25.5%",
              overflow: "hidden",
              position: "absolute",
              top: "20%",
              width: "49%",
            },
            previewStyle,
          ]}
          testID="wedding-photo-artwork-preview"
        >
          <Image
            accessibilityLabel="Wedding photo preview"
            contentFit="cover"
            source={{ uri: photoUri }}
            style={{ height: "100%", width: "100%" }}
            transition={180}
          />
        </Animated.View>
      ) : null}
    </ArtworkFrame>
  );
}

export function EventsVisual({
  reduceMotion,
  selectedEvents,
}: {
  reduceMotion: boolean;
  selectedEvents: readonly string[];
}) {
  const slots = [
    { height: "27%", left: "9%", rotate: "-12deg", top: "19%", width: "21%" },
    { height: "27%", left: "28%", rotate: "-4deg", top: "13%", width: "21%" },
    { height: "27%", left: "50%", rotate: "4deg", top: "13%", width: "21%" },
    { height: "27%", left: "70%", rotate: "12deg", top: "19%", width: "21%" },
    { height: "27%", left: "23%", rotate: "-8deg", top: "52%", width: "21%" },
    { height: "27%", left: "39.5%", top: "48%", width: "21%" },
    { height: "27%", left: "57%", rotate: "8deg", top: "52%", width: "21%" },
  ] as const;

  return (
    <ArtworkFrame source={onboardingArtwork.events}>
      {slots.map((slot, index) => {
        const eventName = selectedEvents[index] ?? "";
        return (
          <Animated.View
            entering={
              reduceMotion || !eventName ? undefined : FadeInUp.delay(index * 35).duration(180)
            }
            key={`${index}-${eventName}`}
            style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
          >
            <PaperSlot {...slot} testID={`events-artwork-event-${index + 1}`}>
              <LiveValue
                reduceMotion={reduceMotion}
                size={eventName ? (eventName.length > 11 ? 13 : 15) : 13}
                value={eventName}
              />
            </PaperSlot>
          </Animated.View>
        );
      })}
    </ArtworkFrame>
  );
}

function ReviewPaperValue({
  family = "semibold",
  reduceMotion,
  size,
  testID,
  value,
}: {
  family?: "semibold" | "signature";
  reduceMotion: boolean;
  size: number;
  testID: string;
  value: string;
}) {
  const visibleValue = value.trim();

  return (
    <Animated.Text
      accessibilityLiveRegion="polite"
      adjustsFontSizeToFit
      entering={reduceMotion ? undefined : FadeInUp.duration(180)}
      key={visibleValue}
      minimumFontScale={0.66}
      numberOfLines={1}
      style={{
        color: value.trim() ? theme.colors.artworkInk : theme.colors.artworkMutedInk,
        fontFamily: theme.fonts[family],
        fontSize: size,
        letterSpacing: -0.2,
        lineHeight: Math.round(size * 1.08),
        textAlign: "center",
      }}
      testID={testID}
    >
      {visibleValue}
    </Animated.Text>
  );
}

export function ReviewVisual({
  budget,
  coverPhotoUri,
  date,
  eventCount,
  names,
  reduceMotion,
}: {
  budget: string;
  coverPhotoUri?: string;
  date: string;
  eventCount: string;
  names: string;
  reduceMotion: boolean;
}) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    progress.set(withTiming(1, { duration: reduceMotion ? 0 : 560, easing: easeOut }));
  }, [progress, reduceMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  return (
    <Animated.View style={[{ width: "100%" }, style]}>
      <ArtworkFrame dark source={onboardingArtwork.review}>
        <PaperSlot
          height="17%"
          left="17%"
          rotate="-3deg"
          testID="review-artwork-names-slot"
          top="35%"
          width="31%"
        >
          <ReviewPaperValue
            family="signature"
            reduceMotion={reduceMotion}
            size={18}
            testID="review-artwork-names"
            value={names}
          />
        </PaperSlot>
        <PaperSlot
          height="16%"
          left="20%"
          rotate="-3deg"
          testID="review-artwork-date-slot"
          top="51%"
          width="30%"
        >
          <ReviewPaperValue
            reduceMotion={reduceMotion}
            size={17}
            testID="review-artwork-date"
            value={date}
          />
        </PaperSlot>
        <PaperSlot
          height="16%"
          left="50%"
          rotate="-3deg"
          testID="review-artwork-budget-slot"
          top="33%"
          width="33%"
        >
          <ReviewPaperValue
            reduceMotion={reduceMotion}
            size={18}
            testID="review-artwork-budget"
            value={budget}
          />
        </PaperSlot>
        <PaperSlot
          height="16%"
          left="53%"
          rotate="-3deg"
          testID="review-artwork-events-slot"
          top="49%"
          width="30%"
        >
          <ReviewPaperValue
            reduceMotion={reduceMotion}
            size={17}
            testID="review-artwork-events"
            value={eventCount}
          />
        </PaperSlot>
        {coverPhotoUri ? (
          <Image
            contentFit="cover"
            source={{ uri: coverPhotoUri }}
            style={{
              borderRadius: 5,
              height: "14%",
              left: "66.5%",
              position: "absolute",
              top: "13%",
              transform: [{ rotate: "-4deg" }],
              width: "11%",
            }}
            testID="review-artwork-photo"
            transition={180}
          />
        ) : null}
      </ArtworkFrame>
    </Animated.View>
  );
}

const buildModules = [
  { icon: CalendarDays, label: "Events", x: -106, y: -58 },
  { icon: CheckSquare2, label: "Checklist", x: 106, y: -58 },
  { icon: IndianRupee, label: "Budget", x: -106, y: 62 },
  { icon: UsersRound, label: "Guests", x: 106, y: 62 },
] as const;

export function BuildingVisual({ reduceMotion }: { reduceMotion: boolean }) {
  const imageScale = useSharedValue(reduceMotion ? 1 : 0.94);
  useEffect(() => {
    imageScale.set(withTiming(1, { duration: reduceMotion ? 0 : 900, easing: easeOut }));
  }, [imageScale, reduceMotion]);
  const imageStyle = useAnimatedStyle(() => ({ transform: [{ scale: imageScale.value }] }));

  return (
    <Animated.View style={[{ aspectRatio: 8 / 5, maxWidth: 500, width: "100%" }, imageStyle]}>
      <ArtworkFrame dark source={onboardingArtwork.building}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: "rgba(40,16,47,0.18)",
            bottom: 0,
            justifyContent: "center",
            left: 0,
            position: "absolute",
            right: 0,
            top: 0,
          }}
        >
          <View
            style={{
              alignItems: "center",
              backgroundColor: theme.colors.elevatedSurface,
              borderColor: theme.colors.gold,
              borderRadius: 24,
              borderWidth: 1,
              height: 94,
              justifyContent: "center",
              width: 94,
            }}
          >
            <Sparkles color={theme.colors.primary} size={36} strokeWidth={1.7} />
          </View>
          {buildModules.map((module, index) => (
            <BuildModule
              index={index}
              key={module.label}
              module={module}
              reduceMotion={reduceMotion}
            />
          ))}
        </View>
      </ArtworkFrame>
    </Animated.View>
  );
}

function BuildModule({
  index,
  module,
  reduceMotion,
}: {
  index: number;
  module: (typeof buildModules)[number];
  reduceMotion: boolean;
}) {
  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    reveal.set(
      withDelay(
        reduceMotion ? 0 : 420 + index * 820,
        withTiming(1, { duration: reduceMotion ? 0 : 420, easing: easeOut }),
      ),
    );
  }, [index, reduceMotion, reveal]);
  const style = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [
      { translateX: module.x * reveal.value },
      { translateY: module.y * reveal.value },
      { scale: 0.8 + reveal.value * 0.2 },
    ],
  }));
  const Icon = module.icon as LucideIcon;

  return (
    <Animated.View
      style={[
        {
          alignItems: "center",
          backgroundColor: theme.colors.translucentSurface,
          borderColor: theme.colors.translucentBorder,
          borderRadius: 14,
          borderWidth: 1,
          gap: 3,
          justifyContent: "center",
          minHeight: 60,
          paddingHorizontal: 10,
          position: "absolute",
          width: 88,
        },
        style,
      ]}
    >
      <Icon color={theme.colors.primary} size={20} strokeWidth={1.8} />
      <Animated.Text
        style={{ color: theme.colors.text, fontFamily: theme.fonts.semibold, fontSize: 11 }}
      >
        {module.label}
      </Animated.Text>
    </Animated.View>
  );
}
