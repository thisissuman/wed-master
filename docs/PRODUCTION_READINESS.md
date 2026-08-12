# Mangalya production readiness

Date: 2026-08-13

## Executive status

Mangalya has a strong local-first Android beta foundation, but public release is not approved yet.
The pre-hardening native audit scored **14/20 (Good)**: Accessibility 3/4, Performance 3/4,
Appearance & Theming 3/4, Platform Conformance 3/4, and Adaptivity 2/4. The post-hardening
repository/emulator audit is provisionally **16/20 (Good)**: Accessibility 3/4, Performance 3/4,
Appearance & Theming 4/4, Platform Conformance 3/4, and Adaptivity 3/4. There are no known P0
findings. Remaining P1 items are release-evidence gates, not claims of completion; physical device,
runtime performance, Maestro, replacement EAS, and Sentry evidence remains tracked in
[Next Steps](NEXT_STEPS.md).

The lavender-and-ivory implementation is canonical. Deleted Stitch references and archived
Emergent prompts are not active visual guidance.

## Completed hardening

### Activation, privacy, and native configuration

- A brand-new install now raises `WorkspaceEmptyError` and enters the real local setup flow instead
  of silently persisting demo data. Demo reset remains development-only.
- Android Auto Backup is disabled in `app.config.ts`. Product copy says Mangalya does not upload
  the workspace and that the user chooses when to export, without promising OEM-independent
  single-device residency.
- Development, preview, and production identifiers/schemes plus backup and image-picker permission
  configuration have focused tests.

### Navigation, accessibility, and responsive behavior

- Invalid household deep links use the standard not-found state with a working Guests fallback.
- Empty Gifts, Emergency Contacts, and Guests screens expose one contextual creation action.
- Task titles use two-line truncation instead of a nested horizontal scroller and stack their status
  action at large text sizes while preserving full accessibility labels.
- Shared 600dp expanded-width, 1.3 large-text, and 380dp compact-control thresholds drive layout.
- Compact windows retain bottom navigation; expanded windows use a left material navigation rail.
- Guest filters, summaries, household counters, and the backup hero recompose for narrow/large-text
  layouts.

### Performance and regression assets

- The current FlashList, memoized selector, Expo Image, and serialized persist-first repository
  architecture remains unchanged until measurement proves a bottleneck.
- A deterministic schema-valid fixture supplies 1,000 guests, 500 tasks, and 500 expenses.
- Seven independent Maestro flows cover setup, event/task completion, expenses, invalid links,
  backup/share opening, restart persistence, and local deletion.

## Current verification evidence

- TypeScript, Expo lint, Prettier verification, 39 Jest suites/203 tests, and `git diff --check`
  pass. Expo dependency validation passes against its bundled SDK 57 map; its remote version source
  was unavailable in offline mode, so that result is explicitly local-map evidence.
- A production Android export completed with 4,287 modules, 36 assets, and an 8,918,452-byte Hermes
  bundle. That is 6,206 bytes (+0.070%) above the 8,912,246-byte baseline and within the 10% gate.
- A clean ignored Android prebuild produced and installed `com.suman.mangalya.development` alongside
  the preserved `com.suman.wedmaster`. APK/manifest inspection confirms API 24–36, label
  `Mangalya Dev`, `mangalya-development`, current launcher/splash resources,
  `android:allowBackup="false"`, predictive Back, and no packaged camera or microphone permission.
- On the current emulator, fresh setup created an empty workspace, Home loaded, data survived
  process termination, invalid household recovery landed on Guests, and backup export opened the
  Android chooser with one JSON file. The no-DSN build no longer invokes `Sentry.wrap`.
- EAS preview build 3 `74eb2e9f-82d3-4444-8477-9966daea829c` completed from commit `9bc370a`.
  Local artifact inspection verifies a 119,139,677-byte, v2-signed APK with SHA-256
  `b811e96a42c3e716eee9fc3bf194ecfe51e54005cf26b84d860ccdb7a4846729`, package
  `com.suman.mangalya.preview`, scheme `mangalya-preview`, API 24–36, `allowBackup=false`, and no
  packaged camera or microphone permission. Inspection also found the unnecessary
  `SYSTEM_ALERT_WINDOW` permission, so build 3 is not the accepted preview artifact. The config now
  blocks that permission and advances Android version code to 4. A fresh preview prebuild and
  `processReleaseMainManifest` verify the merged release manifest contains none of overlay, camera,
  or microphone permissions. Replacement EAS build 4 `57874f60-9ec5-44c2-9bfe-eef8f54e02fe`
  finished from commit `accd3cd`. Local inspection verifies its v2 signature, version `0.1.0 (4)`,
  expected package/scheme, API 24–36, `allowBackup=false`, release-mode manifest, and absence of
  overlay, camera, and microphone permissions. The 119,139,681-byte APK has SHA-256
  `0066a5db2216e70772ba149c2cac055a244ae333428236e62e32c2c0b55d2e58`. No Android target is
  connected, so installation, launcher/splash rendering, runtime deep links, and physical-device
  behavior remain unverified. Sentry delivery/source maps also remain unverified because the
  preview environment has no Sentry build credentials.

The emulator debug-client smoke above is native identity and behavior evidence. It is not
representative release-performance measurement, a TalkBack pass, or physical-device acceptance.

## Remaining P1 release gates

1. Run all tracked Maestro flows. The CLI is not installed locally and must not be added without
   tooling approval.
2. Profile a preview/release build against cold-start, persistence, expense-save, scrolling, and
   bundle-growth targets in `TESTING.md`.
3. Complete physical Android QA at 360dp and expanded width, portrait/landscape, largest text,
   TalkBack, keyboard/IME, reduced motion, file/share pickers, permission denial, process
   termination, and upgrade install.
4. Install verified preview build 4 and verify launcher/splash rendering, runtime deep links,
   scrubbed Sentry delivery, and source maps.

Public release requires zero unresolved P0/P1 findings and evidence for every gate above. A skipped
or credential-blocked check is recorded as blocked, never as passing.
