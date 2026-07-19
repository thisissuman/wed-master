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

## 2026-07-12: Expo SDK 57 production scaffold

**Decision:** Use npm, Expo Router with `src/app`, NativeWind v4, development-build scripts, SecureStore-backed Supabase session persistence, and the documented foundation package set.

**Why:** The baseline provides compatible native tooling, typed routing, feature boundaries, consistent visual tokens, and a production path without implementing product features.

**Consequence:** Android development requires a local SDK/emulator and Java runtime. Sentry is installed but remains unconfigured until a private-alpha project/DSN exists.

## 2026-07-13: Restrained planning UI system

**Decision:** Use a warm ivory, deep-plum semantic visual system with summary-first screens, divider-based planning rows, progressive form details, and a single primary action per screen.

**Why:** The first local slice proved the data model but presented too many equal cards, actions, fields, and filters. A disciplined hierarchy makes wedding planning faster to scan without turning the app into an accounting dashboard or decorative invitation.

**Consequence:** New features must reuse the shared UI primitives, keep filters out of the default view, and justify a card or new accent colour. Event ordering remains stored but is not a primary interaction until a validated need for reordering returns.

## 2026-07-15: Mangalya local workspace v2 and data-only backups

**Decision:** Evolve the local snapshot to version 2 with migrated people, gifts, contacts, attachments, backup history, and settings fields. Structured backups include records but exclude attachment file bytes.

**Why:** The remaining Stitch-derived flows need real persistence and safe local export without pretending that a JSON file contains receipts or task documents.

**Consequence:** The v1 key remains untouched during migration; imports validate v1/v2 and confirm full replacement. Attachment files are device-local. Reset Demo Data clears them, while full Delete Local Data remains deferred until onboarding can create a valid replacement workspace.

## 2026-07-15: Botanical Mangalya visual direction

**Decision:** The botanical-green, antique-gold, terracotta, EB Garamond, and Manrope system in `docs/UI_SYSTEM.md` supersedes the earlier deep-plum colour direction while retaining its restrained hierarchy principles.

**Why:** The approved Home redesign is now the product's visual anchor for every workspace screen.

**Consequence:** New screens reuse semantic Mangalya tokens and the real navigation shell instead of copying screen-specific Stitch styling or generated bottom bars.

## 2026-07-17: Fixed deep-plum workspace direction

**Decision:** The fixed deep-plum semantic token system and rebuilt Home experience supersede the 2026-07-15 botanical-light direction. Home is the first complete vertical slice; Plan, Money, and More retain their body information architecture while adopting the same chrome, type, contrast, and component contracts.

**Why:** The written Mangalya Home brief is the authoritative product direction. A single dark system avoids maintaining an unvalidated theme toggle while establishing accessible, reusable contracts for progress, task completion, budget health, and local cover media.

**Consequence:** New workspace UI uses `canvas`, semantic surfaces, rose primary, forest secondary, champagne accent, Manrope functional type, and serif only for wordmark/hero roles. `MangalyaHeader` is wordmark-only; the tab bar remains in layout. Cover photos stay device-local and are excluded from structured backups. Blur, chart libraries, looping decoration, and a second theme remain out of scope.

## 2026-07-18: Fixed lavender-and-ivory workspace direction

**Decision:** The light lavender-and-ivory semantic token system and `Final_Home.png`-anchored Home composition supersede the 2026-07-17 deep-plum direction. The app remains a single fixed theme rather than adding a theme toggle.

**Why:** The approved reference establishes a lighter, calmer visual hierarchy while retaining real planning data, Android-first accessibility, and the existing feature architecture.

**Consequence:** Shared chrome, surfaces, text, controls, forms, and statuses use the light semantic tokens. Home shows an open photo/countdown summary, two Focus today tasks, a compact three-metric budget, and four direct creation actions. Live countdown text, progress, and interaction remain code-native; optimized decorative raster assets may supply the static countdown halo and faded Home backdrop without adding runtime image generation or blur dependencies.

## Template

```md
## YYYY-MM-DD: Decision title

**Decision:** What we chose.

**Why:** Constraint or evidence.

**Consequence:** What becomes easier, harder, or intentionally deferred.
```

# ADR — local workspace persistence for the prototype

**Decision:** use Expo-compatible AsyncStorage for the unauthenticated prototype workspace.

**Why:** it is the smallest stable persisted key-value solution for a single local demo workspace. SecureStore remains reserved for sensitive credentials; it is not a general application database.

**Deferred:** cloud storage, Supabase tables, synchronisation, conflict handling, background work, and local-to-remote migration UX. These require an authenticated multi-device product decision.
