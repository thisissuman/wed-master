# Product brief

## Vision

Mangalya becomes the trusted operating system for Indian weddings: a private workspace for planning, money, people, and documents. Over time it can add carefully authorized collaboration, web/admin operations, marketplace capabilities, analytics, invitations, and AI assistance without diluting the planning core.

## Users and jobs

| User                     | Primary job                                          | Current pain                                                           |
| ------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Couple or family planner | know the next important action and spending position | plans are split across chats, calls, notes, and spreadsheets           |
| Family collaborator      | own and complete assigned work                       | responsibilities are vague and updates are hard to find                |
| Wedding planner          | coordinate several workspaces                        | status and client communication are fragmented                         |
| Vendor / admin           | serve a limited future role                          | requires trust, verification, and permissions beyond the planning core |

Indian weddings are multi-event and multi-household. The product must accommodate variation rather than encode one definition of a wedding.

## Product roadmap

### Current private local beta

1. Fresh installations create a real local wedding workspace; production never silently seeds a demo wedding.
2. Essentials-only local setup with required couple names and wedding date, optional INR budget and cropped wedding photo, plus an opt-in editable starter-event chooser.
3. Tasks with event, due date, priority, and status.
4. Fast actual-expense capture, a wedding budget target, a date-based spending trend, ranked category insights, recent costs, and optional receipts.
5. Searchable guest households with household-level RSVP, invitation, stay and transport data; lightweight received-gift tracking; emergency contacts; structured backup/restore; expenses CSV export; and recovery.
6. A private device-local Inspire board with gallery/camera capture, natural-ratio masonry, favourites, categories, search, optional event links, and detail/edit/share/delete flows.

The immediate milestone is Android local-beta hardening: current native builds, reliable first-run activation, privacy-accurate backup behavior, responsive phone/tablet layouts, Inspire media performance, and physical-device accessibility. Fresh production workspaces keep Inspire storage empty while the unfiltered zero-item board renders five bundled read-only examples; those examples are never persisted and disappear after the first personal image. Development-only demo reset may still install the generated demo pack. Shared workspaces begin only after this gate passes.

Inspire follow-up work owns external URLs, collections, comparison, a selected direction, vendor/expense links, shared authorship, cloud storage, and AI assistance. None of those are implied by the local board.

### V1: make the workspace shared and operational (after local-beta hardening)

- Invitations and roles: owner, editor, viewer
- Vendors, payment schedules, attachments, receipts, and reminders
- Guest households, RSVP, rooms, transport, and activity history

### V2: deepen the Indian-wedding advantage

- Sourced, editable ceremony templates
- Jewellery, shopping, gifts, documents, packing, and spreadsheet import/export
- Multi-language UI, richer reporting, and web companion

### V3: platform expansion

- Admin dashboard, planner multi-workspace tooling, verified vendors, vendor portal, quote comparison, and marketplace foundations

### Future

- AI suggestions, receipt extraction, risk summaries, digital invitations, budget intelligence, and payment products

Features belong later when they depend on usage data, operational trust, or regulated workflows. Marketplace, payment, and AI features must not delay a reliable planning experience.

## Product principles

- **Editable defaults:** all cultural content is suggested, editable, reorderable, and removable.
- **Financial clarity:** spending means recorded actual cost. Historical planning/payment metadata remains intact for compatibility but is never silently reinterpreted as spending.
- **Calm prioritisation:** Home shows useful next actions, not a dashboard of vanity metrics.
- **Household-aware planning:** people, accommodation, transport, and invitations eventually support household decisions.
- **Privacy by default:** roles are explicit; data is never public by accident.
- **Honest resilience:** Mangalya does not upload the current workspace; show loading, errors, recovery, and retry without implying cloud backup, guaranteed single-device residency, or multi-device sync.

## Current release commitments

- **Platform:** Android first through Expo, with architecture that remains portable to iOS and web.
- **Brand:** premium, warm, calm, personal, and recognizably Indian without making a region, religion, ceremony, or family custom mandatory. Royal Plum and Lavender Pearl are the two production themes.
- **Data contracts:** planning dates stay date-only and money is stored as integer INR paise. User data remains editable and private by default.
- **Product boundary:** the local planner remains useful without AI, marketplace, payments, shared accounts, or an offline-sync engine. Generated Inspire examples are illustrative demo material, not a real couple's wedding or third-party content.
- **Inclusion:** support TalkBack, 48dp touch targets, large system text, reduced motion, non-colour-only state, sufficient contrast in both themes, and compact Android devices.

## First success signal

A new user enters the couple names and wedding date, optionally adds a budget and photo, then can add an event, task, expense, or guest without deciphering an oversized empty dashboard.
