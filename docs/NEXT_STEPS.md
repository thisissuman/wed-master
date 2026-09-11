# Next steps

Last updated: 2026-09-11

This file tracks unfinished work only. Royal Plum and Lavender Pearl are the current app-wide theme
baseline. Historical results are in
[VERIFICATION_HISTORY_2026-09-05.md](./archive/VERIFICATION_HISTORY_2026-09-05.md), and the latest
signed APK evidence is in [PREVIEW_BUILD_2026-09-05.md](./PREVIEW_BUILD_2026-09-05.md).

Status values are `Pending`, `In progress`, and `Blocked`. Move completed work to the verification
archive or a dated build record instead of growing this tracker.

## Local-beta release gates

| ID    | Priority | Status      | Required outcome                                                                                                                                                                                                                             | Current blocker or remaining evidence                                                                                                                                                                                                                             |
| ----- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LB-04 | P1       | In progress | On representative hardware: cold start ≤2.5s, task persistence p95 ≤150ms, expense save p95 ≤300ms, no sustained scrolling below 55 FPS, and no unexplained Hermes growth above 10% from the 7,647,249-byte current-source baseline.         | Host diagnostics and the 7,652,325-byte current production export pass the preparatory checks. Signed-candidate task/expense latency, controlled stress scrolling, image memory, and representative-device measurements remain open.                              |
| LB-05 | P1       | In progress | Physical Android pass at 360dp and expanded width, portrait/landscape, largest text, TalkBack, keyboard/IME, Reduced Motion, share and photo pickers, permission denial, hardware/predictive Back, process termination, and upgrade install. | API 37 emulator preparation and all seven tracked journeys pass. A physical phone/tablet, exact signed candidate, upgrade install, and signed-APK checks remain required.                                                                                         |
| LB-06 | P1       | In progress | Verify final rail/layout behavior, launcher/splash, runtime deep links, release signing/permissions, scrubbed Sentry delivery, and source maps on the release candidate.                                                                     | Candidate-6 configuration, disposable manifests/assets, development-client deep links, source-map generation, and 7/7 journeys pass. Signed-candidate signing, launcher/splash, cold deep links, physical UI, Sentry delivery, and source-map upload remain open. |

The current signed Preview APK is version `0.1.0 (5)`, package
`com.suman.mangalya.preview`, scheme `mangalya-preview`, with `allowBackup=false` and intentional
Camera access. It excludes overlay, microphone, legacy-storage, broad-media, and biometric
permissions. Do not infer the remaining physical-device or observability results from this static
inspection. Current source is prepared for candidate version `0.1.0 (6)`; no signed build 6 exists.

## Beta learning and shared workspace

| ID    | Priority | Status  | Required outcome                                                                                                                                                                                                            | Dependency                                                                                                       |
| ----- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| NX-01 | P2       | Pending | Internal families complete wedding → event → task → expense → backup; record drop-off and qualitative feedback without collecting private wedding content.                                                                  | Local-beta release gates and a consented research plan.                                                          |
| NX-02 | P2       | Pending | Choose email, phone, or another sign-in method using target-family evidence.                                                                                                                                                | Activation feedback.                                                                                             |
| NX-03 | P2       | Pending | Add Auth plus `weddings`, `wedding_members`, `events`, `tasks`, and invitations; owner/editor/viewer RLS protects every wedding-owned row.                                                                                  | NX-02 and reviewed SQL migrations.                                                                               |
| NX-04 | P2       | Pending | Provide a previewed, confirmed, idempotent local-to-cloud import while preserving the local workspace until remote success.                                                                                                 | NX-03; no implicit bidirectional sync.                                                                           |
| NX-05 | P1       | Pending | Re-run security and performance review across Auth, RLS/grants, Storage, RPC/functions, validation, secrets, dependencies, query plans, network, rendering, and a representative signed build; resolve every P0/P1 finding. | First complete Supabase slice; compare with [the local-first audit](./SECURITY_PERFORMANCE_AUDIT_2026-08-12.md). |

## Deliberately deferred

| ID    | Priority | Status  | Required decision                                                                                                            | Dependency                        |
| ----- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| LT-01 | P3       | Pending | Approve consent UX, event dictionary, retention policy, and privacy review before product analytics.                         | Stable beta funnels.              |
| LT-02 | P3       | Pending | Add translation architecture and test Hindi plus one target language without layout regressions.                             | Stable product copy and research. |
| LT-03 | P3       | Pending | Approve trust, moderation, disputes, compliance, and support before marketplace/payments.                                    | Proven planning usage.            |
| LT-04 | P3       | Pending | Define the user problem, privacy boundary, server-side key handling, evaluation, and graceful fallback before AI assistance. | Proven non-AI baseline.           |
| LT-05 | P3       | Pending | Approve conflict, ownership, migration, and recovery design before any offline-write sync queue or local database change.    | Real multi-device demand.         |

Use [TESTING.md](./TESTING.md) for acceptance procedures and [RELEASE.md](./RELEASE.md) for build and
distribution commands.
