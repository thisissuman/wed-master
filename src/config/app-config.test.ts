import type { ConfigContext, ExpoConfig } from "expo/config";

import buildExpoConfig from "../../app.config";

const originalVariant = process.env.APP_VARIANT;
const originalSentryOrg = process.env.SENTRY_ORG;
const originalSentryProject = process.env.SENTRY_PROJECT;
const originalSentryUrl = process.env.SENTRY_URL;

function configFor(variant?: string) {
  if (variant) process.env.APP_VARIANT = variant;
  else delete process.env.APP_VARIANT;

  return buildExpoConfig({ config: {} as ExpoConfig } as ConfigContext);
}

function imagePickerOptions(config: ExpoConfig) {
  const plugin = config.plugins?.find(
    (candidate) => Array.isArray(candidate) && candidate[0] === "expo-image-picker",
  );
  return Array.isArray(plugin) ? plugin[1] : undefined;
}

function navigationBarOptions(config: ExpoConfig) {
  const plugin = config.plugins?.find(
    (candidate) => Array.isArray(candidate) && candidate[0] === "expo-navigation-bar",
  );
  return Array.isArray(plugin) ? plugin[1] : undefined;
}

function devClientOptions(config: ExpoConfig) {
  const plugin = config.plugins?.find(
    (candidate) => Array.isArray(candidate) && candidate[0] === "expo-dev-client",
  );
  return Array.isArray(plugin) ? plugin[1] : undefined;
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe("Expo application variants", () => {
  afterAll(() => {
    restoreEnvironment("APP_VARIANT", originalVariant);
    restoreEnvironment("SENTRY_ORG", originalSentryOrg);
    restoreEnvironment("SENTRY_PROJECT", originalSentryProject);
    restoreEnvironment("SENTRY_URL", originalSentryUrl);
  });

  it.each([
    [undefined, "Mangalya Dev", "com.suman.mangalya.development", "mangalya-development"],
    ["development", "Mangalya Dev", "com.suman.mangalya.development", "mangalya-development"],
    ["preview", "Mangalya Preview", "com.suman.mangalya.preview", "mangalya-preview"],
    ["production", "Mangalya", "com.suman.mangalya", "mangalya"],
  ])("resolves %s configuration", (variant, name, packageName, scheme) => {
    const config = configFor(variant);

    expect(config.name).toBe(name);
    expect(config.android?.package).toBe(packageName);
    expect(config.ios?.bundleIdentifier).toBe(packageName);
    expect(config.scheme).toBe(scheme);
    expect(config.android?.allowBackup).toBe(false);
    expect(config.android?.permissions).toEqual(["android.permission.CAMERA"]);
    expect(config.android?.blockedPermissions).toEqual([
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
      "android.permission.WRITE_CONTACTS",
    ]);
    expect(config.android?.predictiveBackGestureEnabled).toBe(true);
    expect(config.android?.softwareKeyboardLayoutMode).toBe("resize");
    expect(config.android?.versionCode).toBe(7);
    expect(config.userInterfaceStyle).toBe("automatic");
    expect(config.android?.adaptiveIcon?.backgroundColor).toBe("#1D0B23");
    expect(config.plugins).toContainEqual([
      "expo-splash-screen",
      expect.objectContaining({ backgroundColor: "#1D0B23" }),
    ]);
    expect(config.plugins).toContain("expo-asset");
    expect(devClientOptions(config)).toEqual({
      addGeneratedScheme: variant === undefined || variant === "development",
    });
    expect(config.plugins).toContainEqual(["expo-secure-store", { configureAndroidBackup: false }]);
    expect(navigationBarOptions(config)).toEqual({ enforceContrast: false, style: "light" });
    expect(imagePickerOptions(config)).toMatchObject({
      cameraPermission: "Allow Mangalya to take photos for your private wedding inspiration board.",
      microphonePermission: false,
      photosPermission:
        "Allow Mangalya to choose wedding photos and inspiration images from your library.",
    });
  });

  it("configures source-map upload only when the private Sentry project is supplied", () => {
    delete process.env.SENTRY_ORG;
    delete process.env.SENTRY_PROJECT;
    expect(
      configFor("production").plugins?.some(
        (candidate) => Array.isArray(candidate) && candidate[0] === "@sentry/react-native",
      ),
    ).toBe(false);

    process.env.SENTRY_ORG = "example-organization";
    process.env.SENTRY_PROJECT = "mangalya";
    process.env.SENTRY_URL = "https://sentry.example.invalid/";

    expect(configFor("production").plugins).toContainEqual([
      "@sentry/react-native",
      {
        organization: "example-organization",
        project: "mangalya",
        url: "https://sentry.example.invalid/",
      },
    ]);
  });
});
