import { appThemes, defaultAppThemeId, isAppThemeId, tokens, type AppThemeId } from "@/theme";

export const weddingCardArtworkAspectRatio = 1600 / 983;

export type WeddingCardTheme = {
  artwork: number;
  avatarSurface: string;
  cameraBorder: string;
  cameraIcon: string;
  cameraSurface: string;
  countdown: string;
  description: string;
  heroGradient: readonly [string, string, string];
  id: AppThemeId;
  keepsakeAccent: string;
  keepsakeGradient: readonly [string, string, string];
  keepsakeIconSurface: string;
  keepsakeText: string;
  label: string;
  mutedText: string;
  nameText: string;
  progressGradient: readonly [string, string];
  progressShadow: string;
  progressText: string;
  ripple: string;
  textShadow: string;
};

export const defaultWeddingCardThemeId = defaultAppThemeId;

const royalPlum = appThemes.royalPlum;
const lavenderPearl = appThemes.lavenderPearl;

export const weddingCardThemes: Record<AppThemeId, WeddingCardTheme> = {
  royalPlum: {
    artwork: require("../../../../assets/images/mangalya/home/wedding-hero-shell.webp"),
    avatarSurface: royalPlum.colors.nightElevated,
    cameraBorder: royalPlum.colors.nightAccent,
    cameraIcon: royalPlum.colors.nightAccent,
    cameraSurface: royalPlum.colors.nightSurface,
    countdown: royalPlum.colors.nightAccent,
    description: "Deep plum velvet with antique gold",
    heroGradient: [
      royalPlum.gradients.weddingNight[0],
      royalPlum.gradients.weddingNight[1],
      royalPlum.gradients.weddingNight[2],
    ],
    id: "royalPlum",
    keepsakeAccent: royalPlum.colors.nightAccent,
    keepsakeGradient: [
      royalPlum.gradients.weddingNight[2],
      royalPlum.gradients.weddingNight[1],
      royalPlum.gradients.weddingNight[0],
    ],
    keepsakeIconSurface: royalPlum.colors.nightSoft,
    keepsakeText: royalPlum.colors.onNight,
    label: "Royal Plum",
    mutedText: royalPlum.colors.onNightMuted,
    nameText: royalPlum.colors.onNight,
    progressGradient: [royalPlum.gradients.homeProgress[0], royalPlum.gradients.homeProgress[1]],
    progressShadow: "0px 2px 4px rgba(20, 4, 24, 0.34)",
    progressText: royalPlum.colors.nightAccent,
    ripple: royalPlum.colors.nightSoft,
    textShadow: royalPlum.colors.overlay,
  },
  lavenderPearl: {
    artwork: require("../../../../assets/images/mangalya/home/wedding-hero-shell-lavender-pearl.webp"),
    avatarSurface: tokens.brand.softLavender,
    cameraBorder: tokens.brand.restrainedGold,
    cameraIcon: tokens.brand.restrainedGold,
    cameraSurface: tokens.brand.plum,
    countdown: tokens.brand.plum,
    description: "Pearl ivory with luminous lavender",
    heroGradient: [
      tokens.brand.elevatedIvory,
      lavenderPearl.colors.surface,
      tokens.brand.softLavender,
    ],
    id: "lavenderPearl",
    keepsakeAccent: lavenderPearl.colors.accent,
    keepsakeGradient: [
      tokens.brand.elevatedIvory,
      lavenderPearl.colors.surface,
      tokens.brand.softLavender,
    ],
    keepsakeIconSurface: tokens.brand.softLavender,
    keepsakeText: lavenderPearl.colors.textPrimary,
    label: "Lavender Pearl",
    mutedText: lavenderPearl.colors.textSecondary,
    nameText: tokens.brand.plum,
    progressGradient: [tokens.brand.lavender, tokens.brand.restrainedGold],
    progressShadow: "0px 2px 4px rgba(75, 23, 77, 0.28)",
    progressText: lavenderPearl.colors.accent,
    ripple: lavenderPearl.colors.primarySoft,
    textShadow: lavenderPearl.colors.wordmarkShadow,
  },
};

export const weddingCardThemeOptions = [
  weddingCardThemes.royalPlum,
  weddingCardThemes.lavenderPearl,
] as const;

export const getWeddingCardTheme = (themeId?: string | null) =>
  weddingCardThemes[themeId && isAppThemeId(themeId) ? themeId : defaultWeddingCardThemeId];
