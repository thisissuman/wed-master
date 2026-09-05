import type { ConfigContext, ExpoConfig } from "expo/config";

import palettes from "./src/theme/palettes.json";

type AppVariant = "development" | "preview" | "production";

const defaultTheme = palettes.royalPlum;

function resolveVariant(requestedVariant = process.env.APP_VARIANT): AppVariant {
  return requestedVariant === "preview" || requestedVariant === "production"
    ? requestedVariant
    : "development";
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = resolveVariant();
  const variantSuffix = variant === "production" ? "" : `.${variant}`;
  const displayName =
    variant === "production"
      ? "Mangalya"
      : variant === "preview"
        ? "Mangalya Preview"
        : "Mangalya Dev";
  const scheme = variant === "production" ? "mangalya" : `mangalya-${variant}`;
  const sentryConfigured = Boolean(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);
  const sentryPlugins: NonNullable<ExpoConfig["plugins"]> = sentryConfigured
    ? [
        [
          "@sentry/react-native",
          {
            organization: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            url: process.env.SENTRY_URL ?? "https://sentry.io/",
          },
        ],
      ]
    : [];

  return {
    ...config,
    name: displayName,
    slug: "mangalya",
    version: "0.1.0",
    orientation: "default",
    icon: "./assets/images/icon.png",
    scheme,
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: `com.suman.mangalya${variantSuffix}`,
      buildNumber: "1",
    },
    android: {
      allowBackup: false,
      blockedPermissions: [
        "android.permission.ACCESS_MEDIA_LOCATION",
        "android.permission.MANAGE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_AUDIO",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
        "android.permission.RECORD_AUDIO",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
      package: `com.suman.mangalya${variantSuffix}`,
      permissions: ["android.permission.CAMERA"],
      softwareKeyboardLayoutMode: "resize",
      versionCode: 5,
      adaptiveIcon: {
        backgroundColor: defaultTheme.colors.canvas,
        backgroundImage: "./assets/images/android-icon-background.png",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: true,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: defaultTheme.colors.canvas,
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
        },
      ],
      "expo-image",
      "expo-sharing",
      [
        "expo-image-picker",
        {
          cameraPermission:
            "Allow Mangalya to take photos for your private wedding inspiration board.",
          microphonePermission: false,
          photosPermission:
            "Allow Mangalya to choose wedding photos and inspiration images from your library.",
        },
      ],
      ["expo-secure-store", { configureAndroidBackup: false }],
      "@react-native-community/datetimepicker",
      "expo-font",
      "expo-asset",
      ["expo-navigation-bar", { enforceContrast: false, style: "light" }],
      ...sentryPlugins,
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appVariant: variant,
      eas: {
        projectId: "12d6b3ba-0536-4697-b62f-9c51288d2aef",
      },
    },
  };
};
