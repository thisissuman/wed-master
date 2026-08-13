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
- A screen owns one clear primary action. Put advanced filtering in `FilterSheet`, optional form fields in `Disclosure`, and destructive work behind `ConfirmationDialog`.
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

## Quality commands

- `npm run lint`
- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run format:check`

Use `npm run format` only for deliberate formatting changes. Do not run dependency upgrades or automated audit fixes as a substitute for reviewing compatibility.

# First local product slice

Implemented routes are the four-tab workspace plus event, task, and expense detail/create/edit routes under `(app)`. Create/edit flows use Expo Router modal routes, React Hook Form, Zod, keyboard-safe scrolling, progressive optional fields, and the native Android date picker. Expense creation alone uses a transparent route-backed overlay; expense editing remains a full modal. Budget-category management remains deferred beyond this first vertical slice.

The Plan tab uses one Tasks/Events segmented control. It changes a local `activeView` immediately; route parameters initialize deep links and respond to genuine external changes but are not written by taps. A shallow task summary and one active-count filter control replace the former metrics card and visible presets. Task filters for status, priority, event, due-this-week, and overdue state remain contained in one compact sheet with a one-tap reset. Event ordering remains persisted in the repository for compatibility, but earlier/later controls are intentionally not exposed. Form routes use the function-only `FormShell` and shared fields except for the purpose-built quick-expense overlay. Expense creation persists title, category, actual paise, local date, optional existing event relationship, and `createdAt`, then dismisses directly to `/budget`; date, note, attachment, and other edits remain available from the saved row. The category picker is intentionally local UI: Other is first, while Task and Event reveal existing records and reuse the selected record name; no category-management dependency is introduced. A transient local highlight store drives one reduced-motion-safe pulse on newly created expense, task, event, household, gift, and contact rows. Passive success snackbars are intentionally absent; destructive Undo snackbars remain.

Home exposes four compact direct actions and no duplicate expense FAB. The `/budget` Money tab begins with the budget-position summary, keeps a virtualized union of date headers and compact expense rows primary, and owns the persistent Add expense action. Date groups sort newest first; rows inside each group retain newest-created ordering. The drill-down `/budget/overview` route is the only budget-target editor and combines a shallow financial summary, highest-first category bars, pure date-range aggregations, and a responsive accessible custom SVG trend without adding a chart dependency. Home, the Money summary, and a separate Settings row open the overview route; More intentionally has no redundant Budget shortcut, uses a responsive tool grid, and resets its nested stack to `index` whenever the tab loses focus. Guests retains name search and underlying household data while exposing one compact summary and one persistent creation FAB. Gifts currently surfaces and creates Received records only; legacy kinds stay readable in storage. Backup UI exposes structured export/import and expenses CSV only. Settings otherwise exposes one Wedding details editor and a separate Data & Privacy section. First-run setup writes the existing wedding contract with required names/date, optional paise budget/photo, and neutral compatibility defaults; it does not change the snapshot version. Detail routes use visible fallback-aware back actions and confirmation dialogs for deletion. Shared task rows clamp titles to two lines and stack status metadata at large text instead of nesting a horizontal scroller inside a vertical list.

The Home wedding hero also owns one dependency-free Reanimated keepsake interaction: tapping the unchanged summary opens an equal-size centred modal card over a blurred scrim, and a second tap flips to `wedding.keepsakeMessage`. The message is optional, bounded, editable in Wedding details, included in data-only backup, and falls back to product copy without forcing a snapshot-version migration. The card itself is the labelled control, outside tap and Android Back dismiss, and Reduce Motion replaces position/rotation with opacity.

Do not bypass repository interfaces when adding a feature. Add a contract, local implementation, query hook/selector, focused tests, then UI.
