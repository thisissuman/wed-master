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
- No push to `main` was attempted. This follows the branch rules in
  [ENGINEERING_GUIDE.md](./ENGINEERING_GUIDE.md).

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

```bash
git add -A
git diff --cached --check
git commit -m "feat(app): add inspire board and refine planning flows" \
  -m "Add the local-first Inspire experience, theme-aware visual redesign, onboarding and workspace refinements, lifecycle and media hardening, expanded tests, optimized image assets, and current release documentation."
git push origin codex/ux-simplification-visual-redesign
```

Result:

- The staged whitespace check passed.
- Local commit `e396a6478eca47da8653a4ea395ce14c2a456350` was created on
  `codex/ux-simplification-visual-redesign`.
- The first push attempt was blocked by automatic approval review while the external remote was
  being verified. It was later authorized and pushed successfully. Subsequent documentation
  commits also reached `origin/codex/ux-simplification-visual-redesign`; the local and upstream
  branch both resolved to `983b16e` when this record was consolidated on 2026-09-05.

## EAS Preview APK

Expo authentication was checked before using cloud capacity:

```bash
npx eas-cli@latest whoami
```

Result: the active Expo account is `thisissuman` (`sumanmaharana222888@gmail.com`). The build was
then started with:

```bash
npx eas-cli@latest build --platform android --profile preview --wait --non-interactive
```

This uploads the source snapshot to Expo's EAS Build service, consumes one Android cloud build from
the Expo account's applicable usage allowance, waits for the remote build, and returns the build
page and APK download URL. The `preview` profile in `eas.json` requests an internally distributed
APK, so it can be downloaded directly to an Android phone.

Result:

- Status: `FINISHED`.
- Build ID: `867001f8-d608-4f1f-98d5-52c19b6390a2`.
- Source commit: `e396a6478eca47da8653a4ea395ce14c2a456350`.
- Build page:
  <https://expo.dev/accounts/thisissuman/projects/mangalya/builds/867001f8-d608-4f1f-98d5-52c19b6390a2>.
- Android download:
  <https://expo.dev/artifacts/eas/Z56IW3aZG34JY4HLfSBGcE-vvXyHi3xxDwTI_q5Wr0c.apk>.
- Completed: 2026-09-05 21:24:31 IST.
- EAS metadata lists artifact expiry on 2026-09-19, so keep the build page as the durable record and
  create a fresh Preview build when a later source snapshot is needed.

The APK was downloaded and inspected with:

```bash
curl --fail --location \
  --output /tmp/mangalya-preview-5.apk \
  https://expo.dev/artifacts/eas/Z56IW3aZG34JY4HLfSBGcE-vvXyHi3xxDwTI_q5Wr0c.apk
shasum -a 256 /tmp/mangalya-preview-5.apk
/Users/kira/Library/Android/sdk/build-tools/37.0.0/apksigner \
  verify --verbose --print-certs /tmp/mangalya-preview-5.apk
/Users/kira/Library/Android/sdk/build-tools/37.0.0/aapt \
  dump badging /tmp/mangalya-preview-5.apk
/Users/kira/Library/Android/sdk/build-tools/37.0.0/aapt \
  dump permissions /tmp/mangalya-preview-5.apk
/Users/kira/Library/Android/sdk/cmdline-tools/latest/bin/apkanalyzer \
  manifest print /tmp/mangalya-preview-5.apk
```

Inspection result:

- Size: 125,185,382 bytes.
- SHA-256: `7baf09b9d54932a6e0ab6a3bc3db1595da7d5cfb3f84b44f30e5dadb0ec714b8`.
- APK Signature Scheme v2 verifies with one RSA 2048-bit signer.
- Package: `com.suman.mangalya.preview`.
- Display name: `Mangalya Preview`.
- Version: `0.1.0 (5)`.
- Minimum/target/compile SDK: 24/36/36.
- Deep-link scheme: `mangalya-preview`.
- Android backup: `android:allowBackup="false"`.
- Declared uses-permissions: Camera, Internet, Vibrate, network state, and Android's package-scoped
  non-exported dynamic receiver permission.
- Microphone, overlay, legacy external storage, broad media access, and biometric permissions are
  absent.

## Emulator installation and standalone launch

The Pixel 8 emulator was connected as `emulator-5554`. Before installation it contained
`com.suman.mangalya.development` and the legacy `com.suman.wedmaster`; the Preview package was not
installed.

```bash
/Users/kira/Library/Android/sdk/platform-tools/adb \
  -s emulator-5554 install -r /tmp/mangalya-preview-5.apk
lsof -nP -iTCP:8081 -sTCP:LISTEN
/Users/kira/Library/Android/sdk/platform-tools/adb \
  -s emulator-5554 shell am force-stop com.suman.mangalya.preview
/Users/kira/Library/Android/sdk/platform-tools/adb \
  -s emulator-5554 shell am start -W \
  -n com.suman.mangalya.preview/.MainActivity
```

Result:

- Installation returned `Success`.
- Nothing was listening on port 8081.
- Android reported a successful cold launch of `MainActivity` in 2,195 ms.
- The first onboarding screen rendered with the current plum design and optimized illustration.
- `Mangalya Preview` remained the focused foreground activity.
- The launch log contained no fatal Android exception, unhandled React Native error, missing-script
  error, or development-server connection error.

This emulator smoke confirms that the signed APK starts without Metro. It does not replace the
full Maestro journey, TalkBack, physical-device, permission-denial, or representative performance
matrix.

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
