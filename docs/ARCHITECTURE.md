# Architecture

## System boundary

Start as a modular Expo application backed by Supabase. This is a deliberate **modular monolith**, not a temporary prototype: feature boundaries, RLS, typed data contracts, and a stable navigation shell make later web/admin products additive rather than a rewrite.

```text
Expo mobile / universal client
  ├── Expo Router navigation
  ├── NativeWind v4 design system and UI primitives
  ├── feature modules
  ├── TanStack Query server-state boundary
  └── Supabase
        ├── Auth
        ├── Postgres + RLS
        ├── Storage (when receipts/documents exist)
        └── Edge Functions (trusted integrations later)
```

The app is online-first. Query caching improves responsiveness but does not create an offline write queue, local database mirror, or sync-conflict system.

Use an Expo development build as the normal local runtime once the application is scaffolded. Expo Go is useful for quick experiments, but a development build exercises the native dependency set that the production app actually ships.

## Implemented foundation

- `src/app` contains route groups for auth, onboarding, and app navigation, plus a four-tab placeholder shell and not-found route.
- `src/providers` composes Query, theme, session, and safe-area boundaries without storing fetched data in Context.
- `src/lib/supabase` validates public environment values and uses SecureStore-backed session persistence; it performs no schema or remote setup.
- `src/theme/tokens.json` is the shared token source consumed by TypeScript and `tailwind.config.js`.
- `src/components/ui` contains only domain-neutral primitives. Feature folders exist as ownership boundaries but contain no product implementation yet.

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

## Production folder structure

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

| Package                                     | Purpose and rationale                                                | Alternative / tradeoff                                                                 | Timing                               |
| ------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| Expo, React Native, TypeScript, Expo Router | universal native client with stable file-based navigation            | native Kotlin/Swift offers more control but raises delivery cost                       | Foundation                           |
| `@supabase/supabase-js`                     | Auth, Postgres, RLS, Storage, Realtime path                          | Firebase is less aligned with relational finance/workspace data                        | Foundation                           |
| `@tanstack/react-query`                     | server cache, mutations, retries, invalidation                       | direct effects create inconsistent loading and cache behavior                          | Foundation                           |
| `react-hook-form` + `zod`                   | scalable, typed mobile forms and input validation                    | hand-managed form state becomes repetitive and error-prone                             | Foundation                           |
| `zustand`                                   | small explicit global client-state boundary                          | Context is adequate for providers but weak for evolving app UI state                   | Foundation; use sparingly            |
| NativeWind v4                               | stable Tailwind workflow and token-friendly UI speed                 | StyleSheet is simpler but slower for a Tailwind-fluent product team; v5 is pre-release | Foundation                           |
| `react-native-reanimated`                   | performant interactions, layout transitions, Bottom Sheet dependency | React Native Animated is less capable for premium interaction                          | Foundation                           |
| `@gorhom/bottom-sheet`                      | production-grade contextual create/edit experience                   | native Modal is simpler but less consistent for dense workflows                        | Foundation; use selectively          |
| `@shopify/flash-list`                       | scalable task, vendor, and guest lists                               | FlatList is fine for tiny lists but creates migration churn later                      | Foundation                           |
| `expo-image`                                | performant cross-platform image rendering and caching                | React Native Image has fewer caching/transition controls                               | Foundation                           |
| `expo-haptics`                              | meaningful tactile confirmation on supported devices                 | no dependency means less native feedback                                               | Foundation; use rarely               |
| `lucide-react-native` + `react-native-svg`  | consistent accessible icon system                                    | emoji/platform icons are inconsistent                                                  | Foundation                           |
| `expo-secure-store`                         | encrypted token/small-secret persistence                             | AsyncStorage and MMKV are not a secure token store                                     | Foundation                           |
| `@sentry/react-native`                      | release health and error visibility                                  | console logs are not production observability                                          | Foundation, configure before beta    |
| Jest + React Native Testing Library         | domain and component confidence                                      | snapshots alone do not test behavior                                                   | Foundation dev tooling               |
| Maestro                                     | realistic mobile smoke journeys                                      | unit tests cannot validate navigation/device behavior                                  | V1 after flows stabilize             |
| MMKV                                        | fast non-sensitive local key/value persistence                       | unnecessary before a proven low-latency persistence need; never use for tokens or sync | Later                                |
| `expo-notifications`                        | task reminders                                                       | requires stable task model and permission UX                                           | V1                                   |
| Document/Image picker and FileSystem        | receipts and documents                                               | adds permission and storage responsibilities                                           | V1                                   |
| `expo-localization` + i18n library          | multi-language support                                               | adding translations before content stabilizes creates churn                            | V2                                   |
| PostHog or equivalent                       | consented product analytics                                          | analytics before privacy/event design creates noisy data                               | Beta                                 |
| Moti, Skia, Lottie, Blur                    | optional visual polish                                               | duplicate abstractions or decorative cost                                              | Later only with approved design need |
| `expo-av`                                   | legacy media API                                                     | deprecated; use `expo-audio`/`expo-video` if required                                  | Never                                |

Do not add Redux, MobX, Firebase, Axios, Moment, NativeBase, React Native Paper, React Native Elements, SQLite sync, custom native modules, microservices, or an AI SDK to the client foundation.

## Environment contract

The only current runtime values are:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

They are public client configuration values, not secrets. Never add a service-role key or provider secret to `.env` values exposed to the app. Generate Supabase database types only after the first schema exists; until then, the client intentionally has no application-table contract.

# Local prototype workspace

The first product slice is deliberately local-first. `src/features/workspace` owns the wedding, event, task, budget-category, and expense contracts. Screens use `useWorkspace` and `useWorkspaceMutation`; they never access AsyncStorage or Supabase directly.

`LocalWorkspaceStore` persists one versioned `WorkspaceSnapshot` in AsyncStorage (`@wed-master/local-workspace/v1`). Repositories are assembled by `RepositoryProvider`. A future Supabase implementation must satisfy the existing `WeddingRepository`, `EventRepository`, `TaskRepository`, `BudgetRepository`, and `ExpenseRepository` contracts, then replace only the registry composition. It must not introduce a sync queue, background sync, conflict resolution, or realtime behavior without a separately approved design.

Money is stored as integer paise. UI formatting is a presentation concern only.
