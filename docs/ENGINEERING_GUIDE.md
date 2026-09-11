# Engineering guide

## File and naming conventions

- Route files follow Expo Router requirements and may default-export a screen.
- All other components use named exports and `PascalCase.tsx` files.
- Hooks use `useX.ts`; schemas use `schema.ts`; feature queries/mutations live in `api/`; feature types live in `types.ts`.
- Use `camelCase` for functions/variables, `PascalCase` for types/components, and `UPPER_SNAKE_CASE` only for genuine immutable constants.
- Prefer path aliases after scaffolding; do not use deep relative imports across feature boundaries.

## Component and hook conventions

- A screen composes sections; a section arranges a coherent area; a feature component owns domain presentation; a UI primitive owns visual/accessibility behavior.
- Extract code for a distinct responsibility, meaningful reuse, or readability—not simply to reduce file length.
- Prefer composition and explicit variant props over inheritance or boolean-prop matrices.
- Hooks orchestrate state and side effects. Pure calculations live in domain utilities and are unit tested.
- Feature `index.ts` files expose the supported public API. Do not import another feature's internal files.
- `src/theme/tokens.json` is the value source for both TypeScript and NativeWind. Do not add a second token map in a component or configuration file.
- NativeWind class strings belong in primitives and feature components; extract a variant map before a class string becomes hard to read or is repeated.
- Prefer summary surfaces and divider-based rows over feature-specific card variants. A `Card` is not a press target; use `ListRow` or a focused feature row for navigation.
- A screen owns one clear primary action. Use the anchored filter popover for the compact task and guest filters, reserve `FilterSheet` for genuinely larger filter sets, put optional form fields in `Disclosure`, and keep destructive work behind `ConfirmationDialog`.
- Empty lists use the shared compact `EmptyState` row. Make that row actionable only when no footer or FAB already creates the record; otherwise keep it neutral. Filtered-empty states reset filters or search instead of duplicating creation.
- Use `src/lib/responsive.ts` for shared 600dp expanded-width, 1.3 large-text, and compact control-stacking decisions. Tablet layouts restructure navigation and content instead of stretching phone UI.
- Keep tab routes thin. Domain presentation such as event timelines, task completion rows, expense rows, financial summaries, and direct creation actions belongs in `src/features/workspace`.

## Error handling and logging

- Validate untrusted input at form and network boundaries.
- Normalize provider/database errors into safe, actionable user messages.
- Never silently swallow an error. Provide retry or clear next action when possible.
- Do not log names, phone numbers, financial data, documents, file paths, tokens, or secrets. Keep Sentry disabled without a DSN and preserve the event scrubber when changing observability.

## Documentation standards

- Update product docs for user-facing scope changes.
- Update architecture docs for boundary, dependency, data, or platform decisions.
- Update UI docs for new primitive contracts or token changes.
- Add a short decision only when reversal would be expensive or confusing.

## Definition of Done

A feature is complete when requested behavior, type safety, mobile interaction, focused tests, relevant loading/empty/error/permission states, accessibility basics, and documentation impact have all been reviewed. Verification must state what ran and what did not.

## Git workflow

- Keep `main` releasable. Never push directly to it.
- Use short-lived branches with the repository conventions: `feat/...`, `fix/...`, `chore/...`, or
  `refactor/...`. Codex-created branches use the `codex/` prefix unless the task specifies another
  name.
- Write imperative Conventional Commits such as `feat(tasks): add due-date filter` or
  `fix(backup): reject oversized input`.
- Keep commits focused. Do not combine unrelated styling, data, configuration, or documentation
  work.
- Rebase or merge `main` deliberately before review; never force-push a shared branch without the
  owner's direction.
- Use a pull request for structural or release work. Describe the problem, resulting behavior,
  validation, data/privacy impact, screenshots for UI changes, and intentional follow-ups.
- Self-review the complete diff before committing. Remove debugging output, commented-out code,
  accidental generated files, and secrets.
- Prefer squash-and-merge for feature branches so `main` receives one clear Conventional Commit.

Pull-request checks are typecheck, lint, tests, formatting, and whitespace validation. Preview or
development builds run after merge or when native validation is required. Maestro and signed-build
checks belong to release acceptance; see [TESTING.md](./TESTING.md) and [RELEASE.md](./RELEASE.md).

## Quality commands

- `npm run lint`
- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run format:check`

Use `npm run format` only for deliberate formatting changes. Do not run dependency upgrades or automated audit fixes as a substitute for reviewing compatibility.

# First local product slice

Implemented routes are the five-tab Home · Plan · Inspire · Money · More workspace plus event, task, expense, and inspiration detail/create/edit routes under `(app)`. Create/edit flows use Expo Router modal routes, React Hook Form, Zod, keyboard-controller-aware scrolling, measured keyboard-sticky actions, progressive optional fields, and the native Android date picker. Expense creation alone uses a transparent route-backed overlay; other create/edit routes use the reduced-motion modal contract. Web uses the regular scroll fallback, and the specialized quick-expense animation must not receive a second keyboard offset.

The Plan tab keeps one mounted Tasks/Events header and segmented control while only the active list content transitions. Task filters are limited to Status and Priority in an anchored, immediate popover with Reset. Event and task suggestions are onboarding-only; the final image-free task step offers ten optional starter tasks and includes the selected batch in the single workspace-creation snapshot. Stable keys and normalized exact aliases prevent duplicates. Form routes use the function-only `FormShell` and shared fields except for the purpose-built quick-expense overlay. A transient local highlight store drives one reduced-motion-safe pulse on newly created expense, task, event, household, gift, and contact rows. Passive success snackbars are intentionally absent; destructive Undo snackbars remain.

Inspire is an intentional feature-first exception to the monolithic workspace snapshot. Keep its versioned AsyncStorage document, TanStack Query hooks, media pipeline, demo seed, form orchestration, and UI under `src/features/inspire`; routes only pass IDs. The five zero-board examples are render-only bundled assets, not repository records. Metadata is committed only after both managed WebP derivatives exist. Close the source dialog fully before launching Gallery or Camera from `onAfterClose`. Failed saves retain the draft, discard removes it, destructive deletion defers file removal until Undo expires, and startup repairs orphan media. Never add Inspire to the data-only workspace backup or imply that Gallery/Camera files are cloud-backed.

Home omits the compact Quick actions strip and owns the reusable 56dp circular Add expense FAB at the scene’s bottom-right. `/budget` uses the same safe-area-aware Add expense FAB, and both screens reserve matching scroll clearance. Guests and emergency contacts share that FAB plus adaptive one/two-column people cards; household detail preserves household-level editing and keeps deletion separated and confirmed. Gifts currently surfaces and creates Received records only; legacy kinds stay readable in storage. First-run setup writes the current v5 contract with required names/date, optional paise budget/photo/events/tasks, neutral compatibility defaults, and fixed artwork-only ink roles for user values. Detail routes use visible fallback-aware back actions and confirmation dialogs for deletion.

The Home wedding hero also owns one dependency-free Reanimated keepsake interaction: tapping the unchanged summary opens an equal-size centred modal card over a blurred scrim, and a second tap flips to `wedding.keepsakeMessage`. The message is optional, bounded, editable in Wedding details, included in data-only backup, and falls back to product copy without forcing a snapshot-version migration. The card itself is the labelled control, outside tap and Android Back dismiss, and Reduce Motion replaces position/rotation with opacity.

Do not bypass repository interfaces when adding a feature. Add a contract, local implementation, query hook/selector, focused tests, then UI.
