import type { ExpoConfig } from "expo/config";

type SentryReleaseContext = {
  dist?: string;
  environment: "development" | "preview" | "production";
  release?: string;
};

function environmentFrom(config: ExpoConfig | null | undefined) {
  const candidate = config?.extra?.appVariant;
  return candidate === "preview" || candidate === "production" ? candidate : "development";
}

export function sentryReleaseContext(
  config: ExpoConfig | null | undefined,
  platform: string,
): SentryReleaseContext {
  const environment = environmentFrom(config);
  const packageName =
    platform === "android"
      ? config?.android?.package
      : platform === "ios"
        ? config?.ios?.bundleIdentifier
        : undefined;
  const buildNumber =
    platform === "android"
      ? config?.android?.versionCode
      : platform === "ios"
        ? config?.ios?.buildNumber
        : undefined;
  const dist = buildNumber === undefined ? undefined : String(buildNumber);
  const release =
    packageName && config?.version && dist ? `${packageName}@${config.version}+${dist}` : undefined;

  return { dist, environment, release };
}
