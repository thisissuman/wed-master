# Security and performance audit — local-first baseline

Audit date: 2026-08-12  
Recorded: 2026-08-13  
Scope: current Android-first Expo application before Supabase integration

## Purpose

This document preserves the security and performance audit of the current local-first application.
It is a point-in-time baseline, not approval for a future cloud-enabled release. Re-run the complete
audit after Supabase authentication, schema, migrations, Row Level Security (RLS), Storage, RPCs,
Edge Functions, or remote repositories are implemented, and before that build is distributed.

No audit can guarantee that an application will never be compromised. The goal is to identify
credible risks, reduce attack surface, verify controls, and make unverified assumptions explicit.

## Executive result

The current application has very little remote attack surface. The audit found no application API
endpoints, active Supabase table/RPC/Storage/Realtime calls, database migrations, authentication
flow, WebView, or arbitrary outbound network handling. The working persistence authority is one
device-local workspace snapshot in AsyncStorage plus app-owned media and export files.

No active Critical remote vulnerability was confirmed. Public release should nevertheless remain
unapproved until the current security findings and the documented physical-device/release gates
are resolved. The largest performance risk is whole-workspace persistence: every small edit clones,
validates, serializes, and rewrites the complete workspace. The clearest screen-level bottleneck is
event detail, which eagerly renders every linked task and expense in a `ScrollView`.

## Reviewed surface

- All 33 Expo Router route and layout files, covering onboarding, Home, Plan, Money, More, events,
  tasks, expenses, guests, gifts, emergency contacts, backup/import/export, and settings.
- Local repositories, AsyncStorage migrations, workspace schema, import/export, document and image
  handling, deep-link configuration, Sentry scrubbing, environment handling, and Android release
  configuration.
- Package manifest and lockfile, live npm advisory output, bundle/source-map composition, fonts,
  list implementations, selectors, React Query cache usage, and the deterministic stress fixture.
- Database and endpoint usage. No current application database or server endpoint implementation
  exists; the Supabase client is a dormant future boundary.

There are no Phoenix LiveViews in this project. The performance review covered the equivalent Expo
Router screens, React Native view trees, list components, hooks, and feature modules.

## Security findings

### High — onboarding can replace an existing workspace

Both app and onboarding groups are always registered in `src/app/_layout.tsx`. The onboarding group
does not redirect when a valid workspace already exists. `LocalSetupScreen` submits a new workspace
unconditionally, and `LocalWorkspaceStore.create()` overwrites the current v4 snapshot without
checking that the store is empty.

The app also exposes a custom URL scheme. Installed deep-link reachability for the onboarding group
was not available for verification, so this audit does not claim a proven one-click exploit.
Nevertheless, the repository permits destructive replacement without a replacement warning.

Required remediation:

- Redirect onboarding when a valid workspace exists.
- Make `create()` compare-and-set into an empty state only.
- Reserve replacement for explicitly confirmed import/reset operations.
- Add a regression test for an onboarding deep link when a workspace exists.

Evidence:

- `src/app/_layout.tsx:47`
- `src/app/(onboarding)/_layout.tsx:3`
- `src/features/workspace/setup/LocalSetupScreen.tsx:67`
- `src/features/workspace/local-repositories.ts:85`
- `app.config.ts:20`

### Medium — sensitive workspace information is unencrypted at rest

The complete workspace is serialized directly into AsyncStorage. It contains wedding and guest
names, telephone numbers, budgets, expenses, gifts, schedules, and notes. Attachments, cover photos,
and exports are stored in app-owned document storage.

Android application sandboxing and `android.allowBackup: false` reduce exposure to ordinary apps
and cloud backup, but they do not protect against a rooted or otherwise compromised device,
forensic extraction, an insecure debug environment, or someone using an unlocked device.

Required decision and remediation:

- Document the intended device-compromise and shared-device threat model.
- If application-level confidentiality is required, use authenticated snapshot/database encryption
  with a random key protected by Android Keystore/SecureStore.
- Consider an optional biometric/app lock and recent-app-screen masking.
- Do not store the complete JSON snapshot in SecureStore; it is intended for small secrets.

Evidence:

- `src/features/workspace/local-repositories.ts:19`
- `src/features/workspace/local-repositories.ts:174`
- `src/features/workspace/files/workspace-files.ts:21`
- `app.config.ts:49`

### Medium — CSV formula injection

`csvCell()` quotes fields and escapes quotation marks but does not neutralize spreadsheet formula
prefixes. User-entered or imported titles, notes, names, responsible people, categories, and
attachment names are written into reader-facing CSV files. Spreadsheet software can interpret
values beginning with `=`, `+`, `-`, or `@` as formulas despite CSV quoting.

Required remediation:

- Neutralize formula-triggering first effective characters in the export representation, including
  after leading whitespace, tabs, carriage returns, line feeds, and relevant Unicode variants.
- Preserve the original value in application data.
- Add focused Excel, Google Sheets, and LibreOffice-oriented test cases.

Evidence:

- `src/features/workspace/backup/backup-data.ts:61`
- `src/features/workspace/backup/backup-data.ts:74`
- `src/features/workspace/backup/BackupDashboard.tsx:149`

Reference: <https://owasp.org/www-community/attacks/CSV_Injection>

### Medium — backup size validation can occur after an unbounded read

The picker pre-check treats missing size metadata as zero, then reads the complete selected JSON file
into JavaScript memory. The authoritative 5 MB text check runs only after that allocation. Because a
document provider may omit size metadata, a user-selected oversized or malicious file could freeze
or crash the app before validation.

Required remediation:

- Inspect the copied `File.size` before calling `text()`.
- Reject missing, unreadable, or oversized files before allocation.
- Retain the post-read byte check as defense in depth and use a bounded read if supported.

Evidence:

- `src/features/workspace/files/workspace-files.ts:250`
- `src/features/workspace/backup/backup-data.ts:39`

Reference: <https://docs.expo.dev/versions/latest/sdk/document-picker/>

### Medium — vulnerable dependency/build chain

A live npm audit reported 29 dependency entries: 20 High, 9 Moderate, and 0 Critical. The underlying
packages included `brace-expansion`, `image-size`, `js-yaml`, `nanoid`, `postcss`, and `uuid`.

The advisory paths run primarily through Metro, Expo configuration, lint/test, CSS processing, and
native build tooling. No released application route was found to invoke the vulnerable Node
operations, so these counts are principally supply-chain and CI/build risk, not evidence of 29
remotely exploitable mobile vulnerabilities.

Required remediation:

- Upgrade through Expo-compatible patched releases or carefully reviewed overrides.
- Do not run `npm audit fix --force`; the suggested graph included incompatible Expo/React Native
  changes.
- Add a reviewed CI dependency gate with justified, owner-assigned, expiring exceptions.
- Re-run the audit against the exact lockfile used for each release.

Representative references:

- <https://github.com/advisories/GHSA-w3rx-r6r6-pgpr>
- <https://github.com/advisories/GHSA-r28c-9q8g-f849>

### Low — deletion can report success while stale snapshots remain

Workspace deletion establishes an authoritative empty tombstone, but uses `Promise.allSettled` for
legacy/current key removal and does not surface individual failures. Storage failures can therefore
leave recoverable plaintext values after the UI follows its success path.

Required remediation:

- Verify every key and file removal and clearly report/retry failures.
- Remove obsolete migration keys after a deliberate rollback window.
- If encrypted storage is adopted, use encryption-key destruction for stronger erasure semantics.

Evidence:

- `src/features/workspace/local-repositories.ts:19`
- `src/features/workspace/local-repositories.ts:99`
- `src/features/workspace/settings/WeddingSettingsDashboard.tsx:387`

## Supabase and future endpoint release blockers

The following are conditional rather than currently exploitable because no cloud backend exists.
They become mandatory release gates as soon as Supabase is integrated.

### Authorization and database controls

- Version-control all SQL migrations.
- Enable and verify RLS for every exposed table, view, Storage bucket, and applicable RPC.
- Make `wedding_members` the authorization boundary; never rely only on client filters.
- Test owner/editor/viewer/non-member behavior using at least two users and two weddings.
- Review grants, foreign keys, ownership transfer, invitation redemption, RPC execution privileges,
  `search_path`, Storage policies, and indexes supporting policy predicates.
- Use server-side pagination, filtering, ordering, bounded projections, and aggregate queries. Do
  not reproduce the local “load the entire workspace” model over the network.

Reference: <https://supabase.com/docs/guides/database/postgres/row-level-security>

### Authentication, cache, secrets, and abuse controls

- Partition React Query keys by authenticated user and wedding, and clear account-derived state on
  sign-out/session change. The current `['local-workspace']` key is not safe for account switching.
- Test session restoration, refresh, expiry, revocation, password recovery, deep-link/PKCE state,
  and exact redirect allowlists.
- Reject `sb_secret_` and legacy `service_role` credentials in app-exposed environment variables,
  and scan built artifacts for secrets. Only publishable/anon configuration may ship in the client.
- Rate-limit authentication, invitation creation/redemption, imports, Edge Functions, AI, payments,
  admin operations, and other costly or abusable endpoints. Apply identity/IP limits, payload caps,
  idempotency, and CAPTCHA where appropriate.
- Re-audit live Supabase Auth, RLS, grants, Storage, functions, project configuration, Security
  Advisor output, SMTP/CAPTCHA, and logs—not only repository code.

Evidence for the current future boundary:

- `src/lib/supabase/client.ts:34`
- `src/lib/supabase/environment.ts:18`
- `src/features/workspace/provider.tsx:12`

## Security controls that were healthy

- No committed secret or likely credential was found in the tracked tree or keyword-based Git
  history scan; real `.env` files are ignored. No entropy scanner was available, so this is not a
  guarantee that history has never contained a secret.
- The dormant Supabase client stores sessions in SecureStore, disables URL session detection, uses
  `processLock`, and manages foreground token refresh.
- Workspace and backup schemas are strict, bounded, validate dates and references, and reject
  unknown structure before persistence.
- Imported structured backups exclude attachment and cover-photo file references.
- No WebView, dynamic evaluation, dangerous HTML injection, arbitrary HTTP fetch, or active remote
  database operation was found.
- Sentry disables default PII and scrubs user, request, context, breadcrumb, extra, phone, money, and
  local-path information.
- Android Auto Backup is disabled; overlay, camera, and microphone permissions are absent from the
  inspected merged release manifest.

## Performance findings

### Highest overall risk — every mutation rewrites the complete workspace

`LocalWorkspaceStore` deep-copies with `JSON.stringify`/`JSON.parse`. Each update obtains a detached
complete snapshot, mutates it, clones and validates the complete schema, writes the complete JSON
value to AsyncStorage, updates the cache, and returns another complete clone. Startup similarly
reads, parses, validates, and copies the whole value. Operations are serialized, so slow writes
queue behind one another.

The existing deterministic fixture contains 1,000 households, 500 tasks, and 500 expenses. A host
benchmark produced:

- Serialized snapshot: 478,593 bytes.
- Complete in-memory store update: 30.7 ms median and 45.62 ms p95 over 20 runs.
- Full Zod parse: 13.4 ms median and 34.14 ms p95.

These are directional lower bounds. They exclude Android bridge/disk cost, lower-end mobile CPU,
garbage collection, cache propagation, and React rendering.

The schema permits 10,000 records in each collection and 20,000-character fields. The live snapshot
has no byte-size guard. The installed AsyncStorage Android configuration defaults to a 6 MB database,
and retained migration values share that budget.

Required remediation:

- Instrument serialized workspace size and persistence latency immediately, with warning and hard
  limits that retain safe storage headroom.
- Partition persistence by collection/entity while preserving persist-before-publish behavior.
- Validate changed entities and affected references on hot writes; retain complete validation for
  startup, import, migration, and explicit integrity checks.
- Consider a normalized local database when measured scale justifies the recorded architecture
  decision.
- Measure task-toggle and expense-save p95 on a release Hermes build and representative low-end
  Android hardware.

Evidence:

- `src/features/workspace/local-repositories.ts:26`
- `src/features/workspace/local-repositories.ts:73`
- `src/features/workspace/local-repositories.ts:174`
- `src/features/workspace/workspace-schema.ts:30`
- `src/features/workspace/testing/stress-fixture.ts:10`

Reference: <https://react-native-async-storage.github.io/2.0/advanced/IncreaseDbSize/>

### Highest screen-level risk — event detail eagerly mounts unbounded rows

Event detail filters its linked tasks and expenses, places the complete screen inside a `ScrollView`,
and maps every matching record. Each task row also owns animated state. The stress fixture associates
all 500 tasks with one event, which can create hundreds of native/animated rows at route open.

Required remediation:

- Replace the eager tree with one heterogeneous virtualized `FlashList`/section model, or bounded
  previews with “View all” routes.
- Profile route-open latency, memory, JS/UI frames, and interaction readiness with 500 linked tasks
  and separately with hundreds of linked expenses.

Evidence:

- `src/features/workspace/details/EventDetailDashboard.tsx:125`
- `src/features/workspace/details/EventDetailDashboard.tsx:154`
- `src/features/workspace/details/EventDetailDashboard.tsx:202`
- `src/features/workspace/details/EventDetailDashboard.tsx:248`
- `src/features/workspace/TaskCompletionRow.tsx:190`

### Medium — whole-workspace cache invalidation

The complete workspace is stored under one React Query key, and successful mutations replace the
top-level value. There are 26 `useWorkspace()` call sites across 23 files. Mounted screens observing
the full result may update after unrelated mutations; new snapshot identities also weaken existing
row memoization.

Recommended remediation:

- Add selector hooks so screens observe only the wedding or collections they require.
- Partition query keys alongside persistence.
- Profile render counts after visiting every tab and toggling one task.
- Evaluate `freezeOnBlur` only after confirming navigation and accessibility behavior.

Evidence:

- `src/features/workspace/provider.tsx:12`
- `src/features/workspace/provider.tsx:34`
- `src/features/workspace/plan/PlanTaskView.tsx:243`

### Medium — broad bundle and startup graph

The inspected Android bundle was 7,038,628 bytes with 4,269 mapped modules. It included 1,746 Lucide
icon modules and 386 Sentry modules; no Supabase modules were bundled. All 47 Lucide import sites use
the package root. The application also blocks its initial UI on six local fonts, and the generated
Android resources included an unexpected 956,416-byte Material Symbols font.

Recommended remediation:

- Replace runtime Lucide barrel imports with supported per-icon subpath imports, then compare module
  count and Hermes bytecode using Expo Atlas.
- Replace broad feature/UI barrel imports on startup paths with narrow module entrypoints.
- Identify why Material Symbols is included and remove it if it is not required.
- Keep production observability, but measure Sentry initialization/startup contribution before
  changing it.
- Review font weights/subsetting only with design and language coverage preserved.

Evidence:

- `src/app/_layout.tsx:3`
- `src/app/(app)/(tabs)/_layout.tsx:2`
- `src/lib/observability/sentry.ts:1`
- `src/providers/app-providers.tsx:5`
- `src/features/workspace/index.ts:1`

Reference: <https://docs.expo.dev/guides/analyzing-bundles/>

### Other performance opportunities

- Expense suggestions copy and sort full expense history as the user types. Precompute a normalized,
  recency-ordered title index when expenses change and query a bounded index with deferred input.
- Budget overview scans/sorts expense data multiple times. Combine aggregates after the persistence
  bottleneck is addressed.
- Guests recompute summary data on every search keystroke; memoize it by household collection.
- Fixed `Intl.DateTimeFormat` and `Intl.NumberFormat` instances are created in row paths; cache them
  at module scope.
- Cover photos may be 15 MB without an explicit pixel-dimension limit. Profile maximum-size
  JPEG/HEIC decode memory and resize/compress at ingestion if measured peaks are excessive.
- Memoized list rows receive some new callback/object props. Stabilize these only where render
  profiling demonstrates value.

## Healthy performance patterns

- Growing top-level collections generally use FlashList.
- Guest search uses `useDeferredValue` and memoized filtering.
- Plan filters, sorting, maps, and summaries are generally memoized.
- Only the active Tasks or Events view mounts in Plan.
- Expo Image is used for covers.
- Reanimated handles UI motion; no perpetual animation loop or background timer was found.
- Zustand consumers use narrow selectors.
- Storage operations are serialized and persisted before query state is published.
- Attachments remain separate files rather than inflating the JSON snapshot.
- No current request waterfalls, polling, realtime traffic, N+1 database queries, or background
  network/battery issue exists because there is no active backend.

## Recommended implementation order

1. Guard onboarding and make workspace creation non-destructive.
2. Fix CSV formula handling and pre-read backup sizing.
3. Make deletion verification authoritative and user-visible.
4. Establish an Expo-compatible dependency remediation/exception policy.
5. Instrument workspace size and persistence duration, then partition whole-snapshot persistence.
6. Virtualize event detail.
7. Decide the local encryption and app-lock threat model.
8. Inspect the corrected signed APK and complete physical-device deep-link, import, memory,
   persistence, scrolling, accessibility, and Sentry tests.
9. After Supabase integration, re-run this entire audit and block cloud release until database,
   authorization, endpoint, abuse, cache-isolation, secret, and query-performance findings pass.

## Verification completed

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test -- --runInBand` passed: 39 suites and 203 tests.
- `git diff --check` passed before this report was recorded.
- The stress fixture schema test passed.
- Expo dependencies matched the bundled SDK 57 map; the remote compatibility map was unavailable.
- A production Android export and bundle inventory completed.
- The working tree was clean before documentation changes.

## Unverified and future evidence

- Accepted signed replacement APK inspection and installation.
- Physical Android CPU, memory, React render, cold-start, persistence, and FPS traces.
- Installed deep-link behavior and share/import behavior.
- Live Sentry delivery and source-map resolution.
- Live Supabase Auth, schema, RLS, grants, Storage, RPCs, functions, rate limits, logs, and Security
  Advisor results.
- Entropy-based secret scanning; only tracked-tree and Git-history keyword checks were available.

The runtime targets remain those in `docs/TESTING.md`: cold start at most 2.5 seconds, task
persistence p95 at most 150 ms, expense save p95 at most 300 ms, and no sustained scrolling below
55 FPS on representative release hardware.

## Required future re-audit trigger

Re-run the original full-project security and performance request after the first complete Supabase
vertical slice and before cloud-enabled beta distribution. The new audit must compare against this
baseline and include at least:

- Every Expo route, repository method, endpoint, RPC, Edge Function, Storage operation, and database
  query.
- Authentication lifecycle, deep links, cache isolation, client-exposed configuration, secret
  scanning, RLS/grants/policy tests, invitation abuse, rate limiting, validation, and dependency
  advisories.
- Query plans and indexes, pagination/projections, network waterfalls, payload sizes, React render
  profiles, release-device cold start, save latency, memory, and scrolling FPS.
- Two-user/two-wedding negative authorization tests and evidence from the live Supabase project.

The Supabase-enabled audit replaces neither this historical record nor its local security findings;
it adds the remote authorization, endpoint, database, and network surface that does not exist today.
