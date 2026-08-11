# UI system

Mangalya uses a fixed light lavender-and-ivory visual system for a calm, premium planning workspace. The live implementation, semantic tokens, and optimized `home-hearts-glow-v2.jpg` asset are the visual authority; real workspace data and accessible mobile behavior take precedence over historical mock-ups.

## Single source of truth

`src/theme/tokens.json` is the value source for TypeScript and NativeWind v4. Screens use semantic roles and shared primitives; they do not introduce raw colours, spacing, radii, shadows, or motion durations.

## Colour system

This phase has one light theme. Semantic roles describe purpose rather than a specific hue.

| Role                            | Value                     | Use                                                 |
| ------------------------------- | ------------------------- | --------------------------------------------------- |
| `canvas`                        | `#FBF7F4`                 | warm ivory app and system-chrome background         |
| `surface`                       | `#F7F0F4`                 | grouped lavender-tinted content                     |
| `elevatedSurface`               | `#FFFCFA`                 | cards, forms, sheets, and Android tab fallback      |
| `surfaceMuted`                  | `#F1EAF4`                 | selected and supporting areas                       |
| `primary` / `primarySoft`       | `#74458F` / `#EDE3F2`     | primary actions, active state, and key progress     |
| `secondary` / `secondarySoft`   | `#6D567C` / `#E9E3EC`     | restrained supporting emphasis                      |
| `accent` / `accentSoft`         | `#9A6118` / `#F6E8D1`     | accessible antique-gold detail used sparingly       |
| `textPrimary`                   | `#2D193F`                 | plum headings and body copy                         |
| `textSecondary` / `textMuted`   | `#665D70` / `#766D7F`     | supporting copy and metadata                        |
| `borderSubtle` / `borderStrong` | `#DED3E3` / `#BFAFC8`     | division and control boundaries                     |
| `success`, `warning`, `danger`  | semantic accessible roles | completed, attention, overdue, and destructive text |

Home alone layers the optimized `home-hearts-glow-v2.jpg` artwork over the lavender/ivory canvas and fades it back to `canvas` below the upper third. The artwork uses airy, low-contrast dusty-rose hearts sized to remain visible behind the interface and a periwinkle glow; it must never reduce text contrast. Status remains understandable without colour. Translucent surfaces have an opaque Android fallback. User photos and content illustrations retain their source colours.

## Type, shape, and spacing

- Wordmark, wedding names, countdown values, and section titles use EB Garamond. Functional copy remains Manrope.
- Functional text remains at least 12dp. Compact budget values use a 16dp heading role and reflow for large system text.
- Use the 4/8dp rhythm. Controls have a 48dp minimum target.
- Controls use 14dp radii, cards 20dp, the tab shell 24dp, and sheets 28dp.
- Cards use low-opacity `card`, `elevated`, or `floating` shadows. Elevation communicates hierarchy rather than decorating every row.
- Long text and large Dynamic Type reflow. Compact Home money uses lakh/crore notation visually while full INR values remain available to assistive technology.
- `layout.expandedWidth` (`600dp`), `layout.largeTextScale` (`1.3`), and `layout.sideBySideControlsMinWidth` (`380dp`) are shared structural thresholds. Components use the responsive helpers rather than repeating numeric checks.

## Motion

Press feedback uses a short 100ms Reanimated transition. Shared exit, state, and entrance presets remain 180ms, 240ms, and 300ms with ease-out timing. Reanimated transitions use `ReduceMotion.System`; navigation and modal custom transitions become `none` when Reduce Motion is enabled. Home may run one three-sparkle opacity/scale burst when it gains focus. The burst stays on the UI thread, is hidden from accessibility, stops under Reduce Motion, and never loops.

## Navigation and global chrome

- `MangalyaHeader` is a compact wordmark header. It renders a 48dp search action only when a screen supplies a working search interaction; Home currently omits it.
- The four-destination shell participates in layout only on exact Home, Plan, Money, and More roots. It is a bottom navigation bar on compact windows and a left material rail at 600dp and above. Pushed detail/create/edit and nested More routes hide it while preserving the owning tab in navigation state.
- Home, Plan, Money, and More retain their routes. The Money label continues to use `/budget`; the pushed `/budget/overview` analytics route hides the tab bar and preserves a visible fallback-aware back action. Tab fades are brief and disabled under Reduce Motion.
- Leaving More pops its nested stack to `index`, so reopening the tab never restores a previously visited Guests or utility screen. Detail screens use platform-default stack transitions. Create/edit forms use bottom-modal transitions except quick expense creation, which uses a transparent route-backed overlay. Status and navigation bars use the ivory surface with dark system content.

## Screen rules

- **Home:** wordmark/search → open wedding summary → Focus today → Budget overview → Quick actions. Short screens scroll; content is never forced beneath the tab bar.
- **Wedding summary:** show the real circular cover, labelled camera action, wedding name/date, active-task progress, and date-only glass countdown. The generated transparent `countdown-halo.png` supplies the luminous periwinkle rings and gold leaf ornament around live text; the code-native radial fill remains beneath it. The cover fallback remains actionable when the photo is missing.
- **Focus today:** exclude completed/cancelled tasks and show at most two, ranked overdue, due today, priority, due date, then stable title/id. Each task is an independent rounded card with a lavender accent rail, a vertically centred labelled checkbox, a rounded-square category-aware Lucide icon, a title clamped to two lines above wrapping metadata, and a textual priority/status badge plus disclosure chevron. Large system text stacks the status action below metadata. Nested horizontal title scrolling is prohibited; the full title remains in the accessible task label. The same native-layout card contract is shared with Plan and event-detail task lists.
- **Budget overview:** the wedding target is the only plan. Spent is the sum of actual amounts; Pending is target minus spent, while overspending is labelled “Over by”. The Home card remains one accessible pressable with a compact progress bar. Home, More, and Settings open `/budget/overview`. That drill-down begins with one shallow Target/Spent/Pending-or-Over strip and an icon-only target editor, then selectable 30-day/90-day/all-time spending trend → all-time insights → Where money went, with a secondary path back to recent expenses. It does not repeat a “Budget position” heading or narrate the obvious target comparison.
- **Quick actions:** Add task, Add expense, Add event, and Add guest navigate directly to their forms. They remain one row at normal text sizes and reflow to two stable rows for large system text. Home also has a 56dp floating Add expense action above the tab bar; scroll content reserves its clearance.
- **Plan:** the segmented order is always Tasks, Events. Taps update local selected state immediately and never write route parameters on the critical path; route parameters initialize or externally change the view. Tasks use one shallow `Today · Overdue · Completed` strip and one compact Filters control with an active-count badge. Events offer a duplicate-safe Suggested events chooser; Wedding is the only setup default and every suggested custom remains removable and editable. Preserve FlashList virtualization, mount only the active list, and memoize sorted data, maps, callbacks, and rows. Task cells use stable keys, recycled-item state reset, prepared layout transitions before completion reorders, and the shared native task-card contract.
- **Money and More:** `/budget` keeps the newest-created recent-expense list primary, with a compact secondary path to `/budget/overview` and a fixed Add expense action. Expense cards use a receipt/transaction hierarchy: tinted category marker, title, date/attachment metadata, and dominant actual amount. `/budget/overview` shows category bars with exact INR amounts and percentages, ranked highest spending first. Its custom SVG trend uses a smooth area line for four or more plotted periods and direct bars for sparse data, with visible values, date labels, an accessible summary, and reduced-motion entrance. Legacy zero-actual records say “Amount not recorded” and open editing; estimates are never shown as spending. More uses a two-column feature grid at normal text sizes and full-width rows for large system text. Backup is a compact utility list limited to structured export, import, and expenses CSV; the data-only limitation and export history remain visible without a promotional hero.
- **Guests, households, and gifts:** Guests uses one shallow Households/Invited/Confirmed strip, household-name search, concise household rows, household-level RSVP, and actionable stay/transport exception badges. Individual legacy guest names remain hidden. Gifts exposes Received records only; the form starts with Received from and Value, while optional Relationship and Gift description live under More details. Historical Given, Return Gift, date, estimate, and follow-up data remain stored but are not surfaced.
- **First-run setup:** collect required Couple names and a date-only Wedding date, plus an optional INR budget, native-cropped 16:9 wedding photo, and opt-in suggested events. Persist INR as integer paise. Hidden required compatibility fields begin as editable neutral values (`To be decided` and `Not specified`). Photo cancellation or permission denial never blocks setup, and replaced or abandoned staged files are removed.
- **Details and forms:** key facts first, a visible fallback-aware back action, explicit pending/error/not-found states, and confirmed destructive actions. Event detail uses a compact date/time/venue/progress summary, related tasks, notes, and receipt-style linked expenses; required-item counters and event imagery are not active UI. Task detail excludes checklists, attachments, and More Actions; confirmed deletion lives in Edit Task. Quick expense capture is title → compact mandatory category → positive amount → immediate save. The keyboard-resizing overlay stays above the Android keyboard; the category sheet puts Other first and uses one stateful categories/task/event flow with a 60–84% related-item surface and virtualized search. The post-save state keeps date, note, one attachment, Done/Save details, and Add another inside that overlay. Passive feedback is a compact two-second pill; Undo actions remain available for five seconds.

## Component contracts

- `Screen` owns safe-area background and outer bounds.
- `AppText` owns typography roles and semantic text tones, including the bounded serif countdown role.
- `Button`, `IconButton`, and `MotionPressable` preserve 48dp targets, pending state, accessible labels, and restrained feedback.
- `TextField`, `DateField`, `TimeField`, and `SelectField` share labelled elevated controls, optional leading Lucide icons, inline error/helper copy, focus/pressed feedback, and clearable optional dates/times.
- `SelectField` expands a bounded, scrollable option panel directly beneath the field, with text selection state, optional icons/descriptions, a checkmark, tap feedback, and reduced-motion behavior. Its compact mode omits the duplicate option heading and explanatory line for filter sheets. Colour never carries selection alone.
- `FormShell` owns the keyboard-safe scroll region, premium form header, decorative background, submission error, and fixed primary action. Feature forms own field order and validation.
- `TaskCompletionRow` owns checkbox semantics, completion motion, checked state, recycled-ID reset, and compact/detailed presentation.
- `StatusBadge` always includes short text. Shared progress indicators expose a numeric and textual accessibility value.
- `SegmentedControl`, `FilterChip`, and `FilterSheet` expose selected/filter state in text, shape, and accessibility metadata. Compact filter and sort sheets use only a short title, controls, reset, and completion action.
- `ConfirmationDialog` protects destructive actions. Submissions prevent duplicate requests and display actionable failures.
- `EmptyState` is a shared 64dp-minimum row with an optional concise description and code-native icon. It has no image contract. When it is the sole creation path the entire row becomes the `+ Add…` action; when a footer or FAB already creates records it stays neutral. Filtered-empty rows reset the current filter/search instead of adding another creation action. Dynamic Type may expand the row vertically.

## Local media and accessibility

- The wedding cover is copied into app-owned document storage after native 16:9 cropping. First-run selection remains staged until the workspace write succeeds; replacing, removing, or abandoning setup cleans up the staged copy. Event-cover selection is retired; legacy references remain preserved. Structured backups exclude local photo and attachment URIs/bytes.
- Generated decorative assets live under `assets/images/mangalya`, are optimized for their rendered size, reserve fixed layout space, ignore touch, and remain hidden from accessibility services. Live countdown text and semantic labels never become raster content.
- Decorative SVG gradients and flourishes are hidden from accessibility services and ignore touch.
- TalkBack order follows the visual content order. Every non-text control is labelled; completion controls expose checked/disabled state; countdown and progress visuals expose equivalent text.
- Support Android at 360dp, larger system text, and tablet/landscape layouts without clipped titles, truncated money, hidden actions, or whole-screen horizontal scrolling.
