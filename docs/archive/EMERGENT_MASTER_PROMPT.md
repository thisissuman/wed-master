# Emergent AI master build prompt — Mangalya

> **Historical and superseded (archived 2026-08-01).** This prompt predates the current
> lavender local-beta implementation. It is not a product, architecture, UI, testing, or release
> contract. Use `PRODUCT_BRIEF.md`, `ARCHITECTURE.md`, `UI_SYSTEM.md`, and `NEXT_STEPS.md` instead.

Copy everything between `BEGIN PROMPT` and `END PROMPT` into a new Emergent AI project.

---

## BEGIN PROMPT

You are the founding staff engineer, product designer, and QA owner for **Mangalya**. Build the complete product from scratch. Do not stop at a plan, mock-up, or static prototype: create the working application, database migrations, Row Level Security policies, seed/demo data, tests, setup documentation, and release-ready development configuration.

If something is ambiguous, choose the smallest production-quality solution consistent with this brief, note the assumption in the README, and keep building. Do not replace the requested mobile product with a generic web dashboard. Do not add speculative features just to make the product look larger.

## 1. Product and first-success journey

Mangalya is an **Android-first, private wedding planning operating system for Indian couples and families**, portable to iOS and web through Expo. Its promise is **“Your Wedding, Beautifully Organized.”** It brings events, tasks, spending, guests, gifts, important contacts, and documents into one calm shared workspace.

Indian weddings vary by region, religion, language, and family. Ceremonies and planning defaults must always be optional suggestions that users can edit, reorder, rename, or remove. Never present any custom as mandatory or universal.

A successful new user can:

1. Sign in securely.
2. Create a private wedding workspace.
3. Add or edit an event.
4. Create and complete a task.
5. Record an expense and understand planned, spent, paid, and outstanding amounts.

The product must remain useful without AI, a marketplace, payments, or offline writes.

## 2. Non-negotiable rules

- Every workspace is private by default.
- Authorize every wedding-owned database record with Supabase Row Level Security. Client-side filters are never authorization.
- Membership roles are `owner`, `editor`, and `viewer`. Owners manage the workspace and members; editors manage planning data; viewers are read-only.
- Store INR money as integer paise. Convert only at form/display boundaries and never use floating-point money arithmetic.
- Store calendar-only values as PostgreSQL `date` and `YYYY-MM-DD`. Add time-of-day only to events that need it. Do not introduce time zones for date-only data.
- Never expose service-role keys, OpenAI keys, payment secrets, or privileged credentials in the app or `EXPO_PUBLIC_*` variables.
- Build online-first. Query caching is useful, but do not claim offline editing or build an offline write queue/conflict engine.
- Every remote-data screen needs intentional loading, empty, error, retry, and permission/read-only states where applicable.
- Prevent duplicate submissions. Confirm destructive actions and full-workspace import/reset.
- The user-facing product name is Mangalya; the repository/package may be `mangalya` or `wed-master`.

## 3. Required stack and architecture

Build a universal Expo app that is Android-first and portable to iOS/web.

Use:

- npm with a committed lockfile
- current stable Expo SDK, React Native, and strict TypeScript
- Expo Router with typed routes
- Supabase Auth, PostgreSQL, RLS, and private Storage
- TanStack Query for server state, mutations, retry, and invalidation
- NativeWind v4 with semantic tokens from one source
- React Hook Form and Zod
- Zustand only for small global client-only state when genuinely needed
- React Native Reanimated for restrained meaningful motion
- FlashList for potentially long lists
- Expo Image, Expo Haptics, Expo SecureStore
- Lucide React Native icons; no emoji as structural icons
- Sentry-ready monitoring with PII/data scrubbing
- Jest and React Native Testing Library

Do not add Redux, MobX, Firebase, Axios, Moment, generic UI kits, a monorepo, microservices, custom native modules, an offline sync engine, or a client-side AI SDK.

Use a modular monolith with feature-first modules:

```text
src/
  app/                       # thin routes/layouts only
  features/
    auth/ onboarding/ wedding/ events/ tasks/
    budget/ guests/ gifts/ contacts/ backup/
  components/ui/            # domain-neutral accessible primitives
  components/brand/
  providers/
  lib/supabase/ money/ dates/ errors/
  theme/
  types/
supabase/migrations/
```

Dependency direction: `routes -> features -> components/ui + lib + theme`. UI primitives depend only on the theme. Routes contain no database calls, business calculations, or reusable UI. Feature modules own queries, mutations, schemas, hooks, components, and public APIs. Avoid global dumping folders such as `services`, `helpers`, or `common`.

## 4. Authentication and onboarding

Implement real Supabase authentication, not placeholders.

- Support email magic-link or email OTP. Google Sign-In is optional only if configured correctly for Expo without exposed secrets.
- Persist sessions securely and respond to auth state changes.
- Route unauthenticated users to auth, authenticated users without a wedding to setup, and members to the workspace.
- Show loading/retry during session restoration. Clear sensitive query caches on sign-out.
- Onboarding collects workspace name, optional wedding type/description, main date, optional location, optional guest estimate, optional target budget in rupees, and fixed currency INR.
- Wedding creation atomically creates the owner membership.
- Offer optional starter events and an equally clear empty-plan choice. Starter events become ordinary editable user data.

## 5. Supabase data model and authorization

Create version-controlled SQL migrations, generated/reproducibly generated TypeScript database types, UUID keys, plural `snake_case` tables, timestamps, `created_by` where relevant, foreign keys, constraints, and useful indexes.

Create these tables:

- `profiles`: auth user id, display name, optional avatar URL, timestamps.
- `weddings`: name, type/description, main date, location, currency constrained to INR, guest estimate, target-budget paise, timestamps, created_by.
- `wedding_members`: wedding_id, user_id, role `owner | editor | viewer`, timestamps, unique membership.
- `events`: wedding_id, name, date, optional start/end time, location, notes, semantic color/icon keys, sort order, timestamps, created_by.
- `event_required_items`: wedding_id, event_id, label, completed count, total count, sort order, timestamps; enforce non-negative values and completed <= total.
- `tasks`: wedding_id, optional event_id, title, description, notes, category text, due date, priority `low | medium | high | critical`, status `not_started | in_progress | completed | cancelled`, responsible-person text, timestamps, created_by.
- `task_checklist_items`: wedding_id, task_id, title, completed, sort order, timestamps.
- `budget_categories`: wedding_id, editable name, typed icon key, archived/selectable state, sort order, timestamps.
- `expenses`: wedding_id, category_id, title, actual paise, expense date, notes, timestamps, created_by. Enforce non-negative integer money and preserve nullable legacy estimate/payment/due/vendor/event fields only when migrating historical records; new capture never writes them.
- `households`: wedding_id, name, side `partner_one | partner_two | both | other`, invitation/accommodation/transport statuses, notes, timestamps, created_by.
- `guests`: wedding_id, household_id, name, RSVP `pending | confirmed | declined`, timestamps.
- `gifts`: wedding_id, kind `given | received | return_gift`, person, relationship, item, optional value paise, value-is-estimated, date, thank-you status/date, return-gift status/date, notes, timestamps, created_by.
- `emergency_contacts`: wedding_id, name, role, phone, semantic icon key, sort order, timestamps, created_by.
- `attachments`: wedding_id, optional task_id or expense_id, private storage path, original name, MIME type, size, timestamps, created_by; exactly one parent target.

Use an `updated_at` trigger. Compute summaries from source rows; do not add stored aggregate totals.

RLS contract:

- Members can read only weddings and child rows for their memberships.
- Owners/editors can create and update ordinary planning records. Viewers cannot write.
- Only owners can delete a wedding, manage roles/members, or perform destructive full-workspace import.
- Avoid recursive membership-policy traps; if necessary, use narrowly scoped `security definer` helper functions with a fixed safe `search_path`.
- Private Storage paths begin with the wedding UUID; policies verify membership and write role.
- Never use the service-role key in the client. A privileged invitation flow must use an authenticated, validated, rate-limited Edge Function; otherwise defer invitations.
- Add policy tests proving: a non-member cannot access another wedding; a viewer cannot mutate; an editor cannot perform owner-only actions.

## 6. Navigation and screen behavior

Use four bottom tabs in this order: **Home**, **Plan**, **Money**, **More**. Use stack/modal routes for details and create/edit forms. Android back closes sheets/dialogs before navigating. Type all route parameters.

### Home

- Mangalya header with geometric M mark, wordmark, tagline, notification target, and avatar initials.
- Dark botanical-green hero with wedding name, main date, location, days remaining, and next event. After the date, show respectful completed/elapsed wording, never a negative countdown.
- “Next actions” shows at most three incomplete tasks sorted overdue, then priority, then due date. Rows include title, linked event, readable due state, priority/overdue text, and accessible completion checkbox.
- Completion prevents double taps, handles pending/error, updates cache correctly, and may give one subtle success haptic.
- “Budget overview” shows planned, spent, paid, and outstanding with Indian number formatting and a meaningful utilization bar.
- One floating Add action opens a sheet for Add task, Add expense, Add event. No competing quick-action CTAs.

### Plan

Use one segmented control for Events and Tasks.

Events:

- Chronological vertical timeline showing date, name, location/time, and linked-task progress.
- Main wedding-date event has non-color-only emphasis.
- Event detail shows date/time/location/notes, linked tasks, required-item progress, vendor names derived from expenses, expense totals, edit, and confirmed delete.
- Deleting an event unlinks its tasks/expenses transactionally; it does not delete them.

Tasks:

- Summary/progress, quick chips for All, This week, Wedding/main event, and High/Critical.
- Advanced sheet for status, priority, event, and due/overdue with active count and one-tap clear.
- Incomplete tasks appear before completed; sort by due date then priority. Overdue never relies only on color.
- Distinguish “no tasks” from “no filter matches.”
- Task detail shows status, priority, due date, responsible person, event, category, description/notes, editable checklist, private attachments, edit, and confirmed delete.
- Attachments accept JPG/PNG/PDF up to 5 MB, show name/size, use signed URLs, and can be removed.

### Budget

- Use one target-based dashboard: target/spent/pending summary, newest-created expenses, then exact labelled category bars that filter the list.
- Use FlashList. Preserve safe-area and fixed-action clearance. Do not add payment-status filters or a chart dependency.
- Expense cards show title, actual amount, category, expense date, note/attachment state, and never repeat wedding context. Zero-actual legacy records say “Amount not recorded” and open editing rather than showing an estimate.
- Distinguish empty data from no filter matches.
- Detail shows category, actual amount, expense date, note, receipt, edit, and confirmed delete.
- Quick capture is title → mandatory visual category → positive amount → immediate save with the local current date. Previous-title suggestions reuse only title/category. Post-save details are date, note, and one receipt.

### More

- Header, title, and restrained decorative botanical illustration hidden from accessibility services.
- Compact Planning shortcuts may link only to implemented flows. Omit unfinished Support interactions.
- Adaptive feature grid: Budget & Expenses, Settings, Guests, Gifts, Backup & Export, Emergency Contacts. Omit unfinished About/Feedback interactions.
- Settings has one Wedding details editor for name, date, location, and style/tradition; Budget owns its target. Keep INR fixed and separate sign-out/deletion controls. Demo reset exists only in development.
- Guests are household-first with search/filter, summary counts, CRUD, nested guests, RSVP and practical statuses, and confirmed deletion.
- Gifts support filtering and CRUD for given/received/return gifts, value and estimated flag, thank-you/return-gift follow-up, notes, and confirmed deletion.
- Emergency Contacts support validated CRUD and safe `tel:` calling with error handling.
- Backup exports a versioned JSON snapshot plus escaped CSV for expenses/tasks/guests. Exclude signed URLs and file bytes. Validate imports with Zod, show a summary, require owner confirmation, and apply atomically through a secure transaction/RPC. Never allow a file to select another wedding.

## 7. Forms and mutations

- React Hook Form + Zod at every input boundary.
- Keep required fields first; optional context belongs in an “Add details” disclosure.
- Use visible labels, inline errors, and a safe submission error near the action.
- Keep save reachable above the keyboard with safe-area-aware scrolling/footer.
- Disable while pending and prevent duplicate mutations.
- Use native Android date/time pickers and reader-friendly values; persist date-only and `HH:mm` appropriately.
- Destructive actions use a clear confirmation dialog.
- Viewer UI is visibly read-only, but server RLS remains the real enforcement.

## 8. Visual system

The app should feel warm, premium, calm, trustworthy, and practical—not like generic SaaS or a decorative invitation.

Use one shared token source:

```json
{
  "colors": {
    "surface": "#F9F8F6",
    "surfaceRaised": "#FFFFFF",
    "surfaceSubtle": "#F3F1ED",
    "textPrimary": "#1F2937",
    "textSecondary": "#6B7280",
    "border": "#E5E7EB",
    "brand": "#244538",
    "brandDeep": "#1A3329",
    "brandOn": "#FFFFFF",
    "brandSoft": "#E8EFEB",
    "accent": "#C59A5C",
    "accentSoft": "#F6EFE5",
    "action": "#B65C41",
    "actionSoft": "#F8EAE5",
    "success": "#466A58",
    "successSoft": "#E8F1EC",
    "warning": "#8A6428",
    "warningSoft": "#F8F0DE",
    "danger": "#A44932",
    "dangerSoft": "#F8E8E3",
    "info": "#536078",
    "focus": "#244538"
  },
  "spacing": { "2xs": 4, "xs": 8, "sm": 12, "md": 16, "lg": 20, "xl": 24, "2xl": 32, "3xl": 40 },
  "radius": { "sm": 8, "control": 12, "card": 16, "sheet": 24 },
  "motionMs": { "quick": 120, "standard": 180, "emphasized": 240 },
  "iconSize": { "sm": 18, "md": 22, "lg": 26 },
  "touchTarget": 48
}
```

- EB Garamond 600/700 for display/title/heading; Manrope 400/500/600/700 for body/label/caption. Explicitly load weights; do not rely on Android synthetic fonts.
- Suggested type roles: display 30/38, title 25/32, heading 17/24, body 16/24, label 14/20, caption 13/18.
- Use cards only for meaningful grouping. Avoid nested cards, gradients, glassmorphism, saturated pink, random category colors, or ornamental wrappers.
- Green establishes context, antique gold is sparse detail, terracotta identifies the single primary action/active navigation, and semantic colors communicate state with text.
- Use Lucide outline icons consistently. Use motion only for sheets, dialogs, press feedback, and meaningful state changes (150–300 ms); respect reduced motion.
- Build reusable primitives: `AppText`, `Screen`, `Button`, `IconButton`, `TextField`, `DateField`, `TimeField`, `SelectField`, `Card`, `ListRow`, `StatusBadge`, `ProgressBar`, `SegmentedControl`, `FilterChip`, `FilterSheet`, `Disclosure`, `EmptyState`, `LoadingState`, `ErrorState`, `ConfirmationDialog`.
- Dark mode is not required. Do not ship an untested partial theme; keep tokens semantic for a future verified theme.

## 9. Accessibility, responsive layout, and interaction

- Meet WCAG AA contrast. Status uses label/shape plus color.
- Minimum 48x48dp Android targets with immediate pressed feedback and correct roles, labels, state, and focus order.
- Support 360dp Android width, larger system text, portrait/landscape, safe areas, keyboard, and tablet gutters without whole-screen horizontal scrolling. Filter-chip rails may intentionally scroll.
- No content may hide under tab bars, fixed actions, status/navigation bars, or keyboard.
- Forms use visible labels and helpful errors. Decorative images are hidden from accessibility services; meaningful images have alternatives.
- Use one primary action per screen. Disabled controls look disabled and cannot fire.
- Use clear user-safe errors without logging names, phones, finances, documents, tokens, or secrets.

## 10. Money and date rules

- Centralize rupee-to-paise parsing, arithmetic, and Indian grouping (`₹28,00,000`). Reject malformed, negative, NaN, and overflow values.
- Define: planned = sum of estimates (with a documented fallback rule if deliberately used); spent = sum actual; paid = sum paid; outstanding = max(0, spent - paid). Do not conflate planned and spent.
- Centralize date-only parsing/formatting and overdue/this-week logic. Avoid UTC conversion that shifts a date on the device.
- Do not add countdown seconds; day-level planning is calmer and avoids needless timers.

## 11. Data, privacy, and resilience

- Use TanStack Query keys scoped by wedding and feature; invalidate narrowly after mutations. Do not store fetched server data in Context/Zustand.
- Use optimistic updates only where rollback/error behavior is clear; otherwise show honest pending state.
- Validate form input, imports, database constraints, and trusted server boundaries.
- Use private Storage with collision-safe paths, MIME/size validation, signed read URLs, and cleanup after deletion/replacement.
- Do not log PII or private financial/document data. Configure Sentry scrubbing before beta.
- Do not silently seed production accounts. Demo data must be explicit and development-only.

## 12. Testing and verification

Add focused tests for:

- money parsing/arithmetic/formatting and date-only/overdue logic
- Zod form and import validation
- selectors, sorting, filters, summaries, and migrations
- pending/duplicate-submit behavior and loading/empty/error/retry/read-only UI
- destructive confirmation and import atomicity
- RLS isolation for non-member, viewer, editor, and owner
- first-success integration journey

Configure and make these pass:

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run format:check
```

Add an end-to-end mobile smoke path (Maestro or equivalent) for sign-in/onboarding, event creation, task completion, and expense creation if supported. Document manual checks for 360dp Android, large text, TalkBack, keyboard/back, rapid duplicate taps, and failed network.

## 13. Deliverables and build sequence

Deliver Expo source, Supabase migrations/RLS/Storage policies, safe `.env.example` containing public configuration names only, generated database types, tests, README setup/run/migration/seed/build instructions, and an architecture note covering online-first behavior, roles, money/date rules, and boundaries.

Build runnable vertical slices in this order:

1. Expo shell, tokens, primitives, providers, Supabase client, session/error boundaries.
2. Real auth, onboarding, atomic owner/wedding creation.
3. Events, tasks, Home prioritization, and Plan details/forms.
4. Categories, expenses, receipts, Money summaries and filters.
5. Guests, gifts, contacts, settings, backup/export/import.
6. Role-aware collaboration UI and full RLS/Storage policy verification.
7. Accessibility/responsive polish, Sentry scrubbing, smoke tests, documentation.

After every slice run relevant tests, typecheck, lint, and formatting. Fix failures before moving on. Never claim an unrun check passed.

## 14. Final acceptance criteria

The build is complete only when:

- A new user can sign in, create a private wedding, add an event/task, complete the task, record an expense, and understand the money summary.
- An unrelated user cannot read or mutate that wedding by direct API calls.
- Owner/editor/viewer behavior is enforced by RLS and reflected in UI.
- Cultural suggestions are optional, editable, reorderable, and removable.
- Money uses integer paise and dates follow date-only rules.
- Primary screens have coherent loading, empty, error/retry, and read-only states.
- Essential journeys have no placeholders, fake network calls, dead CTAs, or hardcoded production user data.
- UI works at 360dp and large text with safe areas, 48dp targets, accessible labels, and non-color-only states.
- Required quality commands pass and another engineer can reproduce the build from the README.

Begin with the repository structure and a brief checklist, then immediately implement. Continue until the acceptance criteria are met. At completion report what was built, exact checks and results, deliberately deferred non-core items, and the safe next release step.

## END PROMPT

---

## Audit basis

This prompt was derived from the current Expo repository, product/architecture/UI documents, implemented workspace model, route tree, forms, and design references. On 17 July 2026, typecheck, lint, formatting, and all 20 Jest suites (61 tests) passed. The current codebase is strongest as a polished device-local workspace; real authentication/onboarding, Supabase application tables and RLS, shared roles, and production collaboration are its major unfinished areas, so this prompt makes them required build work.
