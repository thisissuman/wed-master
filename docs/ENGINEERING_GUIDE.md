# Engineering guide

## Code structure

- Routes coordinate navigation and screen composition; they do not contain business logic.
- A feature owns its screens, components, hooks, queries, schemas, and domain helpers until another feature genuinely needs them.
- Put visual primitives in `src/components/ui`. Keep them presentational and typed.
- Put cross-cutting integrations in `src/lib`, such as the Supabase client and INR/date formatters.

## Component guidelines

- Prefer a small component with a clear responsibility over a configurable mega-component.
- Extract a component when it has a distinct responsibility, meaningful reuse, or makes the parent easier to read—not merely because JSX has several lines.
- Prefer composition and named props over boolean-prop combinations.
- Keep domain calculations outside render functions and test them directly.
- Comments should explain a non-obvious constraint or decision, never restate code.

## TypeScript rules

- Keep `strict` enabled. Do not use `any` or broad type assertions to silence errors.
- Validate untrusted form and network input at the boundary.
- Use discriminated unions for finite UI states when they clarify behavior.
- Represent money and date-only values deliberately; do not hide conversions in components.

## Definition of Done

A feature is done when its requested behavior works, type errors are resolved, risky logic has focused tests, relevant loading/empty/error states exist, accessibility basics are present, and the affected documentation is accurate. Run only the checks that exist and are relevant; record what could not be verified.

## Feature development guide

1. State the user outcome and acceptance criteria.
2. Inspect the closest existing feature and relevant docs.
3. Make a small plan only when the work has multiple moving parts.
4. Implement the vertical slice, keeping data and UI changes together.
5. Self-review and test the behavior.
6. Refactor only duplication or complexity introduced by the slice.
