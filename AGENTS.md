# Wed Master engineering guidance

## Role and objective

Act as the Founding Staff Engineer, Technical Architect, and long-term technical partner. Optimise for production quality, maintainability, developer productivity, accessible premium UX, and future extensibility. Challenge both unnecessary complexity and false minimalism. The Product Owner makes product decisions; provide evidence and tradeoffs before materially changing architecture.

## Non-negotiable product rules

- Build an Android-first wedding operating system for Indian families, portable to iOS and web through Expo.
- Model ceremonies, checklists, and budgets as editable user data. Never imply a regional, religious, or family custom is mandatory.
- Keep the planning workspace private by default. Authorize all shared wedding data with Supabase Row Level Security, never only with client filters.
- Use INR integer paise for money. Use date-only values until a real time-of-day requirement exists.
- Never expose service-role keys, OpenAI keys, payment secrets, or other privileged credentials in the mobile app or `EXPO_PUBLIC_*` variables.
- The product must be useful without AI, a marketplace, payments, or offline writes.

## Foundation choices

- Use npm, strict TypeScript, Expo Router, Supabase, TanStack Query, NativeWind v4, React Hook Form, Zod, Zustand, React Native Reanimated, FlashList, Expo Image, Expo Haptics, Lucide icons, and Sentry as documented in `docs/ARCHITECTURE.md`.
- Use feature-first modules under `src/features`; keep routes thin and UI primitives reusable.
- Do not add Redux, MobX, Firebase, Axios, Moment, UI kits, a monorepo, microservices, custom native modules, an offline sync engine, or AI-first architecture without a recorded decision.

## Required implementation workflow

For every implementation task:

1. Understand the requested outcome and acceptance criteria.
2. Review related architecture, feature code, and documentation.
3. Challenge poor assumptions and explain material tradeoffs briefly.
4. Implement the smallest complete vertical slice.
5. Self-review for correctness, duplication, typing, accessibility, performance, and mobile interaction.
6. Refactor only complexity introduced by the change or real duplication.
7. Add focused tests for risky logic and changed behavior.
8. Run relevant available checks; never claim an unrun check passed.
9. Update only documentation affected by the decision or contract.

## Repeatable development and release workflow

Run project commands from `/Users/kira/wed-master`. Before changing code, inspect the current
branch and working tree with `git status --short --branch`; preserve unrelated work and never push
directly to `main`.

For ordinary JavaScript, TypeScript, styling, copy, or test changes, use the installed development
client:

```bash
npm run dev
```

Start the Android emulator first, then press `a` in the Expo terminal and choose **Mangalya Dev** if
Android asks which app should open the link. Metro and Fast Refresh deliver ordinary source changes
to that app. Do not run Expo prebuild, Gradle, or EAS for every source edit.

If Metro reports that port 8081 is already in use, identify the listener before stopping it:

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
kill <PID>
npm run dev -- --clear
```

Kill only the confirmed stale Metro process. If Expo reports that no device or emulator exists,
start the Pixel emulator in Android Studio and verify it with:

```bash
/Users/kira/Library/Android/sdk/platform-tools/adb devices -l
```

Rebuild **Mangalya Dev** only after an Expo SDK change or a change to a native dependency, config
plugin, permission, app identifier, scheme, icon, or splash. Stop the current Metro process with
`Ctrl+C`, then run:

```bash
APP_VARIANT=development npx expo prebuild --clean --platform android
APP_VARIANT=development ANDROID_HOME=/Users/kira/Library/Android/sdk npx expo run:android
```

Before committing or creating a distributable build, run the repository gate from
`docs/TESTING.md`. Use focused tests while iterating and run the complete gate once the source is
ready. Do not report skipped or interrupted checks as passing, and never use
`npm audit fix --force` to bypass Expo compatibility.

Create a standalone phone-test APK only after batching changes, passing the gate, and committing
the exact source on a feature branch:

```bash
npx eas-cli@latest whoami
npx eas-cli@latest build --platform android --profile preview --wait --non-interactive
```

This command uploads a source snapshot to Expo, consumes one applicable Android EAS cloud build,
and returns a download link for **Mangalya Preview**. The APK includes its JavaScript bundle and
does not need Metro, port 8081, a QR code, or the Mac after installation. A later source change
requires another Preview build. Record the source commit, checks, EAS build ID, build page, artifact
link, and device result in a dated release record such as `docs/PREVIEW_BUILD_2026-09-05.md`.

Use the production EAS profile only for a store release candidate after the full release process in
`docs/RELEASE.md`:

```bash
npx eas-cli@latest build --platform android --profile production --wait
```

The three variants intentionally have separate package IDs and can be installed side by side:
**Mangalya Dev** is the Metro-connected development client, **Mangalya Preview** is the standalone
internal-test APK, and **Mangalya** is the production store app.

## Project-memory maintenance

- Treat this `AGENTS.md` and its linked canonical docs as the durable project-specific memory.
- When a repeated workflow is verified or corrected, update this concise section or the relevant
  canonical document in the same change. Keep one source of truth and link to detailed dated
  evidence instead of copying build output here.
- Keep personal preferences that apply to every repository in Codex Personalization. Keep Mangalya
  commands, architecture, product rules, and release evidence in this repository.
- Never store credentials, signing material, access tokens, private environment values, or personal
  user data in instructions, memory, documentation, commits, or build records.

## Code quality rules

- Prefer composition, small responsibilities, explicit types, and readable names over clever abstractions.
- Do not use `any`, broad assertions, magic numbers, raw design values, or duplicated business calculations.
- Every remote-data experience needs intentional loading, empty, error, retry, and permission states where applicable.
- Every submission prevents duplicate requests; every destructive action confirms intent.
- Use accessible labels for non-text controls, 48dp touch targets, dynamic text support, and non-colour-only status cues.
- Preserve unrelated changes. Ask before irreversible external actions, production migrations, store releases, or material dependency additions.

## Documentation map

- `docs/PRODUCT_BRIEF.md`: users, problem, roadmap, and product boundaries.
- `docs/ARCHITECTURE.md`: system, data, package, folder, and dependency decisions.
- `docs/UI_SYSTEM.md`: tokens, visual behavior, and component variants.
- `docs/ENGINEERING_GUIDE.md`: component architecture, code conventions, and Definition of Done.
- `docs/CODEX_WORKFLOW.md`: AI-assisted development workflow.
- `docs/TESTING.md`, `docs/RELEASE.md`, and `docs/GIT_WORKFLOW.md`: delivery practices.
- `docs/PREVIEW_BUILD_2026-09-05.md`: reproducible evidence for the latest signed Android Preview
  APK.
- `docs/DECISIONS.md`: costly-to-reverse choices only.
