# Decisions

Record only choices that are expensive to reverse or likely to confuse a future contributor. Keep each entry concise.

## 2026-07-12: Modular Expo foundation

**Decision:** Use Expo, Expo Router, Supabase, feature modules, and RLS as a modular monolith.

**Why:** It delivers mobile speed now while keeping web/admin expansion additive rather than requiring premature services.

## 2026-07-12: Production UI and state baseline

**Decision:** Standardize on NativeWind v4, TanStack Query, Zustand, React Hook Form, Zod, Reanimated, FlashList, Expo Image, Haptics, SecureStore, Lucide, and Sentry.

**Why:** These establish stable boundaries for a premium consumer app. Their use remains feature-driven; foundation classification prevents inconsistent replacements.

## 2026-07-12: Online-first planning core

**Decision:** Do not build offline writes, SQLite synchronization, or conflict resolution in early versions.

**Why:** Collaboration-safe offline editing is a distributed-systems feature and must follow validated core usage.

## 2026-07-12: Editable cultural defaults

**Decision:** Begin with user-created events; introduce sourced regional templates after the planning model is proven.

**Why:** The product must be adaptable without making uncertain cultural claims.

## Template

```md
## YYYY-MM-DD: Decision title

**Decision:** What we chose.

**Why:** Constraint or evidence.

**Consequence:** What becomes easier, harder, or intentionally deferred.
```
