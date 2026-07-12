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
