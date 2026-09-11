import type * as SentryModule from "@sentry/react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { sentryReleaseContext } from "./sentry-release";
import { sanitizeSentryEvent } from "./sentry-scrubbing";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const sentryEnabled = Boolean(dsn);
type SentryApi = Pick<typeof SentryModule, "init" | "wrap">;

const Sentry: SentryApi = dsn
  ? // Keep the Sentry module dormant when no DSN is configured; its import starts an internal
    // cleanup interval even though reporting is disabled.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("@sentry/react-native") as SentryApi)
  : {
      init: (..._arguments: Parameters<SentryApi["init"]>) => undefined,
      wrap: ((component: unknown) => component) as SentryApi["wrap"],
    };

if (dsn) {
  Sentry.init({
    dsn,
    ...sentryReleaseContext(Constants.expoConfig, Platform.OS),
    enableAutoSessionTracking: false,
    maxBreadcrumbs: 0,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeBreadcrumb: () => null,
    beforeSend: (event) => sanitizeSentryEvent(event),
    beforeSendTransaction: () => null,
  });
}

export { Sentry, sentryEnabled };
