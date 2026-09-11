# Verification history through 2026-09-06

This archive preserves dated repository, emulator, native-build, accessibility, security, and
performance evidence that previously appeared in `TESTING.md`, `NEXT_STEPS.md`, and
`PRODUCTION_READINESS.md`. It is historical evidence, not the current release checklist. Use
[`../TESTING.md`](../TESTING.md) for acceptance procedures, [`../NEXT_STEPS.md`](../NEXT_STEPS.md)
for open work, and [`../PREVIEW_BUILD_2026-09-05.md`](../PREVIEW_BUILD_2026-09-05.md) for the latest
command-level signed-APK record.

Later entries supersede earlier partial or failed build states. No emulator result below implies a
physical-device, TalkBack, representative performance, or store-release pass unless explicitly
stated.

## 2026-08-01 — repository hardening

- TypeScript, Expo lint, formatting, 38 Jest suites/176 tests, and Expo's bundled SDK dependency
  check passed.
- A production Android export completed with 4,289 modules, 40 assets, and an 8,916,460-byte Hermes
  bundle, 0.047% above the 8,912,246-byte baseline.
- A regenerated development APK installed beside the legacy package. Fresh setup, launch without
  forced focus, restart persistence, invalid-household fallback, backup generation, and opening the
  Android chooser passed on the emulator.
- Fresh installs entered real setup instead of seeding demo data. Android Auto Backup was disabled;
  setup routing, identifiers/schemes, backup behavior, responsive layout, and deterministic stress
  data received focused coverage.
- All tracked Maestro YAML files parsed, but the Maestro CLI was absent. No journey was claimed as
  executed.

## 2026-08-08 — mobile UX checkpoint

- TypeScript, lint, formatting, and 38 Jest suites/202 tests passed after workspace v4, event/task,
  expense, household RSVP, gift, feedback, and cover-photo changes.
- Expo's installed SDK map passed dependency checking while network validation was unavailable. A
  production-style export completed with 4,286 modules, 36 assets, and an approximately 8.9MB
  Hermes bundle.
- The expense overlay subscribed to native keyboard height before autofocus, waited for keyboard
  dismissal before category selection, and removed its nested native modal.
- Preview build `7fffd92f-37b7-4123-b914-36721db6babb` completed. Physical keyboard, crop, and
  restart checks remained open because no device was connected.

## 2026-08-11 — release checkpoint

- TypeScript, Expo lint, formatting, `git diff --check`, and 39 Jest suites/203 tests passed.
- Expo's bundled SDK 57 dependency map passed. The production Android export completed with 4,287
  modules, 36 assets, and an 8,918,452-byte Hermes bundle, 0.070% above baseline.
- Maestro setup and backup selectors matched the UI, but the absent CLI still prevented device
  execution.
- Sentry privacy scrubbing covered error and transaction events with focused regression tests.

## 2026-08-12 to 2026-08-13 — Preview builds 3 and 4

- EAS build 3 `74eb2e9f-82d3-4444-8477-9966daea829c` from commit `9bc370a` produced a
  119,139,677-byte APK with SHA-256
  `b811e96a42c3e716eee9fc3bf194ecfe51e54005cf26b84d860ccdb7a4846729`.
- Static inspection verified v2 signing, `com.suman.mangalya.preview`, `mangalya-preview`, version
  `0.1.0 (3)`, API 24-36, disabled backup, and no camera or microphone permission. It also found
  unwanted `SYSTEM_ALERT_WINDOW`, so build 3 was rejected for distribution.
- Config blocked the overlay permission and advanced Android version code to 4. Preview prebuild
  and merged-manifest processing retained `allowBackup=false` and removed overlay, camera, and
  microphone access.
- Corrected EAS build 4 `57874f60-9ec5-44c2-9bfe-eef8f54e02fe` from commit `accd3cd` produced a
  119,139,681-byte APK with SHA-256
  `0066a5db2216e70772ba149c2cac055a244ae333428236e62e32c2c0b55d2e58`. Its v2 signature,
  `0.1.0 (4)` identity, release manifest, API range, backup setting, and absence of overlay,
  camera, and microphone permissions passed static inspection.
- Build 4 installed beside the development package on the API 36 emulator. Fresh setup, event and
  task creation/completion, a ₹12,500 expense, confirmed two-person household, cold persistence,
  invalid-household recovery, hardware Back, JSON backup/share/history, photo picker, Reduced
  Motion, and 1.3x/2.0x text passed without a fatal Android or unhandled JavaScript error.
- Landscape exposed clipped navigation-rail targets of roughly 4.6dp. The source fix was then
  verified in the development client at 914dp: root targets measured approximately 57.5x64dp and
  Home/Plan navigation passed. Build 4 predates that rail fix.

## 2026-08-13 — interaction refinement

- TypeScript, Expo lint, formatting/diff checks, 41 Jest suites/213 tests, and semantic
  night/navigation contrast checks passed.
- Emulator review confirmed compact date-grouped Money rows, title/category hierarchy, responsive
  More tiles, lighter navigation, and functional form headers.
- A temporary ₹1 development-only expense returned directly to Money and appeared first without a
  success toast or intermediate screen. Newly created rows used one transform/opacity pulse and
  skipped it under Reduced Motion; destructive Undo remained.

## 2026-08-24 — Inspire phase 1

- TypeScript, Expo lint, Prettier, `git diff --check`, the bundled SDK dependency check, and 55 Jest
  suites/292 tests passed. Network version validation was unavailable.
- A static production web export completed 93 routes, including Inspire root/detail/create/edit.
  Both themes were inspected at 360dp; navigation moved to the expanded rail at 600dp.
- The Android development client was rebuilt after adding image manipulation. It loaded on the
  Pixel 8 emulator, exposed all five tabs in accessibility order, opened the Inspire Gallery/Camera
  source sheet, and dismissed it with Android Back without a native-module or unhandled JavaScript
  error.
- Gallery/Camera selection, permission denial, full Inspire mutation journeys, 200-item profiling,
  TalkBack, large text, rotation, and physical-device checks remained open.

## 2026-08-29 — release-candidate source hardening

- TypeScript, Expo lint, Prettier, `git diff --check`, and 65 Jest suites/397 tests passed. A
  `--detectOpenHandles` rerun also passed without console warnings or open handles.
- Architecture and UX reviews found no P0 issues; their P1 findings were fixed. Security review
  found five P1 issues involving managed-media traversal, cleanup markers, lifecycle races, Android
  picker detection, and SecureStore backup rules; all were fixed and covered by focused tests or
  native regeneration.
- A clean production export completed with 2,795 modules, 57 assets, and a 7,655,635-byte Hermes
  bundle, 82.22% of the 9,311,031-byte growth ceiling and 14.16% below the previous 8,918,452-byte
  result. Onboarding/Home runtime raster bytes fell 90.05%, from 18,851,932 to 1,875,094.
- Preview native regeneration verified `com.suman.mangalya.preview`, `mangalya-preview`, version
  `0.1.0 (5)`, `allowBackup=false`, intentional Camera support, no SecureStore backup-rule
  references, and blocked microphone, overlay, legacy-storage, and broad-media permissions.
- Expo Doctor had previously passed 21/21. Current registry-dependent Doctor/audit reruns were
  unavailable. Gradle execution was blocked by host socket/cache restrictions, so this checkpoint
  did not claim a signed APK or device result.
- The production-readiness score moved from a pre-hardening 14/20 to a provisional repository/
  emulator score of 17/20. No P0 issue was known; physical device, runtime performance, Maestro,
  final signed artifact, and Sentry evidence remained P1 gates.

## 2026-09-05 — signed Preview build 5

- The local gate passed: TypeScript, Expo lint, 65 Jest suites/397 tests, Prettier,
  `git diff --check`, and Expo SDK dependency validation.
- After compatible Expo patch updates and registration of the `expo-sharing` config plugin, Expo
  Doctor passed all 21 checks.
- A non-forced production-dependency audit repair reduced 23 advisories (18 moderate, 5 high) to 21
  (17 moderate, 4 high). Remaining Expo Router, Metro, Xcode, and config-plugin paths required
  incompatible forced changes and were retained as toolchain exceptions.
- The production Android export completed with 2,793 modules, 57 assets, 59 files, and a
  7,650,724-byte Hermes bundle. Preview prebuild produced version `0.1.0 (5)`.
- The Gradle manifest diagnostic reached `:app:processReleaseMainManifest` without returning a
  final status and was interrupted; it was not counted as passing. Maestro was not installed.
- EAS build 5 `867001f8-d608-4f1f-98d5-52c19b6390a2` from commit `e396a64` produced a
  125,185,382-byte APK with SHA-256
  `7baf09b9d54932a6e0ab6a3bc3db1595da7d5cfb3f84b44f30e5dadb0ec714b8`.
- Static inspection verified v2 signing, `com.suman.mangalya.preview`, `mangalya-preview`, version
  `0.1.0 (5)`, API 24-36, `allowBackup=false`, Camera access, and absence of overlay, microphone,
  legacy-storage, broad-media, and biometric permissions.
- It installed on the Pixel 8 emulator and cold-launched without Metro in 2,195ms. Initial
  onboarding rendered and logs contained no fatal Android, JavaScript, missing-bundle, or
  development-server error.
- Maestro, TalkBack, full journeys, representative physical-device performance, final rail/device
  coverage, and Sentry event/source-map verification remained open.

## 2026-09-05 — documentation and unused-code cleanup

- The combined cleanup was reviewed against starting commit `983b16e`. Rechecks found no remaining
  references to the removed files or exports, no broken links across 15 Markdown files, no missing
  targets among 29 runtime asset references, and all 65 tracked test files in Jest discovery.
- TypeScript, Expo lint, 65 Jest suites/397 tests, Prettier, `git diff --check`, and the locally
  bundled Expo SDK dependency validation passed. Registry lookup was unavailable, so dependency
  validation used Expo's local compatibility map. Expo Doctor was not locally installed and was not
  rerun; its latest recorded result remains 21/21 above.
- A clean production Android export completed with 2,792 modules, 57 assets, and a
  7,647,213-byte Hermes bundle. Home, Inspire, More, and Settings rendered in the development client
  from the current Metro source. One duplicate explicit dev-launcher start hit an Expo native
  lifecycle exception and recovered; a controlled single cold launch then loaded Home with no fatal
  Android or unhandled JavaScript errors in a fresh log.
- Backup export wrote a valid 4,858-byte JSON file and retained its history entry, but the unchanged
  managed-file validation rejected the URI before Android's share chooser opened. This predates the
  cleanup and remains release gate `LB-07` in `NEXT_STEPS.md`.
- A destructive-data confirmation was inspected, but emulator data deletion was not authorized, so
  a fresh-onboarding device run was not performed. The onboarding route tests passed and the
  production export resolved all onboarding artwork.
- `expo-env.d.ts` regenerated correctly and fresh-checkout typechecking passed before Git tracking
  was stopped. The generated local file remains present and ignored.

## 2026-09-06 — LB-07 managed export sharing

- Before the production change, a focused regression test reproduced the Android failure: a valid
  app-managed export passed when the mocked Expo `Directory` URI had no trailing slash and failed
  with `BackupFileUnreadableError` when the native-style URI ended in `/`. The failing run reported
  one failed test and 24 passing tests.
- `managedFile` now reuses an existing directory-boundary slash or appends one when absent. The
  existing direct-child ownership rule, traversal and nested-path rejection, and non-empty-file
  checks remain in place. Export-history and recovery behavior were not changed.
- Focused file, backup-dashboard, and recovery-screen tests passed: 3 suites and 29 tests. Coverage
  verifies backup JSON and expenses CSV sharing with both directory URI forms, valid managed files,
  missing files, and rejection of external, traversal-looking, and nested paths before
  `expo-sharing` is called.
- The complete repository gate passed: TypeScript, Expo lint, 65 Jest suites/403 tests, Prettier,
  `git diff --check`, and Expo SDK dependency validation. Network access was disabled, so Expo used
  its bundled compatibility map. Jest emitted the existing non-failing `SelectField`/
  `AppBottomSheet` timer `act(...)` warning.
- A clean production Android export completed with 2,792 modules, 57 assets, 59 files, and a
  7,647,251-byte Hermes bundle.
- In the existing Pixel 8 Android development client (`com.suman.mangalya.development`), backup
  JSON opened the native chooser as `mangalya-data-backup-2026-09-06T05-49-41-108Z.json` and
  expenses CSV opened it as `mangalya-expenses-2026-09-06T05-50-40-564Z.csv`. The chooser was
  dismissed without sending data to an external app. App-sandbox inspection measured the new files
  at 4,858 and 75 bytes; export history retained both new entries and the earlier 4,858-byte backup.
  Filtered Android logs contained no React Native, Android runtime, or Expo modules error.
- `LB-07` is closed and was removed from `NEXT_STEPS.md`. No EAS build, publication, commit, or push
  was performed.

## 2026-09-06 — LB-03 Maestro Android journeys

- Maestro was absent before this gate. With explicit tooling approval, the official Homebrew
  formula installed Maestro CLI `2.10.0` and its formula dependencies; no application dependency
  or repository package manifest changed. Analytics were disabled for the recorded runs.
- The pre-change run stopped before a journey because Maestro 2.10 required config headers in the
  referenced subflows. Subsequent failure artifacts identified an IPv6-only localhost Metro bind,
  an intermittent Expo development-launcher handoff, keyboard-dismiss Back actions, selectors that
  targeted static field labels, an optional photo-picker step, off-screen task and Settings rows,
  an obsolete `Expense added` toast, and an invalid-link flow without its guest-list navigation
  context.
- The flows now start Metro through `npm run dev`, declare subflow app configuration, wait for the
  development launcher, and use its discovered Metro server only when direct deep-link handoff has
  not completed. Onboarding closes each text field with the IME action and verifies the optional
  photo step without opening the native picker.
- Event/task coverage creates `Family gathering`, links `Confirm transport`, gives the task today's
  date and Critical priority to match the current sort order, and verifies the completed count
  changes from zero to one. Expense coverage verifies the new `Wedding shoes` row and the persisted
  ₹4,500 total. Settings scrolls to the destructive action before entering `DELETE`. Invalid-link
  coverage now verifies More → Guests before and after the missing-household route.
- Corrected failures were rerun individually. The first complete suite passed six flows and failed
  only the invalid-link return assertion (`1/7 Flow Failed`); the next combined run was stopped
  after a task-list scroll timed out even though the failure hierarchy showed the created row. The
  deterministic task ordering above replaced that timing dependency.
- The final `maestro test .maestro` run passed all seven flows in 13m 13s: event/task 3m 02s,
  expense 3m 10s, typed deletion 1m 46s, backup/share 1m 24s, restart persistence 1m 20s, fresh
  setup 1m 07s, and invalid household link 1m 24s.
- The final suite ran on the existing Pixel 8 AVD (`emulator-5554`, Android API 37) against only
  `com.suman.mangalya.development`. It exercised onboarding, Home, Plan, Money, More, Guests,
  Backup & export, Android's share chooser, restart recovery, Settings, and typed local deletion.
  Filtered logs from all seven final flows contained no fatal Android, React Native JavaScript, or
  unhandled-JavaScript signature. The Preview package remained installed, and no Preview or
  production app data was reset.
- The complete repository gate passed: TypeScript, Expo lint, 65 Jest suites/403 tests, Prettier,
  `git diff --check`, and Expo SDK dependency validation. Network access was disabled, so Expo used
  its bundled compatibility map. Expo Doctor was not locally installed and was not run because this
  task authorized installing Maestro only; its latest recorded result remains the 21/21 pass from
  2026-09-05.
- A clean production Android export completed with 2,792 modules, 57 assets, 59 total files, and a
  7,647,249-byte Hermes bundle.
- `LB-03` is closed and was removed from `NEXT_STEPS.md`. Physical-device share-picker,
  accessibility, layout, and performance evidence remain in `LB-04` through `LB-06`. No EAS build,
  publication, commit, or push was performed.

## 2026-09-07 — LB-04 performance preparation

- The deterministic LB-04 host harness uses the schema-valid 1,000-guest, 500-task, and 500-expense
  fixture plus 200 generated Inspire records. It runs through `npm run measure:lb04` and reports
  medians and p95 values over 30 measured iterations after five warmups. It uses in-memory storage
  and excludes Android disk/bridge cost, release Hermes, rendering, image decoding, and garbage
  collection differences, so none of its timings satisfy representative-device acceptance.
- Before the focused changes, the 478,688-byte fixture measured: schema parse 17/19 ms
  median/p95, hydration 22/23 ms, task persistence 58/63 ms, expense persistence 54/56 ms,
  combined list preparation 1/1 ms, 500 INR formats 14/15 ms, and a filtered 200-record Inspire
  query 1/1 ms.
- Review confirmed that the earlier audit's largest screen and bundle concerns had already been
  addressed: event detail uses one heterogeneous `FlashList`, growing collection screens use
  virtualized lists, Lucide imports use icon subpaths, and Inspire pages 30 thumbnail derivatives
  at a time with memory/disk caching and recycling keys. Runtime raster payloads are 501,598 bytes
  for Home, 1,373,496 bytes for onboarding, and 2,656,550 bytes for the bundled Inspire pack; the
  largest individual runtime raster is 365,150 bytes.
- The remaining measured hot-write cost came from complete snapshot validation and serialization.
  `LocalWorkspaceStore` now passes its already-detached candidate directly to Zod, whose parse
  result is also detached, instead of first making another full JSON clone. The persisted cache and
  returned snapshot remain isolated, covered by a focused regression test. Persistence remains
  serialized and persist-before-publish; schema validation, capacity limits, migration, recovery,
  Supabase boundaries, and Sentry behavior did not change.
- INR formatters are now immutable module-level instances instead of being reconstructed in row
  paths. Across two post-change runs, schema parse measured 16/18 ms median/p95; hydration medians
  were 21 ms with 21–22 ms p95; task-persistence medians were 53–55 ms with 53–56 ms p95; and
  expense-persistence medians were 52–55 ms with 53–56 ms p95. Combined list preparation measured
  0–1/1 ms, 500 INR formats 0/1 ms, and the Inspire query 1/1 ms. The persistence result remains a
  lower bound because Android storage is excluded.
- Five development-client cold launches through the Metro deep link measured 2,405, 3,191, 2,300,
  2,261, and 3,332 ms: 2,405 ms median and 3,332 ms p95. This includes the development launcher and
  Metro handoff and is diagnostic only. The post-Maestro process reported 779,305 KB PSS and 224 of
  1,441 frames missing the current deadline (15.54%, 29 ms median, 65 ms p95) across mixed cold
  launches, navigation, animations, and native chooser activity. This is not a controlled stress
  scroll or release-build memory measurement and therefore is not release acceptance evidence.
- The complete Maestro suite passed all seven development-client flows in 15m 21s: event/task
  5m 44s, expense 2m 24s, typed deletion 1m 44s, backup/share 1m 30s, restart persistence 1m 23s,
  fresh setup 1m 12s, and invalid household link 1m 25s. Error-level AndroidRuntime,
  ReactNativeJS, and ExpoModulesCore logs were empty after the run.
- Focused repository, formatter, stress-fixture, event-detail, and Inspire tests passed: five suites
  and 47 tests. The complete local gate then passed TypeScript, Expo lint, 65 Jest suites and 404
  tests, Prettier, `git diff --check`, and Expo SDK dependency validation. The measurement file is
  outside ordinary Jest discovery and passes through its dedicated command. Network access was
  disabled, so Expo used its bundled compatibility map. Expo Doctor is not installed locally and
  was not run; its latest recorded result remains the 21/21 pass from 2026-09-05. Jest emitted the
  existing non-failing `AppBottomSheet` timer `act(...)` warning.
- A clean production Android export passed with 2,792 modules, 57 assets, 59 files, and a
  7,647,168-byte Hermes bundle. It is 81 bytes smaller than the latest comparable LB-03 export of
  7,647,249 bytes. The old 8,912,246-byte baseline predates the recorded asset and module-graph
  reductions; the current baseline is 7,647,249 bytes with a 10% ceiling of 8,411,974 bytes.
- LB-04 remains in progress. A fresh signed candidate on representative Android hardware must still
  measure task and expense persistence including storage, controlled stress-list frame rates,
  image decode/memory behavior, Hermes memory growth, and cold start without Metro. No EAS build,
  publication, commit, push, or merge was performed.

## 2026-09-09 — LB-05 accessibility and adaptive-layout preparation

- The existing Pixel 8 API 37 emulator and development client were exercised at 411×914dp
  baseline portrait, 360×800dp phone portrait, 800×1280dp expanded portrait, 731×320dp compact
  landscape, and 1280×800dp expanded landscape. The 360dp pass was repeated at Android font scale
  2.0. All five roots passed at every size; complete onboarding passed at 360dp/2.0 text and
  expanded portrait. Expanded landscape onboarding also completed after scrolling the second name
  field into view.
- The review reproduced large-text clipping in headings, summaries, onboarding labels, and bottom
  navigation. Text line heights now follow Android font scale, tab labels cap at the documented 1.3
  multiplier, and compact summaries, onboarding event cards, and review tiles stack when needed.
  The expanded rail was also unreachable at 320dp height; layouts below 336dp now use the bottom
  navigation, where all five destinations passed.
- Accessibility hierarchy inspection found that numeric NativeWind `min-h-12`/`min-w-12` classes
  measured about 41.9dp at the emulator density. Interactive controls now use the project `4xl`
  48dp token. Reinspection found no undersized or unlabelled visible click targets on Home,
  Inspire, Money, More, or a fully visible Plan row. Decorative 48dp icon wells remain
  non-interactive.
- Android Back now dismisses an active onboarding field/IME before moving to the previous stage.
  Hardware Back, the predictive edge gesture, Reduced Motion, focus-preserving dialogs and sheets,
  destructive confirmation, JSON backup sharing, expenses CSV sharing, gallery cancellation, and
  denied Camera permission all passed. The Camera grant, animation scales, accessibility-service
  state, font scale, rotation, size, and density were restored after testing.
- TalkBack was temporarily enabled and Android logs captured its `Inspire. Heading` announcement;
  automatic focus also reached the Home `Mangalya` heading. Injected gestures did not advance
  TalkBack focus reliably because its first-run service UI intercepted traversal, so continuous
  spoken-order validation remains part of the physical-device pass. The accessibility hierarchy
  confirmed labelled controls, selected states, and logical root order without unlabelled
  clickables.
- A compact-landscape diagnostic exposed a Maestro limitation rather than an app failure:
  `scrollUntilVisible` selected a clipped static `Your name` label with inverted bounds instead of
  the editable field. User-equivalent swipes reached both fields, coordinate taps edited them, and
  IME dismissal stayed on the names stage. The tracked onboarding subflow subsequently passed at
  the baseline configuration; compact-height physical interaction remains in the final-device
  matrix.
- Empty, loading, error, retry, populated, persistence, focus restoration, modal semantics, and
  large-text regressions are covered by the complete automated suite. The three onboarding-build
  tests now inject a zero decorative delay while production retains the 4.5-second assembly
  animation, removing a timing-only full-suite failure. TypeScript, Expo lint, all 66 Jest suites
  and 406 tests, Prettier, `git diff --check`, and the locally bundled Expo SDK dependency check
  passed. Expo Doctor passed 21/21 checks.
- The complete Maestro suite passed all seven development-client flows in 16m 43s: event/task
  6m 03s, expense 3m 05s, typed deletion 1m 49s, backup/share 1m 30s, restart persistence 1m 27s,
  fresh setup 1m 14s, and invalid household link 1m 35s.
- The complete npm audit reported the retained Expo/Metro toolchain set of 21 transitive
  advisories: 17 moderate and four high. A separate production-only audit was blocked by automatic
  approval review because that command would send production dependency metadata to npm; no forced
  or breaking dependency repair was applied.
- A clean production Android export passed with 2,792 modules, 57 assets, 59 files, and a
  7,649,992-byte Hermes bundle. This is 2,743 bytes (0.0359%) above the 7,647,249-byte baseline and
  761,982 bytes below its 10% ceiling.
- LB-05 remains in progress. The exact signed candidate still needs physical phone/tablet coverage,
  continuous TalkBack traversal, share/picker and permission behavior, process termination,
  upgrade installation, and signed-APK validation. No EAS build, publication, commit, push, or
  merge was performed.

## 2026-09-11 — LB-06 release-configuration preparation

- Configuration review covered `app.config.ts`, `eas.json`, package metadata, Expo plugins,
  development/Preview/production identities and schemes, version counters, orientation, keyboard
  resize, predictive Back, Android backup policy, permissions, deep links, launcher/adaptive icons,
  splash assets, and Sentry. Because signed Preview build 5 already exists, current source now uses
  Android version code 6. Expo Dev Client's generated `exp+mangalya` scheme is explicitly limited to
  development so Preview and production cannot inherit it.
- Expo Doctor initially identified newer compatible SDK patches. Existing direct dependencies were
  updated from Expo `57.0.20` to `57.0.21` and Expo Router `57.0.19` to `57.0.20`; no dependency was
  added. The final Expo compatibility check passed and Expo Doctor passed 21/21 checks.
- Clean Android prebuilds for development, Preview, and production passed in disposable `/tmp`
  directories and left no native tree in the repository. Development generated
  `com.suman.mangalya.development` with `mangalya-development` plus the Dev Client launcher scheme;
  Preview generated `com.suman.mangalya.preview` with only `mangalya-preview`; production generated
  `com.suman.mangalya` with only `mangalya`. All variants used version code 6, default orientation,
  keyboard resize, predictive Back, and `allowBackup=false`.
- Final Preview and production release-manifest merges passed. Each contained only Camera,
  Internet, Vibrate, network-state, and its app-scoped dynamic-receiver permission. Overlay,
  microphone, legacy/broad storage, broad media, and biometric permissions were absent;
  `debuggable` and cleartext flags were not enabled. A first parallel Preview merge failed when two
  disposable Gradle builds contended for Expo's shared Kotlin output; production passed, and the
  unchanged Preview merge passed when rerun alone. Removal-directive warnings confirmed the blocked
  permissions had no declarations to remove.
- Disposable native resources contained the expected launcher, round, foreground, background, and
  monochrome icons across five Android densities plus splash artwork across five densities. All 33
  generated launcher/splash files had matching hashes in development, Preview, and production.
  Visual launcher/splash behavior still requires the signed candidate.
- Runtime deep-link diagnostics passed in the existing API 37 Pixel development client for all five
  roots; Guests, Gifts, Emergency contacts, Backup, and Settings; event/task/expense/guest/gift/
  contact create, detail, and edit routes; and a valid Inspire detail/edit record. Missing event,
  task, expense, Inspire, household, gift, and contact records showed their intentional not-found
  states. A percent-encoded blank task identifier also showed not found, and an unsupported route
  showed the unavailable page before `Go home` returned to Home. `/inspire/new` without its
  in-memory picked-media draft correctly showed `Inspiration draft not found`.
- Warm custom-scheme navigation passed. A cold custom-scheme launch entered the development
  launcher before the app route, which is expected for this old development shell and is not signed
  release evidence. The five-root shell also passed at a 686×300dp compact-height diagnostic, using
  the bottom-navigation fallback. Cold-start Preview/production links and final compact behavior
  remain part of the signed-device pass.
- Sentry remains dormant when no public DSN exists, disables default PII, breadcrumbs, sessions,
  traces, and transactions, and scrubs user, request, context, extra, arbitrary text, and local
  paths before sending. Runtime configuration now tags `development`, `preview`, or `production`
  and names Android releases `<package>@<version>+<versionCode>` with the version code as `dist`,
  matching Sentry's Gradle convention. A placeholder-only disposable prebuild applied the Sentry
  Gradle integration without writing a token. No suitable credentials were configured, so real
  event delivery and source-map upload were not attempted and remain blocked.
- A production export with source maps passed with 2,793 modules, 57 assets, a 6,196,272-byte Hermes
  bundle, a 15,098,687-byte map, and debug ID
  `244b6e1c-0f78-4e77-bff7-80ada01634ae`; Sentry's debug-ID validation script passed. The comparable
  no-map export contained 59 files and a 7,652,325-byte Hermes bundle with SHA-256
  `de57ca01b31fd6a569b5479717f9361ca8410e27ff6499550c89f4cc37ccc1fc`. It is 5,076 bytes
  (0.0664%) above the 7,647,249-byte baseline and 759,649 bytes below the 10% ceiling.
- Production source-map scanning found no development package, development scheme, development app
  name, Metro endpoint, service-role/OpenAI secret prefix, Sentry auth variable, or Dev Client/
  launcher/menu module in the runtime graph. Generic `localhost`, `DevLauncher`, and
  `expo-development-client` strings remain inside shared Expo, React Native, URL parsing, and
  disabled Sentry Spotlight source; no app configuration enables those development paths.
- Focused configuration, Sentry initialization, release naming, and event-scrubbing coverage passed
  four suites and 12 tests. The complete gate passed TypeScript, Expo lint, all 67 Jest suites and
  410 tests, Prettier, `git diff --check`, Expo compatibility validation, and Expo Doctor 21/21.
  Jest retained the documented non-failing `AppBottomSheet` timer `act(...)` warning.
- The complete npm audit retained 21 transitive Expo/Metro toolchain advisories: 17 moderate and four
  high. Suggested complete remediation includes incompatible Expo/Router downgrades, so no forced
  or breaking repair was applied. Automatic approval review blocked the separate production-only
  audit because it would disclose the production dependency tree to npm's advisory service.
- The first complete Maestro run passed six flows and failed only when one Settings swipe stalled
  for about 15 minutes before reaching `Delete local data`; the screenshot showed a responsive
  Settings page above the destructive section. The unchanged deletion flow then passed alone. The
  final suite passed all seven development-client flows in 15m 58s: event/task 4m 34s, expense
  3m 41s, typed deletion 1m 57s, backup/share 1m 35s, restart persistence 1m 30s, fresh setup
  1m 11s, and invalid household link 1m 29s. Final flow logs contained no fatal Android,
  React Native JavaScript, or Expo Modules error signature.
- LB-06 remains in progress. Candidate 6 still needs a signed artifact, signing and packaged-manifest
  inspection, launcher/splash and cold deep-link checks, physical phone/tablet layout and Back
  coverage, and scrubbed Sentry delivery/source-map upload with suitable credentials. No EAS build,
  publication, commit, push, merge, permanent native output, credential, or schema change was made.
