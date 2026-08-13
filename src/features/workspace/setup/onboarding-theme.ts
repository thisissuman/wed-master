export const onboardingTheme = {
  colors: {
    lavender: "#A783C4",
    softLavender: "#E9DFF0",
    plum: "#4B174D",
    deepPlum: "#28102F",
    bridalRed: "#C5163A",
    darkBridalRed: "#9E1230",
    ivory: "#FFF8F2",
    elevatedIvory: "#FFFDFC",
    gold: "#D9AA58",
    text: "#2B1835",
    mutedText: "#665B6D",
    border: "#D8C9DA",
    danger: "#A13D32",
    white: "#FFFFFF",
  },
  fonts: {
    emotional: "EBGaramond_600SemiBold",
    keepsake: "EBGaramond_700Bold_Italic",
    wordmark: "EBGaramond_600SemiBold",
    body: "Manrope_400Regular",
    medium: "Manrope_500Medium",
    semibold: "Manrope_600SemiBold",
    bold: "Manrope_700Bold",
  },
  layout: {
    maxWidth: 560,
    pagePadding: 24,
    controlHeight: 56,
    touchTarget: 48,
  },
  radius: {
    control: 14,
    card: 20,
    pill: 999,
  },
  motion: {
    entrance: 240,
    exit: 160,
    press: 90,
    release: 140,
    carousel: 4_800,
    build: 4_500,
  },
} as const;

export const onboardingGradients = {
  celebration: [
    onboardingTheme.colors.lavender,
    onboardingTheme.colors.plum,
    onboardingTheme.colors.bridalRed,
  ] as const,
  action: [onboardingTheme.colors.bridalRed, onboardingTheme.colors.darkBridalRed] as const,
  light: [
    onboardingTheme.colors.ivory,
    onboardingTheme.colors.elevatedIvory,
    onboardingTheme.colors.softLavender,
  ] as const,
} as const;
