import type { ConfigContext, ExpoConfig } from "expo/config";

import buildExpoConfig from "../../app.config";

const originalVariant = process.env.APP_VARIANT;

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

describe("Expo application variants", () => {
  afterAll(() => {
    if (originalVariant) process.env.APP_VARIANT = originalVariant;
    else delete process.env.APP_VARIANT;
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
    expect(config.android?.predictiveBackGestureEnabled).toBe(true);
    expect(config.android?.softwareKeyboardLayoutMode).toBe("resize");
    expect(config.android?.versionCode).toBe(3);
    expect(imagePickerOptions(config)).toMatchObject({
      cameraPermission: false,
      microphonePermission: false,
    });
  });
});
