import { getAppTheme, tokens, useAppThemeStore } from "@/theme";

const activeTheme = () => getAppTheme(useAppThemeStore.getState().themeId);

const onboardingColors = () => {
  const theme = activeTheme();
  const light = theme.id === "lavenderPearl";

  return {
    accent: theme.colors.accent,
    artworkInk: "#3B173F",
    artworkMutedInk: "#735C75",
    border: theme.colors.borderStrong,
    bridalRed: theme.colors.primary,
    canvas: theme.colors.canvas,
    danger: theme.colors.danger,
    darkBridalRed: theme.gradients.primaryAction[1],
    deepPlum: theme.colors.nightSurface,
    elevatedIvory: theme.colors.elevatedSurface,
    elevatedSurface: theme.colors.elevatedSurface,
    gold: theme.colors.nightAccent,
    ivory: theme.colors.canvas,
    lavender: light ? tokens.brand.lavender : theme.colors.secondary,
    mutedText: theme.colors.textSecondary,
    nightSoft: theme.colors.nightSoft,
    nightSurface: theme.colors.nightSurface,
    onNight: theme.colors.onNight,
    onNightMuted: theme.colors.onNightMuted,
    onPrimary: theme.colors.onPrimary,
    overlay: theme.colors.overlay,
    plum: light ? tokens.brand.plum : theme.colors.primary,
    primary: theme.colors.primary,
    primarySoft: theme.colors.primarySoft,
    softLavender: theme.colors.primarySoft,
    surface: theme.colors.surface,
    surfaceMuted: theme.colors.surfaceMuted,
    text: theme.colors.textPrimary,
    translucentBorder: theme.colors.translucentBorder,
    translucentSurface: theme.colors.translucentSurface,
    white: theme.colors.onPrimary,
  } as const;
};

export const onboardingTheme = {
  get colors() {
    return onboardingColors();
  },
  fonts: {
    wordmark: "EBGaramond_600SemiBold",
    signature: "EBGaramond_500Medium_Italic",
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
  get celebration() {
    return activeTheme().gradients.celebration;
  },
  get action() {
    return activeTheme().gradients.primaryAction;
  },
  get light() {
    return activeTheme().gradients.formCanvas;
  },
} as const;
