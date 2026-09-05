# Testing strategy

Test behavior that can cost users time, money, privacy, or trust. Do not optimise for a coverage percentage.

## Automated coverage

- Money parsing/INR formatting, date-only defaults/countdowns, title-suggestion ranking, newest-expense ordering, target/spent/pending selectors, highest-first category grouping, date-range daily aggregation, bounded trend sampling, and event/task progress.
- Strict workspace validation; v1/v2/v3/v4-to-v5 migration; starter-event/task exact-alias deduplication and date offsets/clamping; household RSVP derivation; historical-field preservation; backup envelopes/size limits; serialized writes; persist-first failures; corruption recovery; deletion tombstones; and local file cleanup.
- Positive paise validation; mandatory seven-category quick capture; duplicate-tap protection; direct created-expense return to Money; date grouping; hidden legacy-field preservation; dirty-form navigation guards; keyboard metadata; and destructive Undo.
- Tab visibility/selection, persistent Plan segmented-control state, onboarding event/task selection and atomic workspace creation, Home expense-FAB accessibility, duplicate-safe navigation, deep-link fallbacks, loading/error/empty states, filters, and key accessibility semantics.
- Fresh-install empty-workspace routing, variant identifiers/schemes, Android backup and image-picker permission configuration, one-action empty states, invalid-household recovery, two-line task titles, compact/expanded navigation, and large-text guest/backup layouts.
- Inspire schema strictness, separate-store serialization/concurrency, stable cursor pages, category/favourite/search/event-name filtering, event unlinking, delete/Undo, explicit full cleanup, corruption recovery, orphan repair, and backup exclusion. Media tests cover HEIC/JPEG/PNG sources, portrait/landscape/panorama/long-image dimensions, WebP derivative limits, partial-write rollback, collisions, permissions/cancellation, managed-file cleanup, and broken-image fallbacks.
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

### 2026-08-13 signed preview emulator acceptance

- The inspected build-4 APK was installed side by side on the API 36 emulator as
  `com.suman.mangalya.preview`; `dumpsys package` reports `0.1.0 (4)` and release flags.
- Fresh setup, event creation, task creation/completion, ₹12,500 expense capture, a confirmed
  two-person household, cold-restart persistence, invalid-household recovery, Android hardware
  Back, JSON backup/share/history, the system photo picker, reduced motion, and 1.3×/2.0× text
  passed. The process log contained no fatal Android or unhandled JavaScript error.
- Landscape failed on the 1080×2400, 420-dpi emulator. The left material navigation rail displayed
  clipped icons and exposed only 12-pixel-wide (about 4.6dp) accessibility bounds for Home, Plan,
  Money, and More. This is below the required 48dp target and must be fixed and re-tested in the
  batched release-candidate work.
- Emulator results do not replace TalkBack testing, launcher/splash review, representative hardware
  performance, permission-denial coverage, or physical-phone acceptance. No new APK should be
  produced until the current test findings are batched, unless a newly found native defect makes
  further testing unsafe or invalid.

### 2026-08-13 redesigned development-client acceptance

- The redesigned source was loaded through Metro in the already-installed
  `com.suman.mangalya.development` client. No intermediate APK was built. Home, Plan, Money, More,
  quick expense, and the category selector were inspected at the emulator's 411dp portrait width.
- The category selector and quick-expense sheet retain labelled close actions, backdrop/Android
  Back handling, and large touch targets. Non-draggable handles and non-navigational category
  chevrons were removed after the live visual pass exposed those misleading affordances.
- At 1.3× and 2.0× text, Home recomposes its hero and quick actions, More rows grow and remain
  scrollable, and the bottom navigation remains readable without horizontal clipping.
- At 914dp landscape width, the expanded rail now renders complete icons, labels, and the active
  marker. UIAutomator measured every root target at 151×168–169 physical pixels on the 420-dpi
  emulator, approximately 57.5×64dp, above the 48dp minimum. Home and Plan both rendered and rail
  navigation succeeded after a clean development-client relaunch.
- One Fabric prop-update assertion occurred while rotation, package switching, and Fast Refresh
  overlapped. It did not reproduce after restarting only the development process; subsequent clean
  launches, reloads, navigation, and the final process log contained no fatal Android or unhandled
  JavaScript error. The final signed APK still needs the same landscape and physical-device pass.

### 2026-08-13 focused interaction refinement

- The second-pass source stayed in the existing development client; no APK was built. TypeScript,
  Expo lint, formatting/diff checks, all 41 Jest suites/213 tests, semantic night/navigation
  contrast tests, and the Impeccable changed-screen detector passed.
- The emulator visually confirmed compact date-grouped Money rows, title-over-category hierarchy,
  the responsive More tool grid with dark icon wells, the lighter navigation shell, and functional
  form headers without promotional copy or decorative flourishes.
- A temporary local ₹1 `CodexFlow` expense was added through the live quick-entry route. It returned
  directly to Money, appeared first under `13 Aug 2026`, and exposed no toast or intermediate
  Done/optional-details page. This test record remains only in the development package's local
  emulator data and is not part of repository seed data or the signed preview app.
- Newly created expense, task, event, household, gift, and contact rows use one transform/opacity
  pulse and skip it under Reduce Motion. Passive success snackbars were removed; deletion Undo was
  retained. A signed preview still requires one final batched build after all source work is done.

### 2026-08-24 Inspire Phase 1 verification

- TypeScript, Expo lint, Prettier, `git diff --check`, Expo's bundled local SDK dependency check,
  and all 55 Jest suites/292 tests passed. Network version validation was unavailable, so the Expo
  dependency result used SDK 57's installed native-module map. The one-time Impeccable pass over
  the changed Inspire, navigation, and shared-component surfaces reported no findings.
- A static production web export completed all 93 routes, including `/inspire`, its detail route,
  and the create/edit modals. Royal Plum and Lavender Pearl were inspected at the 360dp minimum;
  the five compact labels fit without shrinking, theme switching preserved hierarchy, and the
  600dp layout moved to the expanded rail.
- The Android development client was rebuilt after adding `expo-image-manipulator`, installed on
  the Pixel 8 emulator, and loaded without a missing-native-module or unhandled JavaScript error.
  Home exposed Home · Plan · Inspire · Money · More in UIAutomator order. Inspire rendered its
  native empty state, the Add sheet exposed labelled Gallery and Camera choices, and Android Back
  dismissed the sheet without leaving the root board.
- This smoke pass did not select Gallery or Camera, mutate the emulator's workspace through demo
  reset, run the 200-item memory profile, enable TalkBack, or replace physical-device acceptance.
  Permission-denial/permanent-denial, capture processing, seeded-board performance, large text,
  reduced motion, rotation, and the full detail/edit/share/delete journey remain in the manual
  release matrix below.

Tracked Android journeys live under `.maestro/` and target `com.suman.mangalya.development`:

```bash
maestro test .maestro
```

The suite covers fresh setup, event/task completion, expense capture, invalid household links, backup/share opening, restart persistence, and typed local deletion. The backup flow still requires physical-device share-picker confirmation.

### 2026-08-29 self-test release-candidate source gate

- TypeScript, Expo lint, 65 Jest suites/397 tests, Prettier verification, and `git diff --check`
  pass after lifecycle, onboarding, status-action, accessibility-timeout, direct-icon import, and
  managed-media security hardening. A final `--detectOpenHandles` Jest rerun also passed all 397
  tests without console warnings or open handles. All three final read-only review tracks were
  requested; the
  UX/architecture tracks found no P0 and their P1 findings were fixed. The security track found
  five P1 findings (media traversal, ambiguous cleanup markers, lifecycle races, Android platform
  detection, and SecureStore backup-rule configuration); all five are fixed and covered by focused
  tests or native regeneration evidence.
- `npx expo install --check` reports dependencies up to date against the SDK 57 local map; a prior
  remote validation passed before this source-only batch, while the current rerun was offline.
  `npx expo-doctor` previously passed all 21 checks. The production-only audit has no app-runtime
  High/Critical package; the
  remaining High `image-size` and Moderate `uuid` advisories are documented Expo/Metro build-tool
  exceptions in `docs/RELEASE.md` because the only forced remedy would downgrade the SDK. The
  current `npm audit --omit=dev` and `npm audit` reruns were blocked by the offline registry
  (`ENOTFOUND registry.npmjs.org`), so they are not counted as fresh passing evidence.
- A clean production Android export completed with 2,795 modules, 57 assets, and a 7,655,635-byte
  Hermes bundle (82.22% of the 9,311,031-byte ceiling; 14.16% below the previous 8,918,452-byte
  bundle). Referenced onboarding/Home raster payload is 1,875,094 bytes versus 18,851,932 bytes
  before conversion (90.05% reduction).
- Preview native regeneration completed for `com.suman.mangalya.preview`, scheme
  `mangalya-preview`, version `0.1.0 (5)`, `allowBackup=false`, no SecureStore backup-rule
  references, intentional camera support, and removal directives for microphone, overlay,
  legacy-storage, and broad-media permissions. The final release APK build is still a
  native-environment gate: Gradle execution was rejected by the host usage limit/socket/cache
  restriction, so no APK or device result is claimed here.

### 2026-09-05 preview candidate gate

- The repository-defined local gate passed after updating stale Home tests to the already-recorded
  single-expense-FAB and wedding-card behavior: TypeScript, Expo lint, 65 Jest suites/397 tests,
  Prettier, `git diff --check`, and Expo's online SDK dependency validation all passed.
- `npx expo-doctor` initially found 12 compatible Expo patch updates. After the Expo dependency
  repair and registering the `expo-sharing` config plugin, all 21 Doctor checks passed and Expo
  reported dependencies up to date.
- The nonbreaking production-dependency audit repair reduced npm's report from 23 advisories (18
  moderate, 5 high) to 21 (17 moderate, 4 high). The remaining Expo Router, Metro, Xcode, and
  config-plugin dependency paths require incompatible forced changes, so they remain documented
  toolchain exceptions rather than being hidden by `--force`.
- A clean production Android export completed with 2,793 modules, 57 assets, 59 total files, and a
  7,650,724-byte Hermes bundle. Preview prebuild completed for `com.suman.mangalya.preview`,
  `mangalya-preview`, and version `0.1.0 (5)`.
- The local Gradle manifest diagnostic completed release bundling and reached
  `:app:processReleaseMainManifest` but did not return a final status; it was interrupted and is not
  claimed as passing. Maestro is not installed, so no tracked device flow is claimed. Signed APK
  results are recorded in [PREVIEW_BUILD_2026-09-05.md](./PREVIEW_BUILD_2026-09-05.md).

## Manual release matrix

- Fresh setup, existing v5 workspace, v4 upgrade-key migration, v1/v2/v3 migration, malformed storage, recovery-copy export, valid/invalid import, demo reset, and typed full deletion.
- All five roots plus every create/edit/detail/delete flow; rapid taps; header, gesture, and Android hardware/predictive back. Verify `/inspire` tab visibility, hidden navigation on pushed Inspire routes, direct deep-link fallback, route-backed modal motion, and Reduce Motion.
- Keyboard focus/next/done behavior for the first and final field of every form, onboarding step, editable sheet, and dialog; include multiline fields, large text, date/time pickers, attachment denial/cancel/oversize/missing-file handling, and share-sheet availability. On an emulator with a hardware keyboard, enable the soft IME with `adb shell settings put secure show_ime_with_hard_keyboard 1`, then repeat the focused-field pass on a physical phone with gesture and three-button navigation.
- 360dp Android, a larger phone/tablet, compact-height landscape, 600/840dp expanded widths, largest font size, reduced motion, selective night-surface contrast, and TalkBack.
- Inspire with 0, 1, 3, 20, and 200+ records at 360dp/411dp and 600dp/840dp+, font scales 1.0/1.3/2.0, cutouts, keyboard open, both themes, hot theme switching, TalkBack chronological order, long screenshots/panoramas, missing files, permission denial/cancel/retry, and mid-range Android scrolling/memory.
- Adaptive selectors and anchored filters: all-corner dialog/sheet geometry, translucent Android navigation-bar space, backdrop, close action, Android Back, keyboard-settled opening, trigger-focus restoration, long-list search, the four-option dialog threshold, immediate Status/Priority and RSVP/Needs-support filtering, and Reset.
- Rapid expense taps, title/category reuse, keyboard amount focus, attachment cancel/failure/retry, Budget category filtering, and Tasks/Events switching under the large-list stress fixture. Preview-build targets are cold start ≤2.5s, task persistence p95 ≤150ms, expense save p95 ≤300ms, and no sustained scrolling below 55 FPS.
- Upgrade install, background/termination during form entry and save, release signing, and offline launch.

Metro can update JavaScript inside an old native shell, so every native QA record must include the installed package name and scheme. Rebuild after config-plugin, permission, identifier, icon, splash, or native-dependency changes.
