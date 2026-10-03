import type { ExpoConfig } from "expo/config";

import { sentryReleaseContext } from "./sentry-release";

const config = {
  name: "Mangalya Preview",
  slug: "mangalya",
  version: "0.1.0",
  android: { package: "com.suman.mangalya.preview", versionCode: 6 },
  ios: { bundleIdentifier: "com.suman.mangalya.preview", buildNumber: "3" },
  extra: { appVariant: "preview" },
} as ExpoConfig;

describe("Sentry release context", () => {
  it("identifies the Android variant, package, version, and build", () => {
    expect(sentryReleaseContext(config, "android")).toEqual({
      dist: "6",
      environment: "preview",
      release: "com.suman.mangalya.preview@0.1.0+6",
    });
  });

  it("uses the iOS build number for iOS releases", () => {
    expect(sentryReleaseContext(config, "ios")).toEqual({
      dist: "3",
      environment: "preview",
      release: "com.suman.mangalya.preview@0.1.0+3",
    });
  });

  it("falls back safely when runtime configuration is incomplete", () => {
    expect(sentryReleaseContext(undefined, "android")).toEqual({
      dist: undefined,
      environment: "development",
      release: undefined,
    });
  });
});
