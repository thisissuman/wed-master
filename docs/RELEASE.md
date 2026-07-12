# Release guide

## Before beta

- Configure Sentry with PII scrubbing and verify no tokens, guest details, financial information, or documents leak into logs.
- Verify primary flows on a physical Android device.
- Run npm lint, typecheck, unit tests, and available smoke tests.
- Verify loading, empty, error, retry, permissions, large text, TalkBack, and 360dp layouts.
- Set package identifier, app name, icon, support contact, privacy policy, and version strategy.

## Release checklist

- Review unresolved crashes and high-severity defects.
- Test upgrade from the preceding build when schema/storage changes.
- Increment version code and user-visible version deliberately.
- Produce concise release notes and preserve a rollback path.
- Confirm database migrations are reviewed, reversible where possible, and target the correct environment.

## Quality constraints

- Never release with development logging or test credentials.
- Do not enable analytics, AI, payment, or public sharing without privacy review and user-facing disclosure.
- Keep performance budgets evidence-based; test slow devices before declaring an experience polished.
