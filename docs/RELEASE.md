# Release guide

## Configuration

- `app.config.ts` owns Mangalya development, preview, and production names, schemes, package/bundle IDs, icon/splash assets, orientation, version, and build numbers.
- `eas.json` supplies matching profiles. Do not commit signing credentials.
- Production is `com.suman.mangalya`, scheme `mangalya`, version `0.1.0`, Android version code `3`, and iOS build number `1`. Increment both build counters for each store upload; change the marketing version deliberately.
- Android `allowBackup` is `false`. Generated manifests must retain `android:allowBackup="false"` and removal directives for camera and microphone permissions. Android 12+ OEM device-to-device transfer behavior is documented as platform-dependent rather than promised away in product copy.
- Sentry initializes and wraps the root only when `EXPO_PUBLIC_SENTRY_DSN` is present. Default PII is disabled and the event processor removes user/request/context/breadcrumb/extra data plus phone, money, and file-path patterns.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are private build-time source-map upload values. Never expose them with `EXPO_PUBLIC_`.

## Automated release gate

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
npm run format:check
npx expo install --check
APP_VARIANT=production npx expo export --platform android --output-dir /tmp/mangalya-export
maestro test .maestro
```

Run `npx expo-doctor` when obtainable. Inspect export size, Hermes bundle size, bundled font count, and static asset inventory against the preceding release.

## Native regeneration and identity gate

- After any config-plugin, permission, native dependency, identifier, scheme, icon, or splash change, run `APP_VARIANT=development npx expo prebuild --clean --platform android` followed by `APP_VARIANT=development npx expo run:android`.
- Confirm the installed package is `com.suman.mangalya.development` and scheme is `mangalya-development`; an older `com.suman.wedmaster` shell is not release evidence even when Metro serves current JavaScript into it.
- Keep obsolete packages installed until their local data is deliberately backed up or the owner explicitly approves deletion.
- On 2026-08-01 the clean development rebuild passed and both
  `com.suman.mangalya.development` and `com.suman.wedmaster` remained installed. The packaged
  development manifest had `allowBackup=false`, predictive Back, the current scheme, and no camera
  or microphone permission. Repeat this identity gate after every relevant native change; do not
  treat this debug APK as the pending signed-preview gate.

## Device/EAS gate

- Verify fresh setup and upgrade/migration without data loss.
- Exercise all create/edit/detail/delete/undo flows, backup/restore/recovery, attachment permissions, and share sheets.
- Test 360dp, landscape, largest text, TalkBack, reduced motion, keyboard, hardware/predictive back, background/termination, and rapid duplicate taps on a physical Android device.
- Build the preview APK, verify `com.suman.mangalya.preview`/`mangalya-preview`, release signing, manifest backup/permission values, launcher/splash rendering, and deep links. Review scrubbed Sentry events/source maps and preserve a rollback artifact.

Never release with test credentials, development logging, unresolved data-loss defects, or unverified signing. Do not enable analytics, public sharing, AI, payments, or remote collaboration without their own privacy and authorization review.
