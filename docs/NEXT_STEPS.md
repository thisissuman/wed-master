# Next steps

Last updated: 2026-09-19

This file tracks unfinished work only. Royal Plum and Lavender Pearl are the current app-wide theme
baseline. Historical results are in
[VERIFICATION_HISTORY_2026-09-05.md](./archive/VERIFICATION_HISTORY_2026-09-05.md), and the latest
signed APK evidence is in [PREVIEW_BUILD_2026-09-11.md](./PREVIEW_BUILD_2026-09-11.md).

Status values are `Pending`, `In progress`, and `Blocked`. Move completed work to the verification
archive or a dated build record instead of growing this tracker.

## Preview 7 phone check

Preview 7 contains the requested contacts, Inspire, task sorting, refund, settings and celebration
changes. The source and passing automated checks are recorded in
[PREVIEW_BUILD_2026-09-18.md](./PREVIEW_BUILD_2026-09-18.md), including the EAS status link.
The Product Owner will monitor the submitted build and report the phone result. Do not treat that
result as passed, poll the cloud build, or start the next product slice before their feedback.
After confirmation, continue with the remaining release gates below.

## Local-beta release gates

| ID    | Priority | Status      | Required outcome                                                                                                                                                                                                                             | Current blocker or remaining evidence                                                                                                                                                                                                    |
| ----- | -------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LB-04 | P1       | In progress | On representative hardware: cold start ≤2.5s, task persistence p95 ≤150ms, expense save p95 ≤300ms, no sustained scrolling below 55 FPS, and no unexplained Hermes growth above 10% from the 7,647,249-byte current-source baseline.         | Build 6 repeatedly started in under one second by observation on a OnePlus 13/Android 16, and the 7,652,325-byte export passes. Instrumented task/expense p95, controlled stress scrolling, and image/memory measurements remain open.   |
| LB-05 | P1       | In progress | Physical Android pass at 360dp and expanded width, portrait/landscape, largest text, TalkBack, keyboard/IME, Reduced Motion, share and photo pickers, permission denial, hardware/predictive Back, process termination, and upgrade install. | Signed Build 6 passed the reported OnePlus 13 phone checklist, including upgrade data retention, TalkBack, largest text, rotation, sharing, Camera denial, offline launch, and Back. A physical expanded-width/tablet pass remains open. |
| LB-06 | P1       | In progress | Verify final rail/layout behavior, launcher/splash, runtime deep links, release signing/permissions, scrubbed Sentry delivery, and source maps on the release candidate.                                                                     | Build 6 signature, identity, packaged manifest, permissions, generated source map, and reported physical phone UI pass. Signed cold deep links and Sentry delivery/upload resolution remain open.                                        |

The current signed Preview APK is version `0.1.0 (6)`, package
`com.suman.mangalya.preview`, scheme `mangalya-preview`, with `allowBackup=false` and intentional
Camera access. It excludes overlay, microphone, legacy-storage, broad-media, and biometric
permissions. Its v2 signature, packaged manifest, OnePlus 13 upgrade data retention, sub-one-second
observed startup, and reported phone checklist pass are recorded in
[PREVIEW_BUILD_2026-09-11.md](./PREVIEW_BUILD_2026-09-11.md). Do not infer the remaining measured
performance, tablet, cold deep-link, or observability results from this evidence.

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
