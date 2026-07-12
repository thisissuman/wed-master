# Decisions

Record only choices that are expensive to reverse or likely to confuse a future contributor. Keep each entry under 15 lines.

## 2026-07-12: Start online-first

**Decision:** Use TanStack Query cache only; do not build offline writes, a SQLite mirror, or sync conflict handling in alpha.

**Why:** The planner needs a reliable core workflow before it needs complex synchronization.

## 2026-07-12: Use editable user-created events first

**Decision:** Do not seed state-, religion-, or community-specific ceremony flows in alpha.

**Why:** Editable events validate the planning model without presenting uncertain cultural defaults as rules.

## Template

```md
## YYYY-MM-DD: Decision title

**Decision:** What we chose.

**Why:** The constraint or evidence.

**Consequence:** What we intentionally accept or defer.
```
