# Architecture

## Baseline

Use Expo, React Native, strict TypeScript, Expo Router, Supabase, and pnpm. This keeps one understandable codebase while preserving Android, iOS, and web options.

```text
Expo app
  ├─ routes in src/app
  ├─ feature modules in src/features
  ├─ shared UI in src/components/ui
  ├─ small shared utilities in src/lib
  └─ Supabase: Auth + Postgres + RLS
```

The app is online-first. TanStack Query may cache server data, but there is no offline mutation queue, local database mirror, or conflict-resolution system in alpha.

## Folder structure

```text
src/
  app/                 Expo Router routes and layouts only
  features/
    wedding/
    events/
    tasks/
    budget/
  components/ui/       reusable visual primitives
  lib/                 Supabase client, formatting, small utilities
  types/               shared domain types only when genuinely shared
```

Keep a feature's screen-specific components, hooks, schemas, and queries in that feature folder. Do not create `services`, `helpers`, `constants`, or `hooks` folders merely because they are common in templates.

## Data rules

- Every shared row belongs to a `wedding_id`. Start with RLS when the first shared table is created.
- Alpha supports INR only. Store values as integer paise; keep calculation and formatting in one tested budget module.
- Store event and due dates as database `date` values unless time-of-day is needed.
- Start with user-created events. Add regional template content only after the core workflow is validated.
- Do not add realtime collaboration, file storage, notifications, or Edge Functions until a user-facing feature requires them.

## Dependencies by timing

| Timing | Dependency | Reason |
|---|---|---|
| Day one | Expo Router | Expo-native, file-based navigation. |
| First authenticated screen | `@supabase/supabase-js`, `expo-secure-store` | Auth, database access, and secure token storage. |
| First server-backed feature | `@tanstack/react-query` | Query, mutation, retry, and cache lifecycle. |
| First substantial form | `zod`, then `react-hook-form` if form state becomes repetitive | Keep validation explicit; avoid form machinery for tiny screens. |
| First polished UI pass | `lucide-react-native` and its SVG dependency | Consistent, accessible icons. |
| Closed beta | `@sentry/react-native` | Actionable production crash reports. |
| Proven need | FlashList, Reanimated, Bottom Sheet, Expo Image, Haptics, Notifications, document/media packages | Add only with the feature that needs it. |

Do not use NativeWind v5 while it is pre-release. Use token-based `StyleSheet` first. Do not add Zustand until React state, route params, and TanStack Query no longer express a real global UI state cleanly.

## Explicitly deferred

- MMKV, SQLite sync, Moti, Skia, Lottie, Blur, audio/video, custom native modules, Redux, Firebase, Axios, Moment, monorepo, microservices, marketplace, payments, and AI workflows.
- If audio/video becomes necessary, use `expo-audio` or `expo-video`; do not use deprecated `expo-av`.
