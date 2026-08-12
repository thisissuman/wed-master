# Testing strategy

Test behavior that can cost users time, money, privacy, or trust. Do not optimise for a coverage percentage.

## Automated coverage

- Money parsing/INR formatting, date-only defaults/countdowns, title-suggestion ranking, newest-expense ordering, target/spent/pending selectors, highest-first category grouping, date-range daily aggregation, bounded trend sampling, and event/task progress.
- Strict workspace validation; v1/v2/v3-to-v4 migration; starter-event deduplication/date offsets; household RSVP derivation; historical-field preservation; backup envelopes/size limits; serialized writes; persist-first failures; corruption recovery; deletion tombstones; and local file cleanup.
- Positive paise validation; mandatory seven-category quick capture; duplicate-tap protection; exact created-expense hand-off; optional-details retry/cleanup; hidden legacy-field preservation; dirty-form navigation guards; keyboard metadata; and accessible feedback/undo.
- Tab visibility/selection, duplicate-safe navigation, deep-link fallbacks, loading/error/empty states, filters, and key accessibility semantics.
- Fresh-install empty-workspace routing, variant identifiers/schemes, Android backup and image-picker permission configuration, one-action empty states, invalid-household recovery, two-line task titles, compact/expanded navigation, and large-text guest/backup layouts.
- A deterministic schema-valid fixture covers 1,000 guests, 500 tasks, and 500 expenses without becoming production seed data.

Run the complete local gate:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run format:check
npx expo install --check
```

Run `npx expo-doctor` when available, then export the production Android bundle to catch configuration and Metro/Hermes failures. Never report a skipped command as passing.

### 2026-08-01 hardening evidence

- The final pass completed TypeScript, Expo lint, formatting, 38 Jest suites/176 tests, and Expo's
  bundled local SDK dependency check. Refresh these counts rather than copying them into future
  release records.
- The production Android export completed with 4,289 modules, 40 assets, and an 8,916,460-byte
  Hermes bundle (+0.047% from the 8,912,246-byte baseline).
- The regenerated development APK was inspected and installed beside the legacy app. Fresh setup,
  no-forced-focus launch, restart persistence, invalid-household fallback, backup generation, and
  Android chooser opening passed on the emulator.
- Every `.maestro/*.yaml` file parses as YAML. The Maestro CLI is absent, so no flow is recorded as
  executed or passing.

### 2026-08-08 mobile UX verification

- TypeScript, lint, formatting, and all 38 Jest suites/202 tests passed after the v4 workspace,
  event/task, expense, household RSVP, gift, feedback, and cover-photo changes.
- Expo's SDK dependency check passed using the installed local native-module map because network
  dependency validation was unavailable. The Impeccable changed-screen detector reported no UI
  regressions.
- The production-style Android export completed with 4,286 modules, 36 assets, and an 8.9 MB
  Hermes bundle.
- The Android expense-sheet regression fix subscribes to native animated keyboard height before
  title autofocus, waits for keyboard dismissal before category selection, and removes the nested
  native modal from quick capture. EAS preview build 3 `7fffd92f-37b7-4123-b914-36721db6babb`
  completed successfully. Physical-device keyboard behavior, crop UI, and restart persistence
  remain release acceptance checks because no device was connected to this workspace.

### 2026-08-11 release checkpoint

- TypeScript, Expo lint, formatting, `git diff --check`, and all 39 Jest suites/203 tests passed.
- Expo's dependency check passed against the bundled SDK 57 map; remote validation remained
  unavailable in the restricted network environment.
- A clean production Android export completed with 4,287 modules, 36 assets, and an 8,918,452-byte
  Hermes bundle (+0.070% from the 8,912,246-byte baseline).
- Maestro setup and backup selectors were reconciled with the current UI. The Maestro CLI remains
  unavailable, so the seven journeys are still not recorded as executed or passing.

### 2026-08-12 signed preview artifact

- EAS preview build 3 `74eb2e9f-82d3-4444-8477-9966daea829c` finished successfully from commit
  `9bc370a`. The 119,139,677-byte APK has SHA-256
  `b811e96a42c3e716eee9fc3bf194ecfe51e54005cf26b84d860ccdb7a4846729`.
- Static APK inspection verifies its v2 signature, `com.suman.mangalya.preview` identity,
  `mangalya-preview` scheme, `0.1.0 (3)` version, API 24–36 range, disabled Android backup, and no
  camera or microphone permission.
- Inspection also found `SYSTEM_ALERT_WINDOW`. Because Mangalya has no overlay feature, app config
  now blocks the permission and advances Android version code to 4; build 3 is not accepted for
  distribution.
- A fresh preview prebuild followed by `:app:processReleaseMainManifest` passed. The merged release
  manifest retains version code 4, `mangalya-preview`, and `allowBackup=false`, while overlay,
  camera, and microphone permissions are absent.
- Corrected EAS build 4 `57874f60-9ec5-44c2-9bfe-eef8f54e02fe` finished from commit `accd3cd`.
  Static inspection verifies its v2 signature, `0.1.0 (4)` identity, release-mode manifest, API
  24–36 range, disabled backup, and absence of overlay, camera, and microphone permissions. The
  119,139,681-byte APK has SHA-256
  `0066a5db2216e70772ba149c2cac055a244ae333428236e62e32c2c0b55d2e58`.
- No emulator or physical device was connected. Installation, launcher/splash rendering, runtime
  deep links, device performance/accessibility, and Sentry delivery/source maps are not claimed.

Tracked Android journeys live under `.maestro/` and target `com.suman.mangalya.development`:

```bash
maestro test .maestro
```

The suite covers fresh setup, event/task completion, expense capture, invalid household links, backup/share opening, restart persistence, and typed local deletion. The backup flow still requires physical-device share-picker confirmation.

## Manual release matrix

- Fresh setup, existing v4 workspace, v1/v2/v3 migration, malformed storage, recovery-copy export, valid/invalid import, demo reset, and typed full deletion.
- All four roots plus every create/edit/detail/delete flow; rapid taps; header, gesture, and Android hardware/predictive back.
- Keyboard focus/next/done behavior, date/time pickers, attachment denial/cancel/oversize/missing-file handling, and share-sheet availability.
- 360dp Android, a larger phone/tablet, landscape, largest font size, reduced motion/title sparkles, and TalkBack.
- Rapid expense taps, title/category reuse, keyboard amount focus, attachment cancel/failure/retry, Budget category filtering, and Tasks/Events switching under the large-list stress fixture. Preview-build targets are cold start ≤2.5s, task persistence p95 ≤150ms, expense save p95 ≤300ms, and no sustained scrolling below 55 FPS.
- Upgrade install, background/termination during form entry and save, release signing, and offline launch.

Metro can update JavaScript inside an old native shell, so every native QA record must include the installed package name and scheme. Rebuild after config-plugin, permission, identifier, icon, splash, or native-dependency changes.
