# Codex workflow

## Working contract

Use Codex as an architecture-aware implementation partner, not a prompt-to-code machine. Each task has one outcome, explicit constraints, acceptance criteria, and relevant paths. Codex reads `AGENTS.md` and applicable docs before editing.

## Implementation prompt shape

```text
Outcome: Create the task creation vertical slice.
Read: AGENTS.md, docs/ARCHITECTURE.md, docs/UI_SYSTEM.md, and src/features/tasks.
Constraints: Use the established feature public API and UI primitives. Preserve INR/date rules.
Acceptance: validation, pending submit prevention, error retry, accessible labels, focused tests.
Do not: change unrelated routes, add a dependency, or rewrite existing primitives.
```

## Review gates

Request a separate review before:

- adding a production dependency
- changing Supabase schema or RLS
- changing route hierarchy or app-wide providers
- enabling analytics, AI, payments, or external sharing
- merging a complex user flow or preparing a beta release

Review findings must be evidence-based, prioritized by user risk, and separate real defects from style preferences.

## Preventing architecture drift

- Keep this documentation set as the repository source of truth.
- Make one vertical slice at a time; avoid unrelated cleanup during feature work.
- Record costly decisions in `DECISIONS.md`.
- Create a skill only after a workflow repeats with stable inputs and outcomes.
- Create a plugin only when a workflow must be shared or bundled with MCP/tools.
- Use subagents only for independent, read-heavy exploration or reviews; never concurrent edits to the same feature.

## AI in the product

AI is a future server-side feature. It must use structured output, show users a proposed result, require confirmation before data writes, avoid sensitive data by default, and have rate limits, moderation, and observability. The planner's core loop must remain useful when AI is unavailable.
