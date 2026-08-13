# Architecture

## System boundary

Mangalya is currently a local-first modular Expo application. This is a deliberate **modular monolith**, not a throwaway prototype: feature boundaries, typed data contracts, and a stable navigation shell make a later RLS-protected Supabase implementation additive rather than a rewrite.

```text
Expo mobile / universal client
  ├── Expo Router navigation
  ├── NativeWind v4 design system and UI primitives
  ├── feature modules + validated repository contracts
  ├── TanStack Query workspace cache
  └── LocalWorkspaceStore
        ├── serialized, persist-first AsyncStorage snapshots
        ├── app-owned cover, attachment, and export files
        └── versioned backup/migration/recovery boundaries
```

The current release has one private device-local authority, so it needs neither a network connection nor a sync queue. The retained Supabase boundary is for a future shared-data implementation, where RLS must authorize every wedding-owned row. Local and remote stores must never be combined into an implicit conflict-prone sync engine.

A missing v1/v2/v3/v4 snapshot is an intentional empty-workspace state and routes to local setup. Demo data is never an implicit production fallback. Android Auto Backup is disabled; explicit data-only export is the supported backup contract.

Use an Expo development build as the normal local runtime once the application is scaffolded. Expo Go is useful for quick experiments, but a development build exercises the native dependency set that the production app actually ships.

## Implemented foundation

- `src/app` contains local onboarding, app-stack details/forms, a four-tab workspace shell, recovery gating, and nested More routes. There is no public auth placeholder.
- `src/providers` composes Query, repositories, safe-area, and global feedback boundaries without storing workspace records in Context.
- `src/lib/supabase` validates public environment values and uses SecureStore-backed session persistence; it performs no schema or remote setup.
- `src/theme/tokens.json` is the shared token source consumed by TypeScript and `tailwind.config.js`.
- `src/components/ui` contains domain-neutral primitives. The local workspace feature owns planner, money, people, backup, and settings presentation and behavior.
- The workspace uses a warm ivory-and-lavender semantic base with selective deep-plum night surfaces for navigation and high-information wedding/money summaries; it is not an app-wide dark mode. Root layouts own light system chrome with dark status-bar content, platform-default detail transitions, reduced-motion-aware sheets/modals, and an adaptive four-destination shell: bottom navigation on compact windows and a left material rail at 600dp and above.
- Home composes feature-owned wedding-summary and budget sections with restrained code-native ornament; its wedding profile includes an optional backup-safe keepsake message rendered by the dependency-free Reanimated focus/flip interaction. Home, Plan, and event detail reuse the feature-owned `TaskCompletionRow` completion contract.

## Future expansion without premature infrastructure

- **iOS and web:** retain Expo-compatible APIs and responsive layouts.
- **Admin dashboard:** build a separate Next.js app when admin workflows become real; consume the same database contracts or a dedicated API boundary.
- **Marketplace and AI:** add Edge Functions or a dedicated backend service only when privileged workflows, provider integrations, moderation, or rate limiting require it.
- **Monorepo:** wait until mobile and another deployed app have enough shared domain/UI code to justify a npm workspace. Do not create one now.

## Data model direction

```text
profiles ──< wedding_members >── weddings
                                  ├── events ──< tasks
                                  ├── budget_categories ──< expenses
                                  ├── vendors ──< vendor_payments       (v1)
                                  ├── households ──< guests             (v1)
                                  ├── documents                         (v1)
                                  └── activity_entries                  (v1)
```

### Conventions

- Plural `snake_case` database tables; UUID primary keys.
- Wedding-owned rows carry `wedding_id`, `created_at`, `updated_at`, and `created_by` where relevant.
- `wedding_members` is the authorization boundary. Begin with owner/editor/viewer roles.
- Use INR integer paise and database `date` values. Do not introduce time zones, multi-currency, event sourcing, or generic workflow engines before demand exists.
- Compute summaries from source records before considering stored aggregates.

## Current and target folder structure

The current local beta intentionally keeps the complete vertical slice under `src/features/workspace`, with small supporting `feedback` and observability modules. The structure below is the **target for the first authenticated remote slice**, not a claim about the present tree. Split the local module only when independently deployed data ownership makes those boundaries real.

```text
src/
  app/                         Expo Router routes, layouts, and route guards
  features/
    wedding/
      api/                     feature-scoped query and mutation functions
      components/              wedding-specific UI
      hooks/                   feature orchestration hooks
      schemas/                 validation at feature boundaries
      types.ts                 feature-owned domain types
      index.ts                 feature public API
    events/
    tasks/
    budget/
  components/
    ui/                        reusable visual primitives and variants
  providers/                   app-wide providers only
  lib/
    supabase/                  client and generated database types
    money/                     INR parsing, arithmetic, formatting
    dates/                     date-only rules and formatting
    errors/                    user-safe error normalization
  theme/                       tokens and NativeWind theme mapping
  types/                       truly cross-feature types only
  test/                        shared test utilities and factories
```

### Ownership and dependency direction

```text
app routes → features → components/ui + lib + theme
features   → their own internals + public APIs of other features
components/ui → theme only
lib        → external SDKs and pure utilities
```

- Routes never contain database calls, money calculations, or reusable component logic.
- Features do not reach into another feature's internal folders; import only its `index.ts` public API.
- `components/ui` never imports a feature.
- `lib` does not import screens or feature components.
- Tests live alongside the code they verify; `src/test` contains only shared setup/factories.

### Anti-patterns

- Global `services`, `helpers`, `hooks`, or `constants` dumping folders
- Feature-specific cards inside `components/ui`
- Deep imports across feature internals
- Database types manually duplicated in multiple features
- Reusable component props that become a list of boolean flags

## Component architecture

```text
Application
  → Route screen
    → Feature section
      → Feature component
        → Reusable component
          → UI primitive
            → Design tokens
```

Each layer owns one concern: routes compose navigation, sections arrange a screen, feature components express domain behavior, reusable components package repeatable patterns, primitives define accessible visual contracts, and tokens define appearance. Move code downward only when it is truly reusable without domain knowledge.

## Package catalogue

Install Foundation packages together when scaffolding; their classification establishes standards, not a mandate to use every API on the first screen. Use `npm` and `npx expo install` for Expo-compatible versions.

| Package                                                    | Purpose and rationale                                             | Alternative / tradeoff                                                                 | Timing                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- |
| Expo, React Native, TypeScript, Expo Router                | universal native client with stable file-based navigation         | native Kotlin/Swift offers more control but raises delivery cost                       | Foundation                                    |
| `@supabase/supabase-js`                                    | Auth, Postgres, RLS, Storage, Realtime path                       | Firebase is less aligned with relational finance/workspace data                        | Foundation                                    |
| `@tanstack/react-query`                                    | server cache, mutations, retries, invalidation                    | direct effects create inconsistent loading and cache behavior                          | Foundation                                    |
| `react-hook-form` + `zod`                                  | scalable, typed mobile forms and input validation                 | hand-managed form state becomes repetitive and error-prone                             | Foundation                                    |
| `zustand`                                                  | small explicit global client-state boundary                       | Context is adequate for providers but weak for evolving app UI state                   | Foundation; use sparingly                     |
| NativeWind v4                                              | stable Tailwind workflow and token-friendly UI speed              | StyleSheet is simpler but slower for a Tailwind-fluent product team; v5 is pre-release | Foundation                                    |
| `react-native-reanimated`                                  | performant, reduced-motion-aware press and layout transitions     | React Native Animated is less capable for shared UI-thread interactions                | Foundation                                    |
| `@shopify/flash-list`                                      | scalable task, vendor, and guest lists                            | FlatList is fine for tiny lists but creates migration churn later                      | Foundation                                    |
| `expo-image`                                               | performant cross-platform image rendering and caching             | React Native Image has fewer caching/transition controls                               | Foundation                                    |
| `expo-image-picker` + `expo-linear-gradient`               | local wedding-cover selection and code-native hero depth          | covers remain device-local; gradients avoid a blur or image-editing dependency         | Implemented Home phase 1                      |
| `expo-haptics`                                             | meaningful tactile confirmation on supported devices              | no dependency means less native feedback                                               | Foundation; use rarely                        |
| `lucide-react-native` + `react-native-svg`                 | consistent accessible icon system                                 | emoji/platform icons are inconsistent                                                  | Foundation                                    |
| `expo-secure-store`                                        | encrypted token/small-secret persistence                          | AsyncStorage and MMKV are not a secure token store                                     | Foundation                                    |
| `@sentry/react-native`                                     | opt-in release health with aggressive privacy scrubbing           | console logs are not production observability                                          | Initialized only when DSN is present          |
| Jest + React Native Testing Library                        | domain and component confidence                                   | snapshots alone do not test behavior                                                   | Foundation dev tooling                        |
| Maestro                                                    | realistic mobile smoke journeys                                   | unit tests cannot validate navigation/device behavior                                  | Local-beta flows tracked; runner gate pending |
| MMKV                                                       | fast non-sensitive local key/value persistence                    | unnecessary before a proven low-latency persistence need; never use for tokens or sync | Later                                         |
| `expo-notifications`                                       | task reminders                                                    | requires stable task model and permission UX                                           | V1                                            |
| `expo-document-picker`, `expo-file-system`, `expo-sharing` | local receipt/document selection plus data backup and CSV sharing | attachment bytes remain device-local and are excluded from structured backups          | Implemented local workspace                   |
| `expo-localization` + i18n library                         | multi-language support                                            | adding translations before content stabilizes creates churn                            | V2                                            |
| PostHog or equivalent                                      | consented product analytics                                       | analytics before privacy/event design creates noisy data                               | Beta                                          |
| Moti, Skia, Lottie, Blur                                   | optional visual polish                                            | duplicate abstractions or decorative cost                                              | Later only with approved design need          |
| `expo-av`                                                  | legacy media API                                                  | deprecated; use `expo-audio`/`expo-video` if required                                  | Never                                         |

Do not add Redux, MobX, Firebase, Axios, Moment, NativeBase, React Native Paper, React Native Elements, SQLite sync, custom native modules, microservices, or an AI SDK to the client foundation.

## Environment contract

The optional public runtime values are:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_SENTRY_DSN
```

They are public client configuration values, not secrets. Sentry source-map upload uses private `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` build values without the public prefix. Never add a service-role key or provider secret to app-exposed values. Generate Supabase database types only after the first schema exists; until then, the client intentionally has no application-table contract.

# Local workspace

The current product slice is deliberately local-first. `src/features/workspace` owns wedding, event, task, budget-category, expense, household/guest, gift, emergency-contact, and backup-history contracts. Screens use `useWorkspace` and `useWorkspaceMutation`; they never access AsyncStorage or Supabase directly.

`LocalWorkspaceStore` persists `WorkspaceSnapshot` version 4 at `@wed-master/local-workspace/v4`. Every operation is serialized. A mutation validates a detached candidate, persists it, and only then commits the in-memory cache, so concurrent writes cannot overwrite one another and a failed write cannot leak unpersisted state. When v4 is absent it reads the v3, v2, and then v1 keys, migrates safely, and writes v4 without deleting previous keys.

Workspace v3 gives every expense a repository-generated `createdAt` timestamp and every budget category a typed icon plus archived/selectable state. New workspaces receive the seven stable Event, Task, Shopping, Commute, Gift, Advance, and Other categories. Migration preserves historical category IDs and expense metadata, archives legacy categories from manual selection, adds the core categories, and generates deterministic legacy timestamps from array order. Planned/payment/due/vendor/event fields remain optional compatibility data and are neither exposed nor written by quick capture.

Workspace v4 adds stable optional starter-event keys and household-level RSVP. The setup and Plan choosers create only user-selected suggestions, derive editable dates from the wedding date, and prevent duplicates by key plus normalized cultural aliases. Migration derives Confirmed or Declined only when every legacy named guest agrees; empty, pending, and mixed households become Pending. Legacy guest names, event required-item counters, event-cover references, task checklists/attachments, and gift follow-up metadata remain readable and exportable but are not exposed by the active UI.

Expense creation has a dedicated mutation contract returning `{ expense, snapshot }`, so the post-save details step receives the exact created ID while TanStack Query installs the persisted snapshot. Pure selectors own title-suggestion ranking, creation-recency ordering, category grouping, target/spent/pending arithmetic, date-range filtering, daily aggregation, and bounded trend sampling. The `/budget` Money tab owns the virtualized recent-expense list, while `/budget/overview` owns the target editor and responsive trend. The overview uses the existing SVG and Reanimated stack; it does not add a chart dependency.

Startup and import validate strict shapes, record limits, globally unique IDs, references, date/time relationships, checklist counts, and applicable legacy payment invariants. Structured backup envelopes are strict and capped at 5 MB. Invalid or corrupted input is never installed. Corrupted startup data offers export of the original bytes, import of a valid backup, or explicit deletion before returning to setup; it never creates demo data.

Task/receipt attachments plus the optional wedding cover photo are copied into app-owned document storage and referenced by metadata from the snapshot. The wedding picker uses the native 16:9 crop editor without adding a resize dependency. A new cover is persisted before the previous app-owned file is removed; failed persistence removes the new copy and leaves the old reference intact. Legacy event-cover references remain valid until their event or workspace is deleted.

Households persist an explicit positive `guestCount` and one Pending/Confirmed/Declined `rsvpStatus`. Individual legacy guest records are preserved but hidden; new household editing does not create them. Gifts require only `personName`, with optional integer-paise value, relationship, and description. Historical gift type, date, estimate, thank-you, return-gift, and notes fields remain compatibility data.

Data-backup JSON deliberately excludes wedding/event cover-photo and attachment references/file bytes while preserving structured legacy expense fields. Expense CSV is a reader-facing six-column view: title, category, actual INR amount, expense date, notes, and attachment name. CSV is not an import contract. Backup history records only successful local export files. Successful import and Reset Demo Data operations clear workspace-local media after adopting the replacement snapshot. Full local deletion commits an empty-workspace tombstone, removes records/media/exports, and routes to the minimum local setup flow. The tombstone remains authoritative even if a platform adapter cannot physically remove a storage key immediately.

A future Supabase implementation must satisfy all current repository contracts, then replace only the registry composition. It must not introduce a sync queue, background sync, conflict resolution, or realtime behavior without a separately approved design.

Money is stored as integer paise. Dates remain date-only. Event `time` and `endTime` are the narrow local `HH:mm` exception and intentionally carry no timezone.
