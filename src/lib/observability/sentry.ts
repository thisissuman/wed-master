import * as Sentry from "@sentry/react-native";

import { sanitizeSentryEvent } from "./sentry-scrubbing";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const sentryEnabled = Boolean(dsn);

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 0 : 0.05,
    beforeBreadcrumb: () => null,
    beforeSend: (event) => sanitizeSentryEvent(event),
    beforeSendTransaction: (event) => sanitizeSentryEvent(event),
  });
}

export { Sentry, sentryEnabled };
