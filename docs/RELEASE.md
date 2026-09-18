# Development and release guide

Run commands from `/Users/kira/wed-master`. Inspect `git status --short --branch` first, preserve
unrelated work, and never push directly to `main`.

## App configuration

- `app.config.ts` owns names, schemes, package/bundle IDs, icons, splash, orientation, marketing
  version, and platform build numbers. `eas.json` owns matching build profiles.
- Version `0.1.0` currently uses Android version code `7` and iOS build number `1`.
- Development is `Mangalya Dev` / `com.suman.mangalya.development` /
  `mangalya-development`; Preview is `Mangalya Preview` / `com.suman.mangalya.preview` /
  `mangalya-preview`; production is `Mangalya` / `com.suman.mangalya` / `mangalya`.
- Expo Dev Client may add its generated `exp+mangalya` launcher scheme only to development.
  Preview and production must expose only their variant-specific scheme.
- Increment the affected platform counter for every store upload and change the marketing version
  deliberately. Use semantic prerelease tags such as `v0.1.0-beta.1` when tagging releases.
- Keep signing credentials in EAS or the release environment. Never commit them.
- Android must retain `allowBackup=false`, intentional Camera access for Inspire and read-only Contacts access on picker request, and removal rules
  for microphone, overlay, legacy-storage, and broad-media permissions.
- Sentry wraps the root only when `EXPO_PUBLIC_SENTRY_DSN` is present. Keep default PII disabled and
  preserve event scrubbing. Runtime events use the app variant as `environment`, the platform build
  number as `dist`, and `<package>@<version>+<build>` as the release name. `SENTRY_AUTH_TOKEN`,
  `SENTRY_ORG`, and `SENTRY_PROJECT` are private build values and must never use the `EXPO_PUBLIC_`
  prefix.

## Everyday development

Use the installed development client for JavaScript, TypeScript, styling, copy, and tests:

```bash
npm run dev
```

Start the Android emulator, press `a` in the Expo terminal, and select **Mangalya Dev** if Android
asks which app should open the link. Metro and Fast Refresh deliver ordinary source changes without
native regeneration.

If Metro says port 8081 is occupied, identify the listener before stopping anything:

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
kill <confirmed-stale-metro-pid>
npm run dev -- --clear
```

Kill only the confirmed stale Metro process. If Expo cannot find a device, start the Pixel emulator
in Android Studio and verify it with:

```bash
/Users/kira/Library/Android/sdk/platform-tools/adb devices -l
```

## Native development-client rebuild

Rebuild **Mangalya Dev** only after an Expo SDK or native dependency change, or after changing a
config plugin, permission, app identifier, scheme, icon, or splash. Stop Metro with `Ctrl+C`, then:

```bash
APP_VARIANT=development npx expo prebuild --clean --platform android
APP_VARIANT=development ANDROID_HOME=/Users/kira/Library/Android/sdk npx expo run:android
```

The emergency-contact picker uses `expo-contacts/legacy`. Its config plugin adds read access;
`WRITE_CONTACTS` is explicitly blocked. Request Android access only on a picker tap, preserve
manual entry, and verify the system Contacts picker in the rebuilt binary.

Confirm the installed package and scheme are `com.suman.mangalya.development` and
`mangalya-development`. An old native shell running current Metro JavaScript is not native-release
evidence. Do not remove an obsolete app package until its local data is backed up or its owner
explicitly approves deletion.

## Release gate

Run the complete local gate in [TESTING.md](./TESTING.md), then:

```bash
npx expo-doctor
npm audit --omit=dev
npm audit
APP_VARIANT=production npx expo export --platform android --output-dir /tmp/mangalya-export --clear
maestro test .maestro
```

Use a new temporary export directory when preserving comparative evidence. Inspect Hermes bundle
size, exported assets, bundled fonts, and static-asset growth against the previous release.

`npm audit fix` may be used only without `--force`. The SDK 57 dependency graph reported Metro
`image-size` and Expo/Xcode `uuid` build-tool advisories at the 2026-09-05 release checkpoint. Do
not accept an incompatible Expo downgrade to hide them; reassess against the current compatible SDK
before each release.

## Preview APK

Create a standalone phone-test APK only after batching changes, passing the gate, committing the
exact source on a feature branch, and confirming the active Expo account:

```bash
npx eas-cli@latest whoami
npx eas-cli@latest build --platform android --profile preview --no-wait --non-interactive
```

`--no-wait` returns the build-status link after submission. Share that link when the Product Owner
wants to monitor the build themselves; do not poll unless asked. A submitted build is not a verified
APK: record signing, artifact and device evidence only after those checks actually happen.

This uploads a source snapshot and consumes an applicable Android EAS cloud build. The resulting APK
contains its JavaScript bundle and needs neither Metro nor the Mac after installation. Any later
source change requires another build.

Record the source commit, checks, EAS build ID/page, artifact link, checksum, signing and manifest
inspection, and device result in a dated build record. Follow
[PREVIEW_BUILD_2026-09-11.md](./PREVIEW_BUILD_2026-09-11.md) as the current example.

Verify fresh setup and upgrade/migration without data loss; all create/edit/detail/delete/Undo
flows; backup/restore/recovery; permissions and sharing; 360dp and expanded layouts; landscape;
largest text; TalkBack; Reduced Motion; keyboard; Back behavior; process termination; rapid taps;
package/scheme; signing; launcher/splash; deep links; and scrubbed Sentry source maps.

## Production candidate

Use the production profile only after every P0/P1 release gate in [NEXT_STEPS.md](./NEXT_STEPS.md)
has evidence and the Product Owner authorizes a store candidate:

```bash
npx eas-cli@latest build --platform android --profile production --wait
```

Never release with test credentials, development logging, unresolved data-loss defects, or
unverified signing. Analytics, public sharing, AI, payments, and remote collaboration each require
their own privacy and authorization review.
