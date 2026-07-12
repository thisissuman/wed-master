# Wed Master

Wed Master is an Android-first wedding planning workspace for Indian families. It will grow from a trusted planning product into a collaborative platform, while keeping cultural workflows editable and private by default.

## Status

Expo Router foundation is scaffolded. It includes a four-tab placeholder shell, providers, Supabase environment boundary, semantic design tokens, reusable UI primitives, and focused test setup. No product feature or Supabase schema exists yet.

## Start here

1. Read [Product Brief](docs/PRODUCT_BRIEF.md).
2. Read [Architecture](docs/ARCHITECTURE.md).
3. Follow [Codex Workflow](docs/CODEX_WORKFLOW.md) before implementation.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env` before connecting authentication. The current shell remains usable without them and clearly marks Supabase as unconfigured.

For Android development, install Android Studio, its Android SDK Platform Tools, an emulator, and a Java runtime. Build the initial development client with `npx expo run:android`, then use `npm run android` for normal development.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npx expo-doctor
```
