# Android preview build record — 2026-09-11

This is the current signed Android Preview evidence. It records the exact source, EAS artifact,
static APK inspection, and physical-device results. General build procedures remain in
[RELEASE.md](./RELEASE.md), and unfinished acceptance work remains in
[NEXT_STEPS.md](./NEXT_STEPS.md).

## Source and prebuild gate

- Branch: `codex/ux-simplification-visual-redesign`.
- Source commit: `86adef212e8029f6aebee4cdcc4e24cf4bdf6f72`.
- Commit message: `chore(release): prepare Android preview candidate 6`.
- The commit was pushed to `origin/codex/ux-simplification-visual-redesign`; no push to `main` was
  made.
- TypeScript, Expo lint, all 67 Jest suites and 410 tests, Prettier, `git diff --check`, Expo SDK
  compatibility, and Expo Doctor 21/21 passed.
- The final Android development-client Maestro suite passed all seven tracked flows in 15m 58s.
- A production Android export passed with 2,793 modules, 57 assets, 59 files, and a 7,652,325-byte
  Hermes bundle. A source-map export also passed Sentry's debug-ID check.
- Development, Preview, and production native configuration was generated only in disposable
  directories. Preview and production release-manifest merges passed.

The complete preparatory evidence, including recovered diagnostic-tool failures, deep-link cases,
configuration scans, dependency audit findings, and Sentry limitations, is in
[VERIFICATION_HISTORY_2026-09-05.md](./archive/VERIFICATION_HISTORY_2026-09-05.md#2026-09-11--lb-06-release-configuration-preparation).

## EAS Preview APK

The active Expo account was confirmed as `thisissuman`, and the Preview build was started with:

```bash
npx eas-cli@latest build --platform android --profile preview --wait --non-interactive
```

EAS used the existing remote Android keystore and found no plain-text or sensitive Preview
environment values. `APP_VARIANT=preview` came from `eas.json`; no Sentry credentials were
available.

Result:

- Status: `FINISHED`.
- Build ID: `43e71628-ab8d-4433-8697-113ad56cfc9c`.
- Source commit: `86adef212e8029f6aebee4cdcc4e24cf4bdf6f72`.
- Build page:
  <https://expo.dev/accounts/thisissuman/projects/mangalya/builds/43e71628-ab8d-4433-8697-113ad56cfc9c>.
- Android download:
  <https://expo.dev/artifacts/eas/BfVwq2IiYkR5WtpQLDZqgBcr46X1a6YcJ-lfe1Agofs.apk>.
- Completed: 2026-09-11 11:30:27 IST.
- Artifact expiry reported by EAS: 2026-09-25 11:15:07 IST.

## Signed artifact inspection

The APK was downloaded to temporary local storage and inspected with SHA-256, Android SDK 37
`apksigner`/`aapt2`, and `apkanalyzer`.

- Size: 125,203,502 bytes.
- SHA-256: `1fd0b7c5e275bbb9f6b79e6d420ce117c78c83ef953ce3a8257903a4f59b2742`.
- APK Signature Scheme v2 verifies with one RSA 2048-bit signer.
- Signing certificate SHA-256:
  `dc10d5df3112bda6b84d91cf8e3a56a5d4136a5ce15be21a09b4631690e7b5a8`.
- Package/display name: `com.suman.mangalya.preview` / `Mangalya Preview`.
- Version: `0.1.0 (6)`.
- Minimum/target/compile SDK: 24/36/36.
- Deep-link scheme: only `mangalya-preview`.
- Android backup: `android:allowBackup="false"`.
- Predictive Back: `android:enableOnBackInvokedCallback="true"`.
- Declared uses-permissions: Camera, Internet, Vibrate, network state, and Android's package-scoped
  non-exported dynamic-receiver permission.
- Overlay, microphone, legacy/broad external storage, broad media, and biometric permissions are
  absent.
- File, sharing, image-picker, and crop providers are non-exported. Sentry native auto-init is
  disabled; the app enables its scrubbed runtime integration only when a public DSN exists.

## Physical-device result — 2026-09-13

The Product Owner installed signed Build 6 on a OnePlus 13 running Android 16 and reported:

- Existing data remained after the upgrade installation.
- Every observed startup completed in less than one second. These are user-observed timings rather
  than profiler traces, but they pass the 2.5-second cold-start threshold reported for this device.
- The full requested checklist looked correct. Explicit confirmations covered TalkBack, largest
  text, rotation, backup JSON sharing, expenses CSV sharing, Camera-permission denial, offline
  launch, and Android Back gestures.

This closes the signed-candidate phone checks represented by those observations. It does not supply
instrumented task/expense p95 latency, controlled stress-list frame rates, image/memory profiling,
a physical expanded-width tablet pass, runtime cold deep-link evidence, or Sentry delivery and
uploaded-source-map resolution.

## Remaining release evidence

- Measure task persistence and expense-save p95, controlled stress scrolling, and image/memory
  behavior on representative release hardware using the deterministic stress fixture.
- Complete the physical expanded-width/tablet matrix if tablet support is part of this beta gate.
- Verify cold `mangalya-preview` deep links on the signed APK, including valid, missing, malformed,
  and fallback destinations.
- Configure suitable private Sentry build credentials, send one scrubbed non-sensitive test event,
  and verify its uploaded source map before closing observability. No credential should be committed.

No production build, Play Console upload, publication, or merge to `main` was performed.
