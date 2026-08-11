# Git workflow

Use npm everywhere. Keep `main` releasable and history understandable.

## Branches and commits

- Use short-lived branches for work spanning more than one focused session: `feat/task-planning`, `fix/budget-total`, `docs/repository-foundation`.
- Use imperative Conventional Commit-style messages: `feat: add wedding setup`, `fix: prevent duplicate expense submit`, `docs: clarify package boundaries`.
- Rebase or merge deliberately; avoid force-pushing shared branches.

## Pull requests

PRs are optional for solo work but recommended for structural changes. Include purpose, user-visible result, screenshots for UI, verification evidence, data/privacy impact, and intentionally deferred follow-ups.

## Versioning and releases

Use semantic pre-release tags: `v0.1.0-alpha.1`, `v0.1.0-beta.1`, then `v1.0.0`. Android version-code increments are independent from user-visible semantic versions.

## CI progression

1. On pull requests: `npm run lint`, `npm run typecheck`, `npm test`.
2. On main: Android preview/development build.
3. After stable flows: Maestro smoke tests.
4. Before store release: signed build, release checklist, and manual device verification.
