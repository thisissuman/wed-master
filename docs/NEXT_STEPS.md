# Next steps

Audit date: 2026-08-11
Last updated: 2026-08-11
Current design baseline: the lavender-and-ivory implementation and its current generated assets.
Legacy green references are historical only and must not be used as active design input.

This is the durable execution tracker for work that is not yet complete. Canonical product,
architecture, UI, testing, and release rules remain in their dedicated documents; this file links
to them instead of duplicating those contracts.

Status values are `Pending`, `In progress`, `Blocked`, and `Done`. Every unfinished item stays
visible. When an item is complete, move it to the dated completion log with its evidence.

## Now — local-beta release gate

| ID    | Priority | Status  | Outcome                                    | Acceptance evidence                                                                                                                                                                                                                                                    | Dependency or blocker                                                                                        | Updated    |
| ----- | -------- | ------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------- |
| LB-03 | P1       | Blocked | Maestro smoke journeys                     | `maestro test .maestro` passes all seven tracked Android flows                                                                                                                                                                                                         | Maestro CLI is not installed; do not add it without tooling approval                                         | 2026-08-01 |
| LB-04 | P1       | Pending | Measured preview performance               | Cold start ≤2.5s; task persistence p95 ≤150ms; expense save p95 ≤300ms; no sustained scrolling below 55 FPS; no unexplained Hermes growth above 10% from 8,912,246 bytes. Production export is currently 8,918,452 bytes (+0.070%); runtime targets remain unmeasured. | Preview/release build and Android profiler on Pixel 4a-class hardware                                        | 2026-08-11 |
| LB-05 | P1       | Pending | Physical Android accessibility/device pass | 360dp, expanded/tablet, portrait/landscape, largest text, TalkBack, keyboard/IME, reduced motion, share picker, permission denial, predictive/hardware Back, process termination, and upgrade install verified                                                         | Emulator setup/restart/deep-link/share checks passed; physical Android phone/tablet access is still required | 2026-08-01 |
| LB-06 | P1       | Blocked | Preview distribution and observability     | Preview APK identifies as `com.suman.mangalya.preview`; signing, deep links, launcher/splash, scrubbed Sentry event, and source maps verified                                                                                                                          | EAS preview build 3 completed; artifact installation plus Sentry credentials/event verification remain       | 2026-08-11 |

## Verification record and external blockers

| Gate                      | Exact command                                                                                                                                                                        | Expected result                                                                      | Current evidence or blocker                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository                | `npm run typecheck && npm run lint && npm test -- --runInBand && npm run format:check`                                                                                               | All checks exit zero                                                                 | Passed on the release checkpoint: 39 suites and 203 tests.                                                                                                       |
| Dependencies              | `npx expo install --check`                                                                                                                                                           | Expo dependencies match SDK 57                                                       | Passed against Expo's bundled local dependency map; the remote well-known-versions endpoint was unavailable in offline mode.                                     |
| Production export         | `APP_VARIANT=production npx expo export --platform android --output-dir <new-temp-directory> --clear`                                                                                | Android Hermes export succeeds and remains within the 10% growth ceiling             | Passed with 4,287 modules, 36 assets, and an 8,918,452-byte Hermes bundle (+0.070%).                                                                             |
| Development native client | `APP_VARIANT=development npx expo prebuild --clean --platform android` then `APP_VARIANT=development ANDROID_HOME=/Users/kira/Library/Android/sdk npx expo run:android --no-bundler` | Current debug client builds and installs without removing the legacy package         | Passed. `com.suman.mangalya.development` and `com.suman.wedmaster` remain installed side by side.                                                                |
| Maestro                   | `maestro test .maestro`                                                                                                                                                              | Seven tracked journeys pass                                                          | Blocked: `maestro` is not installed on this host. The YAML parses successfully, but that is not a semantic or device run.                                        |
| Preview APK               | `npx eas-cli build --platform android --profile preview`                                                                                                                             | Signed installable APK reports `com.suman.mangalya.preview` and `mangalya-preview`   | EAS build 3 `7fffd92f-37b7-4123-b914-36721db6babb` completed; the artifact has not been installed or inspected in this workspace.                                |
| Physical smoke            | `adb -s <physical-device-serial> install -r <preview-apk>`                                                                                                                           | Upgrade preserves data; the full accessibility/device matrix passes on real hardware | Blocked: no physical Android phone or tablet is attached.                                                                                                        |
| Sentry source maps        | `npx sentry-cli sourcemaps explain <event-id>`                                                                                                                                       | A scrubbed preview event resolves to original TypeScript sources                     | Blocked: no DSN, organization, project, auth token, uploaded preview build, or event ID. Sentry remains disabled and the root is not wrapped when no DSN exists. |
| Runtime performance       | `adb -s <physical-device-serial> shell am force-stop com.suman.mangalya.preview` then profile a normal launcher start and fixture-backed saves/scrolling                             | All four runtime targets in LB-04 pass on representative release hardware            | Blocked by the preview APK and representative physical hardware; do not infer these timings from the development client.                                         |

## Next — beta learning and shared-workspace preparation

| ID    | Priority | Status  | Outcome                        | Acceptance evidence                                                                                                                                             | Dependency or blocker                               | Updated    |
| ----- | -------- | ------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------- |
| NX-01 | P2       | Pending | Activation evidence            | Internal families complete wedding → event → task → expense → backup; drop-off and qualitative feedback are recorded without collecting private wedding content | Local-beta release gate and consented research plan | 2026-08-01 |
| NX-02 | P2       | Pending | Auth product decision          | Product Owner chooses email, phone, or another sign-in method using target-family evidence                                                                      | Activation feedback                                 | 2026-08-01 |
| NX-03 | P2       | Pending | First Supabase vertical slice  | Auth plus `weddings`, `wedding_members`, `events`, `tasks`, and invitations; owner/editor/viewer RLS protects every wedding-owned row                           | NX-02 and reviewed SQL migrations                   | 2026-08-01 |
| NX-04 | P2       | Pending | Explicit local-to-cloud import | User previews and confirms one idempotent import; the local workspace remains recoverable until remote success                                                  | NX-03; no implicit bidirectional sync               | 2026-08-01 |

## Later — deliberately deferred

| ID    | Priority | Status  | Outcome                         | Acceptance evidence                                                                                                        | Dependency or blocker            | Updated    |
| ----- | -------- | ------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------- |
| LT-01 | P3       | Pending | Consented product analytics     | Approved event dictionary, consent UX, retention policy, and privacy review                                                | Stable beta funnels              | 2026-08-01 |
| LT-02 | P3       | Pending | Multi-language UI               | Translation architecture plus tested Hindi and one additional target language without layout regressions                   | Stable product copy and research | 2026-08-01 |
| LT-03 | P3       | Pending | Marketplace/payments assessment | Trust, moderation, disputes, compliance, and support model approved before code                                            | Proven planning usage            | 2026-08-01 |
| LT-04 | P3       | Pending | AI assistance assessment        | Useful non-AI baseline, explicit privacy boundary, server-side key handling, evaluation plan, and graceful non-AI fallback | Proven user problem              | 2026-08-01 |
| LT-05 | P3       | Pending | Offline-write decision          | Conflict, ownership, migration, and recovery design approved before any sync queue or local database change                | Real multi-device demand         | 2026-08-01 |

## Completed

### 2026-08-11 — release checkpoint refresh

- The exact worktree passed TypeScript, Expo lint, formatting, `git diff --check`, 39 Jest suites
  and 203 tests, plus Expo's bundled SDK 57 dependency map.
- A clean production Android export completed with 4,287 modules, 36 assets, and an 8,918,452-byte
  Hermes bundle (+0.070% from baseline).
- Maestro setup and backup selectors now match the current setup and compact backup UI. The CLI is
  still unavailable, so no device journey is claimed as passing.
- Sentry privacy scrubbing now covers error and transaction events with focused regression coverage.

### 2026-08-01 — repository hardening implementation

- Fresh installations now route to real local setup; existing v1/v2/v3 migrations and deletion
  tombstones remain supported.
- Android Auto Backup is disabled in Expo configuration and variant/permission contracts have
  focused tests.
- Invalid household links recover to Guests; empty Gifts, Contacts, and Guests use one creation
  action; task titles wrap; backup and guest layouts adapt; expanded windows use a navigation rail.
- A deterministic schema-valid 1,000-guest/500-task/500-expense fixture and seven Maestro flows
  are tracked in the repository.
- The lavender implementation is canonical and obsolete Emergent prompts are archived.
- The final repository gate passed TypeScript, lint, formatting, 38 Jest suites/176 tests, Expo's
  bundled dependency map, and a production Android export. The final Hermes bundle is 8,916,460
  bytes (+0.047% from baseline).

### 2026-08-01 — current Android native identity and emulator smoke

- A clean prebuild generated `com.suman.mangalya.development` with scheme
  `mangalya-development`, `android:allowBackup="false"`, predictive Back enabled, current launcher
  and splash resources, and removal directives that keep camera and microphone out of the packaged
  APK.
- The new package was installed alongside the preserved `com.suman.wedmaster` package. The old app
  and its local data were not uninstalled, cleared, or overwritten.
- Fresh setup, an empty Home workspace, process-restart persistence, invalid-household recovery to
  Guests, backup generation, and the Android share chooser were exercised on the emulator. The
  chooser received `mangalya-data-backup-*.json`.
- Emulator review also removed forced first-field focus, replaced the last absolute device-residency
  onboarding label, made not-found fallback deterministic, and avoided wrapping the root with Sentry
  when no DSN is configured.

## Canonical references

- [Product brief](PRODUCT_BRIEF.md)
- [Architecture](ARCHITECTURE.md)
- [UI system](UI_SYSTEM.md)
- [Engineering guide](ENGINEERING_GUIDE.md)
- [Testing strategy](TESTING.md)
- [Release guide](RELEASE.md)
- [Production readiness](PRODUCTION_READINESS.md)
- [Decisions](DECISIONS.md)
