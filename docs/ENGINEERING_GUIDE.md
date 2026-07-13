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
- Keep tab routes thin. Domain presentation such as event timelines, task completion rows, expense rows, financial summaries, and the quick-add sheet belongs in `src/features/workspace`.

## Error handling and logging

- Validate untrusted input at form and network boundaries.
- Normalize provider/database errors into safe, actionable user messages.
- Never silently swallow an error. Provide retry or clear next action when possible.
- Do not log names, phone numbers, financial data, documents, tokens, or secrets. Configure Sentry with data scrubbing before beta.

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

Implemented routes are the four-tab workspace plus event, task, and expense detail/create/edit routes under `(app)`. Create/edit flows use Expo Router modal routes, React Hook Form, Zod, keyboard-safe scrolling, progressive optional fields, and the native Android date picker. Budget-category management remains deferred beyond this first vertical slice.

The Plan tab uses one Events/Tasks segmented control. Task filters for status, priority, event, and overdue state are contained in one sheet with a one-tap reset. The Budget tab uses the same pattern for category and payment status. Event ordering remains persisted in the repository for compatibility, but the earlier/later controls are intentionally not exposed in the simplified product UI.

Home has one Add action that opens a task/expense/event chooser; it must remain the only primary quick action on that screen. The Budget tab shows active categories rather than an empty list of every available category. Detail routes use visible back actions and confirmation dialogs for deletion.

Do not bypass repository interfaces when adding a feature. Add a contract, local implementation, query hook/selector, focused tests, then UI.
