# Git workflow

Keep Git simple and keep `main` releasable.

## Branches

- Use `main` for completed, tested work.
- Use a short branch only when a change spans multiple sittings: `feat/task-planning`, `fix/budget-total`.
- Delete the branch after merge. Avoid long-lived feature branches.

## Commits

Use small, imperative commits:

```text
feat: add wedding setup
fix: prevent duplicate expense submit
docs: clarify UI state rules
```

## Pull requests

PRs are optional for solo work. Use one for a larger change or when requesting an independent Codex review. Include: purpose, user-visible result, test evidence, screenshots for UI changes, and deferred follow-ups.

## Versions

Use pre-release tags while testing: `v0.1.0-alpha.1`, then `v0.1.0-beta.1`. Keep Android version-code increments separate from the user-visible semantic version.

## Automation

Add CI only after lint, typecheck, and tests exist. First automation should run those checks on pull requests. Add preview builds and E2E workflows after the app has stable smoke tests.
