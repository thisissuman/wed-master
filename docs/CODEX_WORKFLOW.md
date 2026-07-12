# Codex workflow

## Use Codex as a technical partner

Ask for one user outcome at a time. Provide the screen or feature, constraints, acceptance criteria, and relevant paths. Ask Codex to inspect before editing.

```text
Implement the task creation flow.
Read AGENTS.md, docs/UI_SYSTEM.md, and the tasks feature first.
Use existing UI primitives. Include validation, pending submission, and error retry.
Add focused tests for the task schema. Do not change unrelated routes.
```

## Review prompt

```text
Review this change as a Staff React Native engineer. Look for real correctness,
accessibility, Android interaction, typing, and test gaps. Do not edit files.
Report evidence-backed findings ordered by severity.
```

## When to delegate

Use subagents only for independent, read-heavy work such as code exploration, API documentation research, or a review. Do not ask multiple agents to edit the same feature. Built-in Codex agents are enough until repeated work proves a dedicated agent is valuable.

## Skills, plugins, MCP, and hooks

- Start with project docs and `AGENTS.md`.
- Create a skill only after a workflow repeats and has stable inputs/outputs.
- Create a plugin only when a workflow must be shared or bundled with an MCP app, connector, or hook.
- Add MCP servers only for a current need; use official framework docs for implementation decisions.
- Do not add hooks until a mechanical policy is repeatedly missed and can be enforced safely.

## AI in the product

The planner must work without AI. If AI is added later, call it through a server-side endpoint, request structured output, show users the proposed change, and require confirmation before writing data. Never send sensitive guest or finance data by default.

## Prompt quality

Good prompts name the outcome, the relevant files, constraints, and acceptance checks. They do not prescribe unnecessary implementation details. After Codex implements a slice, ask for a focused review rather than starting a new unrelated feature.
