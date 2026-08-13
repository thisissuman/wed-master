import type { ConfigContext, ExpoConfig } from "expo/config";

type AppVariant = "development" | "preview" | "production";

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
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: `com.suman.mangalya${variantSuffix}`,
      buildNumber: "1",
    },
    android: {
      allowBackup: false,
      blockedPermissions: ["android.permission.SYSTEM_ALERT_WINDOW"],
      package: `com.suman.mangalya${variantSuffix}`,
      softwareKeyboardLayoutMode: "resize",
      versionCode: 4,
      adaptiveIcon: {
        backgroundColor: "#FBF7F4",
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
          backgroundColor: "#FBF7F4",
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
        },
      ],
      "expo-image",
      [
        "expo-image-picker",
        {
          cameraPermission: false,
          microphonePermission: false,
          photosPermission: "Allow Mangalya to choose a wedding cover photo.",
        },
      ],
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      "expo-font",
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
