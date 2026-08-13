import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  CalendarDays,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ImagePlus,
  IndianRupee,
  LockKeyhole,
  Pencil,
  Trash2,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  FlatList,
  Linking,
  TextInput,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { MotionPressable } from "@/components/ui";
import { formatDateOnly, toDateOnly } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";

import { pickWeddingCoverPhoto, removeWeddingCoverPhoto } from "../files/workspace-files";
import { toPaise } from "../forms";
import { useCreateWorkspaceMutation } from "../provider";
import { createEmptyWorkspace, suggestedEventDefinitions } from "../seed";
import type { ISODate, StarterEventKey } from "../types";
import {
  BuildingVisual,
  CoverVisual,
  DateBudgetVisual,
  EventsVisual,
  IntroVisual,
  NamesVisual,
  ReviewVisual,
} from "./OnboardingVisuals";
import {
  OnboardingButton,
  OnboardingCard,
  OnboardingStep,
  OnboardingText,
  StepHeading,
} from "./OnboardingPrimitives";
import { digitsOnly, formatBudgetInput } from "./onboarding-format";
import { onboardingGradients, onboardingTheme as theme } from "./onboarding-theme";

type OnboardingStage =
  "intro" | "names" | "milestones" | "cover" | "events" | "review" | "building";

type IntroSlide = {
  body: string;
  id: string;
  title: string;
};

const introSlides: readonly IntroSlide[] = [
  {
    id: "together",
    title: "Plan your wedding, together",
    body: "Ceremonies, tasks, guests and budgets — shaped around your family.",
  },
  {
    id: "calm",
    title: "Everything in one calm place",
    body: "See what matters now, keep plans moving and make every detail editable.",
  },
  {
    id: "family",
    title: "Made for your family",
    body: "Choose the events that fit your celebration. Nothing is assumed or required.",
  },
] as const;

const buildingMessages = [
  "Adding your selected events",
  "Preparing your wedding checklist",
  "Connecting dates and budget",
  "Finishing your private workspace",
] as const;

const setupCoverErrorMessage = (error: unknown) =>
  error instanceof Error &&
  /Cover photos must|Choose an image for the wedding cover/.test(error.message)
    ? error.message
    : toUserMessage(error);

const dateFromValue = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function FormTextField({
  error,
  label,
  onChangeText,
  optional = false,
  placeholder,
  prefix,
  value,
}: {
  error?: string;
  label: string;
  onChangeText: (value: string) => void;
  optional?: boolean;
  placeholder: string;
  prefix?: string;
  value: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ alignItems: "baseline", flexDirection: "row", gap: 8 }}>
        <OnboardingText family="semibold" size={14}>
          {label}
        </OnboardingText>
        <OnboardingText
          accessibilityLabel={optional ? undefined : "required"}
          color={optional ? theme.colors.mutedText : theme.colors.danger}
          size={12}
        >
          {optional ? "Optional" : "Required"}
        </OnboardingText>
      </View>
      <View
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.elevatedIvory,
          borderColor: error
            ? theme.colors.danger
            : focused
              ? theme.colors.plum
              : theme.colors.border,
          borderRadius: theme.radius.control,
          borderWidth: focused ? 2 : 1,
          flexDirection: "row",
          minHeight: theme.layout.controlHeight,
        }}
      >
        {prefix ? (
          <OnboardingText family="semibold" size={18} style={{ paddingLeft: 16 }}>
            {prefix}
          </OnboardingText>
        ) : null}
        <TextInput
          accessibilityHint={error}
          accessibilityLabel={label}
          autoCapitalize={prefix ? "none" : "words"}
          autoComplete="off"
          keyboardType={prefix ? "number-pad" : "default"}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedText}
          returnKeyType="done"
          style={{
            color: theme.colors.text,
            flex: 1,
            fontFamily: theme.fonts.body,
            fontSize: 16,
            minHeight: theme.layout.controlHeight,
            paddingHorizontal: prefix ? 10 : 16,
          }}
          value={value}
        />
      </View>
      {error ? (
        <OnboardingText accessibilityRole="alert" color={theme.colors.danger} size={13}>
          {error}
        </OnboardingText>
      ) : null}
    </View>
  );
}

function ReviewSummaryTile({
  fullWidth = false,
  icon: Icon,
  label,
  onPress,
  value,
}: {
  fullWidth?: boolean;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <MotionPressable
      accessibilityLabel={`Edit ${label.toLowerCase()}, ${value}`}
      accessibilityRole="button"
      onPress={onPress}
      pressedScale={0.985}
      style={{
        alignItems: "center",
        backgroundColor: "rgba(233,223,240,0.16)",
        borderColor: "rgba(255,248,242,0.18)",
        borderRadius: theme.radius.control,
        borderWidth: 1,
        flexBasis: fullWidth ? "100%" : "47%",
        flexDirection: "row",
        flexGrow: 1,
        gap: 10,
        minHeight: 58,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: "rgba(217,170,88,0.18)",
          borderRadius: 18,
          height: 36,
          justifyContent: "center",
          width: 36,
        }}
      >
        <Icon color={theme.colors.gold} size={18} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <OnboardingText color="rgba(255,248,242,0.68)" size={10}>
          {label}
        </OnboardingText>
        <OnboardingText color={theme.colors.ivory} family="semibold" size={13} numberOfLines={1}>
          {value}
        </OnboardingText>
      </View>
      <Pencil color="rgba(255,248,242,0.64)" size={14} />
    </MotionPressable>
  );
}

function IntroScreen({
  index,
  onIndexChange,
  onStart,
  reduceMotion,
}: {
  index: number;
  onIndexChange: (index: number) => void;
  onStart: () => void;
  reduceMotion: boolean;
}) {
  const listRef = useRef<FlatList<IntroSlide>>(null);
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, theme.layout.maxWidth);

  useEffect(() => {
    listRef.current?.scrollToIndex({ animated: !reduceMotion, index });
  }, [index, pageWidth, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || index >= introSlides.length - 1) return;
    const timer = setTimeout(() => onIndexChange(index + 1), theme.motion.carousel);
    return () => clearTimeout(timer);
  }, [index, onIndexChange, reduceMotion]);

  const next = () => {
    if (index === introSlides.length - 1) {
      onStart();
      return;
    }
    const nextIndex = index + 1;
    onIndexChange(nextIndex);
  };

  const updateIndex = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onIndexChange(
      Math.max(0, Math.min(2, Math.round(event.nativeEvent.contentOffset.x / pageWidth))),
    );
  };

  return (
    <LinearGradient
      colors={onboardingGradients.celebration}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <SafeAreaView style={{ alignItems: "center", flex: 1, paddingBottom: 20, paddingTop: 12 }}>
        <OnboardingText color={theme.colors.ivory} family="wordmark" size={30}>
          Mangalya
        </OnboardingText>
        <FlatList
          accessibilityLabel="Mangalya introduction"
          data={introSlides}
          decelerationRate="fast"
          getItemLayout={(_, itemIndex) => ({
            index: itemIndex,
            length: pageWidth,
            offset: pageWidth * itemIndex,
          })}
          horizontal
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={updateIndex}
          pagingEnabled
          ref={listRef}
          renderItem={({ item, index: slideIndex }) => (
            <View
              accessibilityElementsHidden={slideIndex !== index}
              importantForAccessibility={slideIndex === index ? "auto" : "no-hide-descendants"}
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: theme.layout.pagePadding,
                width: pageWidth,
              }}
            >
              <IntroVisual index={slideIndex} reduceMotion={reduceMotion} />
              <OnboardingText
                accessibilityLiveRegion="polite"
                color={theme.colors.ivory}
                family="emotional"
                size={42}
                style={{ letterSpacing: -0.6, textAlign: "center" }}
              >
                {item.title}
              </OnboardingText>
              <OnboardingText
                color="rgba(255,248,242,0.84)"
                size={16}
                style={{ marginTop: 12, maxWidth: 390, textAlign: "center" }}
              >
                {item.body}
              </OnboardingText>
            </View>
          )}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1, maxWidth: pageWidth, width: pageWidth }}
        />
        <View
          accessibilityLabel={`Slide ${index + 1} of 3`}
          style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}
        >
          {introSlides.map((slide, dotIndex) => (
            <View
              key={slide.id}
              testID={`intro-dot-${dotIndex + 1}`}
              style={{
                backgroundColor: dotIndex === index ? theme.colors.gold : "rgba(255,248,242,0.42)",
                borderRadius: 99,
                height: 8,
                width: dotIndex === index ? 28 : 8,
              }}
            />
          ))}
        </View>
        <View
          style={{
            maxWidth: theme.layout.maxWidth,
            paddingHorizontal: theme.layout.pagePadding,
            width: "100%",
          }}
        >
          <OnboardingButton
            label={index === 2 ? "Get started" : "Next"}
            onPress={next}
            variant="light"
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

export function LocalSetupScreen() {
  const mutation = useCreateWorkspaceMutation();
  const reduceMotion = useReducedMotion();
  const pendingCoverPhotoRef = useRef<string | undefined>(undefined);
  const submissionInFlightRef = useRef(false);
  const [stage, setStage] = useState<OnboardingStage>("intro");
  const [introIndex, setIntroIndex] = useState(0);
  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [date, setDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [budgetTarget, setBudgetTarget] = useState("");
  const [budgetError, setBudgetError] = useState<string>();
  const [coverPhotoUri, setCoverPhotoUri] = useState<string>();
  const [coverPhotoError, setCoverPhotoError] = useState<string>();
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [starterEventSelection, setStarterEventSelection] = useState<StarterEventKey[]>([
    "wedding",
  ]);
  const [nameErrors, setNameErrors] = useState<{ partner?: string; yours?: string }>({});
  const [dateError, setDateError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [buildingMessageIndex, setBuildingMessageIndex] = useState(0);

  useEffect(() => {
    if (stage !== "building" || submitError || reduceMotion) return;
    const timers = buildingMessages
      .slice(1)
      .map((_, index) =>
        setTimeout(() => setBuildingMessageIndex(index + 1), 1_050 + index * 1_050),
      );
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion, stage, submitError]);

  useEffect(
    () => () => {
      if (pendingCoverPhotoRef.current) removeWeddingCoverPhoto(pendingCoverPhotoRef.current);
    },
    [],
  );

  const previousStage = useCallback(() => {
    if (stage === "names") setStage("intro");
    else if (stage === "milestones") setStage("names");
    else if (stage === "cover") setStage("milestones");
    else if (stage === "events") setStage("cover");
    else if (stage === "review") setStage("events");
  }, [stage]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stage === "building") return true;
      if (stage === "intro") {
        if (introIndex === 0) return false;
        setIntroIndex((value) => Math.max(0, value - 1));
        return true;
      }
      previousStage();
      return true;
    });
    return () => subscription.remove();
  }, [introIndex, previousStage, stage]);

  const continueNames = () => {
    const errors = {
      yours: yourName.trim() ? undefined : "Enter your name.",
      partner: partnerName.trim() ? undefined : "Enter your partner’s name.",
    };
    setNameErrors(errors);
    if (errors.yours || errors.partner) return;
    setStage("milestones");
  };

  const continueMilestones = () => {
    if (!date) {
      setDateError("Choose your wedding date.");
      return;
    }
    const budgetDigits = digitsOnly(budgetTarget);
    if (budgetDigits && !Number.isSafeInteger(toPaise(budgetDigits))) {
      setBudgetError("Enter a smaller budget target.");
      return;
    }
    setDateError(undefined);
    setBudgetError(undefined);
    setStage("cover");
  };

  const openPhotoSettings = () => {
    void Linking.openSettings().catch(() => {
      Alert.alert(
        "Could not open settings",
        "Open Mangalya in your device settings and allow photo access.",
      );
    });
  };

  const pickCoverPhoto = async () => {
    if (isPickingPhoto || mutation.isPending) return;
    setCoverPhotoError(undefined);
    setIsPickingPhoto(true);
    try {
      const result = await pickWeddingCoverPhoto();
      if (result.status === "cancelled") return;
      if (result.status === "permission-denied") {
        Alert.alert(
          "Photo access needed",
          result.canAskAgain
            ? "Allow photo access to choose a wedding photo, or continue without one."
            : "Photo access is disabled. You can continue without a photo or enable it in settings.",
          [
            { style: "cancel", text: "Continue without photo" },
            { onPress: openPhotoSettings, text: "Open settings" },
            ...(result.canAskAgain
              ? [{ onPress: () => void pickCoverPhoto(), text: "Try again" }]
              : []),
          ],
        );
        return;
      }
      if (pendingCoverPhotoRef.current) removeWeddingCoverPhoto(pendingCoverPhotoRef.current);
      pendingCoverPhotoRef.current = result.uri;
      setCoverPhotoUri(result.uri);
    } catch (error) {
      setCoverPhotoError(setupCoverErrorMessage(error));
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const removeCoverPhoto = () => {
    if (pendingCoverPhotoRef.current) removeWeddingCoverPhoto(pendingCoverPhotoRef.current);
    pendingCoverPhotoRef.current = undefined;
    setCoverPhotoUri(undefined);
    setCoverPhotoError(undefined);
  };

  const toggleEvent = (key: StarterEventKey) => {
    setStarterEventSelection((selection) =>
      selection.includes(key) ? selection.filter((item) => item !== key) : [...selection, key],
    );
  };

  const buildWorkspace = async () => {
    if (submissionInFlightRef.current) return;
    submissionInFlightRef.current = true;
    setSubmitError(undefined);
    setBuildingMessageIndex(0);
    setStage("building");
    const budgetDigits = digitsOnly(budgetTarget);
    try {
      await Promise.all([
        mutation.mutateAsync(
          createEmptyWorkspace(
            {
              name: `${yourName.trim()} & ${partnerName.trim()}`,
              date: date as ISODate,
              location: "To be decided",
              type: "Not specified",
              budgetTargetPaise: budgetDigits ? toPaise(budgetDigits) : undefined,
              coverPhotoUri,
            },
            starterEventSelection,
          ),
        ),
        reduceMotion ? Promise.resolve() : delay(theme.motion.build),
      ]);
      pendingCoverPhotoRef.current = undefined;
      router.replace("/(app)/(tabs)");
    } catch (error) {
      setSubmitError(toUserMessage(error));
    } finally {
      submissionInFlightRef.current = false;
    }
  };

  if (stage === "intro") {
    return (
      <IntroScreen
        index={introIndex}
        onIndexChange={setIntroIndex}
        onStart={() => setStage("names")}
        reduceMotion={reduceMotion}
      />
    );
  }

  if (stage === "building") {
    return (
      <LinearGradient
        colors={onboardingGradients.celebration}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{ flex: 1 }}
      >
        <StatusBar style="light" />
        <SafeAreaView
          style={{
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
            padding: theme.layout.pagePadding,
          }}
        >
          <OnboardingText color={theme.colors.gold} family="wordmark" size={28}>
            Mangalya
          </OnboardingText>
          <OnboardingText
            color={theme.colors.ivory}
            family="emotional"
            size={42}
            style={{ marginTop: 24, textAlign: "center" }}
          >
            {submitError ? "We couldn’t finish your planner" : "Building your planner…"}
          </OnboardingText>
          <BuildingVisual reduceMotion={reduceMotion || Boolean(submitError)} />
          {submitError ? (
            <View style={{ gap: 12, maxWidth: 440, width: "100%" }}>
              <OnboardingText
                accessibilityRole="alert"
                color={theme.colors.ivory}
                style={{ textAlign: "center" }}
              >
                {submitError}
              </OnboardingText>
              <OnboardingButton
                label="Try again"
                onPress={() => void buildWorkspace()}
                variant="light"
              />
              <MotionPressable
                accessibilityLabel="Back to review"
                accessibilityRole="button"
                onPress={() => {
                  setSubmitError(undefined);
                  setStage("review");
                }}
                style={{ alignItems: "center", minHeight: 48, justifyContent: "center" }}
              >
                <OnboardingText color={theme.colors.ivory} family="semibold">
                  Back to review
                </OnboardingText>
              </MotionPressable>
            </View>
          ) : (
            <View style={{ gap: 12, maxWidth: 440, width: "100%" }}>
              <View
                accessibilityLabel="Building planner"
                accessibilityRole="progressbar"
                style={{
                  backgroundColor: "rgba(255,248,242,0.24)",
                  borderRadius: 99,
                  height: 8,
                  overflow: "hidden",
                }}
              >
                <BuildProgress reduceMotion={reduceMotion} />
              </View>
              <OnboardingText
                color={theme.colors.ivory}
                family="semibold"
                style={{ textAlign: "center" }}
              >
                {buildingMessages[buildingMessageIndex]}
              </OnboardingText>
              <OnboardingText
                color="rgba(255,248,242,0.76)"
                size={13}
                style={{ textAlign: "center" }}
              >
                This will only take a moment.
              </OnboardingText>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (stage === "names") {
    return (
      <OnboardingStep
        footer={<OnboardingButton label="Next" onPress={continueNames} />}
        onBack={previousStage}
        progress={1}
        title="About you"
      >
        <StepHeading description="Add the names you want to see across your planner.">
          Who’s getting married?
        </StepHeading>
        <NamesVisual partnerName={partnerName} reduceMotion={reduceMotion} yourName={yourName} />
        <OnboardingCard>
          <FormTextField
            error={nameErrors.yours}
            label="Your name"
            onChangeText={(value) => {
              setYourName(value);
              if (value.trim()) setNameErrors((errors) => ({ ...errors, yours: undefined }));
            }}
            placeholder="e.g. Aanya"
            value={yourName}
          />
          <FormTextField
            error={nameErrors.partner}
            label="Partner’s name"
            onChangeText={(value) => {
              setPartnerName(value);
              if (value.trim()) setNameErrors((errors) => ({ ...errors, partner: undefined }));
            }}
            placeholder="e.g. Rohan"
            value={partnerName}
          />
        </OnboardingCard>
      </OnboardingStep>
    );
  }

  if (stage === "milestones") {
    return (
      <OnboardingStep
        footer={<OnboardingButton label="Next" onPress={continueMilestones} />}
        onBack={previousStage}
        progress={2}
        title="Your wedding"
      >
        <StepHeading description="You can change these anytime.">
          Set the big milestones
        </StepHeading>
        <DateBudgetVisual
          budget={budgetTarget}
          date={date ? formatDateOnly(date, { month: "short" }) : ""}
          reduceMotion={reduceMotion}
        />
        <OnboardingCard>
          <View style={{ gap: 6 }}>
            <View style={{ alignItems: "baseline", flexDirection: "row", gap: 8 }}>
              <OnboardingText family="semibold" size={14}>
                Wedding date
              </OnboardingText>
              <OnboardingText accessibilityLabel="required" color={theme.colors.danger} size={12}>
                Required
              </OnboardingText>
            </View>
            <MotionPressable
              accessibilityLabel={`Wedding date: ${date ? formatDateOnly(date) : "Select date"}`}
              accessibilityRole="button"
              onPress={() => setDatePickerOpen(true)}
              style={{
                alignItems: "center",
                backgroundColor: theme.colors.elevatedIvory,
                borderColor: dateError ? theme.colors.danger : theme.colors.border,
                borderRadius: theme.radius.control,
                borderWidth: 1,
                flexDirection: "row",
                minHeight: theme.layout.controlHeight,
                paddingHorizontal: 16,
              }}
            >
              <CalendarDays color={theme.colors.plum} size={21} />
              <OnboardingText
                color={date ? theme.colors.text : theme.colors.mutedText}
                style={{ flex: 1, paddingHorizontal: 12 }}
              >
                {date ? formatDateOnly(date, { month: "long" }) : "Select date"}
              </OnboardingText>
              <ChevronDown color={theme.colors.mutedText} size={18} />
            </MotionPressable>
            {dateError ? (
              <OnboardingText accessibilityRole="alert" color={theme.colors.danger} size={13}>
                {dateError}
              </OnboardingText>
            ) : null}
          </View>
          <FormTextField
            error={budgetError}
            label="Target budget"
            onChangeText={(value) => {
              setBudgetTarget(formatBudgetInput(value));
              setBudgetError(undefined);
            }}
            optional
            placeholder="12,00,000"
            prefix="₹"
            value={budgetTarget}
          />
          {datePickerOpen ? (
            <DateTimePicker
              display="default"
              mode="date"
              onDismiss={() => setDatePickerOpen(false)}
              onValueChange={(_, selectedDate) => {
                setDatePickerOpen(false);
                setDate(toDateOnly(selectedDate));
                setDateError(undefined);
              }}
              testID="date-picker"
              value={dateFromValue(date)}
            />
          ) : null}
        </OnboardingCard>
      </OnboardingStep>
    );
  }

  if (stage === "cover") {
    return (
      <OnboardingStep
        footer={<OnboardingButton label="Next" onPress={() => setStage("events")} />}
        onBack={previousStage}
        progress={3}
        title="Make it yours"
      >
        <StepHeading description="Optional — add a favourite photo to make your planner feel like yours.">
          Choose a cover photo
        </StepHeading>
        <MotionPressable
          accessibilityLabel={coverPhotoUri ? "Change wedding photo" : "Choose wedding photo"}
          accessibilityRole="button"
          disabled={isPickingPhoto}
          onPress={() => void pickCoverPhoto()}
          style={{ borderRadius: theme.radius.card, overflow: "hidden" }}
        >
          <CoverVisual photoUri={coverPhotoUri} reduceMotion={reduceMotion} />
          {!coverPhotoUri ? (
            <View
              style={{
                alignItems: "center",
                backgroundColor: "rgba(255,253,252,0.9)",
                borderColor: theme.colors.gold,
                borderRadius: 14,
                borderWidth: 1,
                gap: 5,
                left: "32%",
                paddingHorizontal: 10,
                paddingVertical: 10,
                position: "absolute",
                top: "35%",
                width: "36%",
              }}
            >
              <ImagePlus color={theme.colors.plum} size={24} />
              <OnboardingText family="semibold" size={13} style={{ textAlign: "center" }}>
                {isPickingPhoto ? "Opening photos…" : "Add your photo"}
              </OnboardingText>
            </View>
          ) : null}
        </MotionPressable>
        <View
          style={{
            alignItems: "center",
            backgroundColor: "rgba(233,223,240,0.62)",
            borderRadius: theme.radius.control,
            flexDirection: "row",
            gap: 10,
            minHeight: 56,
            paddingHorizontal: 14,
          }}
        >
          <LockKeyhole color={theme.colors.gold} size={18} />
          <OnboardingText color={theme.colors.mutedText} size={13} style={{ flex: 1 }}>
            {coverPhotoUri
              ? "Photo added to your private workspace"
              : "Optional · JPG, PNG, WebP or HEIC · up to 15 MB"}
          </OnboardingText>
          {coverPhotoUri ? (
            <MotionPressable
              accessibilityLabel="Remove wedding photo"
              accessibilityRole="button"
              onPress={removeCoverPhoto}
              style={{ alignItems: "center", height: 48, justifyContent: "center", width: 48 }}
            >
              <Trash2 color={theme.colors.danger} size={20} />
            </MotionPressable>
          ) : null}
        </View>
        {coverPhotoError ? (
          <OnboardingText accessibilityRole="alert" color={theme.colors.danger} size={13}>
            {coverPhotoError}
          </OnboardingText>
        ) : null}
      </OnboardingStep>
    );
  }

  if (stage === "events") {
    return (
      <OnboardingStep
        footer={<OnboardingButton label="Review my planner" onPress={() => setStage("review")} />}
        onBack={previousStage}
        progress={4}
        title="Events"
      >
        <StepHeading description="Choose any that fit. Rename, remove or add events later.">
          What are you planning?
        </StepHeading>
        <EventsVisual
          reduceMotion={reduceMotion}
          selectedEvents={suggestedEventDefinitions
            .filter((event) => starterEventSelection.includes(event.key))
            .map((event) => event.name)}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {suggestedEventDefinitions.map((event) => {
            const selected = starterEventSelection.includes(event.key);
            return (
              <MotionPressable
                key={event.key}
                accessibilityLabel={event.name}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() => toggleEvent(event.key)}
                style={{
                  alignItems: "center",
                  backgroundColor: selected
                    ? theme.colors.softLavender
                    : theme.colors.elevatedIvory,
                  borderColor: selected ? theme.colors.plum : theme.colors.border,
                  borderRadius: theme.radius.control,
                  borderWidth: selected ? 2 : 1,
                  flexBasis: "46%",
                  flexDirection: "row",
                  flexGrow: 1,
                  gap: 10,
                  minHeight: 64,
                  padding: 14,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    backgroundColor: selected ? theme.colors.plum : theme.colors.ivory,
                    borderColor: selected ? theme.colors.plum : theme.colors.border,
                    borderRadius: 11,
                    borderWidth: 1,
                    height: 28,
                    justifyContent: "center",
                    width: 28,
                  }}
                >
                  {selected ? <Check color={theme.colors.white} size={17} /> : null}
                </View>
                <OnboardingText family="semibold" size={14} style={{ flex: 1 }}>
                  {event.name}
                </OnboardingText>
              </MotionPressable>
            );
          })}
        </View>
        <OnboardingText color={theme.colors.mutedText} size={13}>
          {starterEventSelection.length
            ? `${starterEventSelection.length} selected`
            : "No starter events selected"}
        </OnboardingText>
      </OnboardingStep>
    );
  }

  const reviewRows = [
    {
      icon: Pencil,
      label: "Names",
      value: `${yourName.trim()} & ${partnerName.trim()}`,
      stage: "names" as const,
    },
    {
      icon: CalendarDays,
      label: "Wedding date",
      value: formatDateOnly(date, { month: "long" }),
      stage: "milestones" as const,
    },
    {
      icon: IndianRupee,
      label: "Target budget",
      value: budgetTarget ? `₹${budgetTarget}` : "No budget target",
      stage: "milestones" as const,
    },
    {
      icon: Camera,
      label: "Cover photo",
      value: coverPhotoUri ? "Photo added" : "No cover photo",
      stage: "cover" as const,
    },
    {
      icon: Check,
      label: "Starter events",
      value: `${starterEventSelection.length} selected`,
      stage: "events" as const,
    },
  ];

  return (
    <LinearGradient
      colors={onboardingGradients.celebration}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.ScrollView
          contentContainerStyle={{
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 108,
          }}
          contentInsetAdjustmentBehavior="automatic"
          entering={FadeIn.duration(theme.motion.entrance).reduceMotion(ReduceMotion.System)}
        >
          <View style={{ gap: 12, maxWidth: theme.layout.maxWidth, width: "100%" }}>
            <View style={{ alignItems: "center", flexDirection: "row", minHeight: 48 }}>
              <MotionPressable
                accessibilityLabel="Back to events"
                accessibilityRole="button"
                onPress={previousStage}
                pressedScale={0.94}
                style={{ alignItems: "center", height: 48, justifyContent: "center", width: 48 }}
              >
                <ArrowLeft color={theme.colors.ivory} size={22} />
              </MotionPressable>
              <OnboardingText
                color={theme.colors.gold}
                family="wordmark"
                size={25}
                style={{ flex: 1, textAlign: "center" }}
              >
                Mangalya
              </OnboardingText>
              <View style={{ width: 48 }} />
            </View>
            <ReviewVisual
              budget={budgetTarget ? `₹${budgetTarget}` : "No target"}
              coverPhotoUri={coverPhotoUri}
              date={formatDateOnly(date, { month: "short" })}
              eventCount={`${starterEventSelection.length} selected`}
              names={`${yourName.trim()} & ${partnerName.trim()}`}
              reduceMotion={reduceMotion}
            />
            <OnboardingText
              color={theme.colors.ivory}
              family="emotional"
              size={30}
              style={{ letterSpacing: -0.3, textAlign: "center" }}
            >
              Everything looks lovely
            </OnboardingText>
            <View
              style={{
                backgroundColor: "rgba(40,16,47,0.56)",
                borderColor: "rgba(217,170,88,0.32)",
                borderRadius: theme.radius.card,
                borderWidth: 1,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                padding: 10,
              }}
              testID="review-summary-grid"
            >
              {reviewRows.map(({ icon: Icon, label, stage: editStage, value }) => (
                <ReviewSummaryTile
                  fullWidth={label === "Names"}
                  icon={Icon}
                  key={label}
                  onPress={() => setStage(editStage)}
                  label={label}
                  value={value}
                />
              ))}
            </View>
          </View>
        </Animated.ScrollView>
        <View
          style={{
            alignItems: "center",
            backgroundColor: "rgba(40,16,47,0.97)",
            borderTopColor: "rgba(217,170,88,0.38)",
            borderTopWidth: 1,
            bottom: 0,
            left: 0,
            paddingHorizontal: 20,
            paddingVertical: 12,
            position: "absolute",
            right: 0,
          }}
          testID="review-build-footer"
        >
          <View style={{ maxWidth: theme.layout.maxWidth, width: "100%" }}>
            <OnboardingButton
              label="Build my planner"
              loading={mutation.isPending}
              onPress={() => void buildWorkspace()}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function BuildProgress({ reduceMotion }: { reduceMotion: boolean }) {
  const progress = useSharedValue(reduceMotion ? 1 : 0.08);
  useEffect(() => {
    progress.set(
      withTiming(1, { duration: reduceMotion ? 0 : theme.motion.build, easing: Easing.linear }),
    );
  }, [progress, reduceMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.gold,
          height: "100%",
          transformOrigin: "left",
          width: "100%",
        },
        style,
      ]}
    />
  );
}
