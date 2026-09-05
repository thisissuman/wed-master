# Android preview build record — 2026-09-05

This record explains exactly what was checked before creating the Android Preview APK, what each
command did, and what result was observed. It is intentionally separate from the everyday
development commands in [RELEASE.md](./RELEASE.md).

## Goal

Create a tested, installable `Mangalya Preview` APK from the current redesign and Inspire work,
push the exact source to GitHub, and keep enough evidence to reproduce the result.

The preview profile is a standalone Android APK. It contains the JavaScript bundle and assets that
exist when the build starts, so it does not need Metro, port 8081, the Mac, or a QR code after it is
installed. A later source change requires a later preview build.

## Source and branch preflight

```bash
cd /Users/kira/wed-master
git branch --show-current
git status --short --branch
git remote -v
```

Result:

- Branch: `codex/ux-simplification-visual-redesign`.
- The branch tracked `origin/codex/ux-simplification-visual-redesign`.
- The working tree contained the current visual redesign, Inspire feature, lifecycle/storage
  hardening, test, documentation, and asset-conversion batch. These changes were kept together and
  tested as the requested release candidate.
- No push to `main` was attempted. This follows [GIT_WORKFLOW.md](./GIT_WORKFLOW.md).

## Repository-defined test gate

[TESTING.md](./TESTING.md) defines the complete local gate. The commands were run from the project
root:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run format:check
npx expo install --check
```

The first focused Jest run found six stale Home-screen expectations in
`HomeDashboard.test.tsx` and `HomeComponents.test.tsx`. The product decision already recorded in
[DECISIONS.md](./DECISIONS.md) removes the Home quick-action strip, opens the keepsake from the
wedding card, and keeps one expense floating action button. The tests were updated to assert that
current behavior and its accessibility labels. The focused rerun then passed 2 suites and 21 tests.

The complete gate was run once after that fix and again after the Expo dependency refresh. The
final result was:

- TypeScript: passed with no emitted files.
- Expo ESLint: passed.
- Jest: 65 suites and 397 tests passed.
- Prettier check: passed.
- `git diff --check`: passed with no whitespace errors.
- Expo dependency check: dependencies are up to date for SDK 57.

## Expo SDK validation and dependency repair

```bash
npx expo-doctor
```

The first online run passed 20 of 21 checks and reported 12 Expo packages behind their compatible
SDK 57 patch versions.

```bash
npx expo install --fix
```

The first repair updated the compatible Expo packages and then identified a missing config plugin
for the directly installed `expo-sharing` package. `"expo-sharing"` was added to the `plugins`
array in `app.config.ts`, then the repair and validation were repeated:

```bash
npx expo install --fix
npx expo-doctor
npx expo install --check
```

Final result: Expo Doctor passed all 21 checks and Expo reported that dependencies are up to date.

## Dependency vulnerability check

```bash
npm audit --omit=dev --audit-level=high
npm audit fix --omit=dev
npm install
```

The nonbreaking audit repair reduced the report from 23 advisories (18 moderate, 5 high) to 21
(17 moderate, 4 high). The remaining advisories are in Expo Router, Metro, Xcode/config-plugin
tooling dependency paths. npm's proposed force remedies change incompatible major SDK packages or
downgrade Expo packages, so `npm audit fix --force` was not used. `npm install` restored the full
development dependency tree after the production-only audit operation, and the complete test gate
then passed again.

This is an accepted toolchain limitation for this candidate, not a claim that `npm audit` is clean.
It must be reconsidered when Expo publishes compatible dependency updates.

## Production JavaScript/asset export

```bash
APP_VARIANT=production npx expo export \
  --platform android \
  --output-dir /tmp/mangalya-export-20260905.xqAqXm \
  --clear
```

This compiles the production Android JavaScript and assets with Metro/Hermes without creating or
uploading an APK. It catches route, configuration, asset-resolution, and production-bundling
failures before consuming an EAS cloud build.

Result:

- 2,793 modules bundled.
- 57 Expo assets exported.
- 59 total export files.
- Hermes bundle size: 7,650,724 bytes.
- Export completed successfully.

The temporary output directory is local build evidence and is not committed.

## Preview native generation

```bash
APP_VARIANT=preview npx expo prebuild --clean --platform android
```

This regenerated the ignored Android native project using the Preview variant. It does not create
an installable APK and does not consume EAS usage.

Result: Android prebuild completed with package `com.suman.mangalya.preview`, display name
`Mangalya Preview`, scheme `mangalya-preview`, and version `0.1.0 (5)` from `app.config.ts`.

The following diagnostic Gradle task was also started:

```bash
cd /Users/kira/wed-master/android
ANDROID_HOME=/Users/kira/Library/Android/sdk ./gradlew :app:processReleaseMainManifest
```

It completed the release JavaScript/assets bundle stage (2,793 modules and 59 copied assets) and
entered `:app:processReleaseMainManifest`, but produced no final exit status. It was interrupted
rather than recorded as passing. The signed EAS APK inspection below is the authoritative native
manifest and packaging check.

## Device automation availability

```bash
command -v maestro
```

Result: Maestro is not installed on this Mac. Therefore `maestro test .maestro` was not run and is
not reported as passing. The Jest suite still covers the relevant application logic and component
behavior; a device journey remains a separate release check.

## Git commit and push

The exact commit and push output will be added here after the tested source is committed.

## EAS Preview APK

The build ID, status, artifact URL, checksum, package identity, signature result, and permission
inspection will be added here after the cloud build completes.

The command used is:

```bash
npx eas-cli@latest build --platform android --profile preview --wait
```

This uploads the source snapshot to Expo's EAS Build service, consumes one Android cloud build from
the Expo account's applicable usage allowance, waits for the remote build, and returns the build
page and APK download URL. The `preview` profile in `eas.json` requests an internally distributed
APK, so it can be downloaded directly to an Android phone.

## Everyday development versus a Preview APK

For normal code changes on the emulator, use the already installed `Mangalya Dev` application:

```bash
cd /Users/kira/wed-master
npm run dev
```

Then press `a`. JavaScript/TypeScript and styling changes normally arrive through Metro and Fast
Refresh; they do not need a new EAS build. Rebuild the local development client only after native
configuration or native dependencies change:

```bash
cd /Users/kira/wed-master
APP_VARIANT=development npx expo prebuild --clean --platform android
APP_VARIANT=development \
  ANDROID_HOME=/Users/kira/Library/Android/sdk \
  npx expo run:android
```

Create another EAS Preview APK only when a standalone phone download is needed or when native
packaging needs release-style verification.
