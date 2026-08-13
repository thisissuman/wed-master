# UI system

Mangalya uses a warm ivory, plum, and antique-gold visual system for a calm, premium planning workspace. The base experience stays light for readability while a small set of deep-plum “night” surfaces anchors emotionally important moments. This is selective contrast, not a global dark theme. The live implementation and semantic tokens are the visual authority; real workspace data and accessible mobile behavior take precedence over historical mock-ups.

## Single source of truth

`src/theme/tokens.json` is the value source for TypeScript and NativeWind v4. Screens use semantic roles and shared primitives; they do not introduce raw colours, spacing, radii, shadows, or motion durations.

## Colour system

This phase has one light base theme plus explicit night-surface variants. Semantic roles describe purpose rather than a specific hue.

| Role                             | Value                     | Use                                                 |
| -------------------------------- | ------------------------- | --------------------------------------------------- |
| `canvas`                         | `#FCF8F5`                 | warm ivory app and system-chrome background         |
| `surface`                        | `#F7F0F3`                 | grouped lavender-tinted content                     |
| `elevatedSurface`                | `#FFFDFC`                 | cards, forms, and sheets                            |
| `surfaceMuted`                   | `#F2EAF1`                 | selected and supporting areas                       |
| `primary` / `primarySoft`        | `#714184` / `#F0E6F2`     | primary actions, active state, and key progress     |
| `secondary` / `secondarySoft`    | `#6D567C` / `#E9E3EC`     | restrained supporting emphasis                      |
| `accent` / `accentSoft`          | `#95601A` / `#F6E8D1`     | accessible antique-gold detail used sparingly       |
| `textPrimary`                    | `#2B1835`                 | plum headings and body copy                         |
| `textSecondary` / `textMuted`    | `#62586A` / `#746A79`     | supporting copy and metadata                        |
| `borderSubtle` / `borderStrong`  | `#E3D9E2` / `#BCAEC3`     | division and control boundaries                     |
| `nightSurface` / `nightElevated` | `#281632` / `#3B2347`     | Home hero, Money summary, and dark icon wells       |
| `navigationSurface`              | `#472E54`                 | lighter plum root navigation shell                  |
| `onNight` / `onNightMuted`       | `#FFF8F2` / `#D8CADB`     | primary and supporting copy on night surfaces       |
| `nightAccent` / `nightBorder`    | `#E4B66C` / `#5D4268`     | active detail and structure on night surfaces       |
| `success`, `warning`, `danger`   | semantic accessible roles | completed, attention, overdue, and destructive text |

Night surfaces are limited to the Home wedding hero, Money budget summary, root navigation, and transient feedback. Forms, long lists, More, and utility screens remain light. Status remains understandable without colour, and user photos retain their source colours.

## Type, shape, and spacing

- EB Garamond is reserved for the Mangalya wordmark, wedding names, and countdown values. Functional page/section titles and copy use Manrope.
- Body copy is 16/24; functional text remains at least 12dp and respects system scaling. Money values use tabular numerals and reflow for large text.
- Use the 4/8dp rhythm. Controls have a 48dp minimum target; text, date, time, number, and select fields are 56dp tall.
- Controls use 14dp radii, cards 16dp, the tab shell 22dp, and sheets 24dp.
- Filled or outlined surfaces organize content. Shadows are reserved for floating navigation, sheets, snackbars, truly elevated actions, and a soft raised treatment on the Home budget affordance and More navigation tiles.
- Long text and large Dynamic Type reflow. Compact Home money uses lakh/crore notation visually while full INR values remain available to assistive technology.
- `layout.expandedWidth` (`600dp`), `layout.largeTextScale` (`1.3`), and `layout.sideBySideControlsMinWidth` (`380dp`) are shared structural thresholds. Components use the responsive helpers rather than repeating numeric checks.

## Motion

Press feedback uses 90ms down and 140ms release transitions. Shared exit, tab, state, and entrance presets are 160ms, 180ms, 200ms, and 240ms with strong ease-out or intentional move curves. UI exits never use ease-in. Animate transforms and opacity instead of layout where possible. Reanimated transitions use `ReduceMotion.System`; navigation and modal custom transitions become `none` when Reduce Motion is enabled. Routine lists and repeated screen visits do not stagger, sparkle, bounce, or loop.

## Navigation and global chrome

- `MangalyaHeader` is a Home-only wordmark header. Plan, Money, More, and utility routes use direct functional titles without repeating the brand above them.
- The four-destination shell participates in layout only on exact Home, Plan, Money, and More roots. It is a lighter-plum bottom bar on compact windows and an 88dp left rail at 600dp and above. Expanded items stretch across the rail and flex evenly through its height; every pressable retains at least 48×48dp. Pushed detail/create/edit and nested More routes hide it while preserving the owning tab in navigation state.
- Home, Plan, Money, and More retain their routes. The Money label continues to use `/budget`; the pushed `/budget/overview` analytics route hides the tab bar and preserves a visible fallback-aware back action. Tab fades are brief and disabled under Reduce Motion.
- Leaving More pops its nested stack to `index`, so reopening the tab never restores a previously visited Guests or utility screen. Detail screens use platform-default stack transitions. Create/edit forms use bottom-modal transitions except quick expense creation, which uses a transparent route-backed overlay. Status and navigation bars use the ivory surface with dark system content.

## Screen rules

- **Home:** wordmark → deep-plum wedding summary → Focus today → Budget overview → Quick actions. The former full-screen heart artwork and duplicate expense FAB are retired; short screens still scroll naturally above navigation.
- **Wedding summary:** show the real circular cover, labelled camera action, wedding name/date, active-task progress, and live date-only countdown in one restrained night surface. Tapping the whole card moves an equal-size copy to the centre over a blurred, dimmed background; the only instruction is “Tap the card”. A second tap performs one reduced-motion-aware 3D turn to the couple's editable private message. Outside tap and Android Back dismiss it. One code-native ring ornament may support the composition without competing with data. The cover fallback remains actionable when the photo is missing.
- **Focus today:** exclude completed/cancelled tasks and show at most two, ranked overdue, due today, priority, due date, then stable title/id. Task rows use a labelled animated checkbox, category-aware Lucide icon, two-line title, wrapping metadata, textual status, and disclosure. Accent rails and routine card shadows are prohibited; full titles remain in accessible labels.
- **Budget overview:** the wedding target is the only plan. Spent is the sum of actual amounts; Pending is target minus spent, while overspending is labelled “Over by”. Home uses one lightly raised accessible pressable with a compact progress bar. The drill-down begins with a night Target/Spent/Pending-or-Over summary and icon-only target editor, then selectable 30-day/90-day/all-time trend → all-time insights → Where money went, with a secondary path back to recent expenses.
- **Quick actions:** Add task, Add expense, Add event, and Add guest navigate directly to their forms. They remain one compact tonal row at normal text sizes and reflow to two stable rows for large system text. No second creation affordance duplicates them on Home.
- **Plan:** the segmented order is always Tasks, Events. Taps update local selected state immediately and never write route parameters on the critical path; route parameters initialize or externally change the view. Tasks use one shallow `Today · Overdue · Completed` strip and one compact Filters control with an active-count badge. Events offer a duplicate-safe Suggested events chooser; Wedding is the only setup default and every suggested custom remains removable and editable. Preserve FlashList virtualization, mount only the active list, and memoize sorted data, maps, callbacks, and rows. Task cells use stable keys, recycled-item state reset, prepared layout transitions before completion reorders, and the shared native task-card contract.
- **Money and More:** `/budget` begins with a night budget-position summary, then groups virtualized expenses under newest-date-first headers. Each compact row keeps title first, category/receipt metadata second, and the exact actual amount at the trailing edge. One fixed Add expense action remains. `/budget/overview` keeps exact INR analytics and accessible trends. Legacy zero-actual records say “Amount not recorded” and open editing; estimates are never shown as spending. More removes the redundant Budget shortcut and returns to a two-column tool grid with dark icon wells; large text stacks every tile and the unmatched final destination spans the row.
- **Guests, households, and gifts:** Guests uses one shallow Households/Invited/Confirmed strip, household-name search, concise household rows, household-level RSVP, and actionable stay/transport exception badges. Individual legacy guest names remain hidden. Gifts exposes Received records only; the form starts with Received from and Value, while optional Relationship and Gift description live under More details. Historical Given, Return Gift, date, estimate, and follow-up data remain stored but are not surfaced.
- **First-run setup:** collect required Couple names and a date-only Wedding date, plus an optional INR budget, native-cropped 16:9 wedding photo, and opt-in suggested events. Persist INR as integer paise. Hidden required compatibility fields begin as editable neutral values (`To be decided` and `Not specified`). Photo cancellation or permission denial never blocks setup, and replaced or abandoned staged files are removed.
- **Details and forms:** key facts first, a visible fallback-aware back action, explicit pending/error/not-found states, and confirmed destructive actions. Wedding details also owns the optional keepsake message shown on the reverse of the Home card; blank workspaces use the product default and saved messages remain within the existing workspace backup contract. Event detail uses a compact date/time/venue/progress summary, related tasks, notes, and receipt-style linked expenses; required-item counters and event imagery are not active UI. Task detail excludes checklists, attachments, and More Actions; confirmed deletion lives in Edit Task. `FormShell` shows only the functional back action and title—no promotional description, botanical backdrop, or sparkle ornament. Quick expense capture is title → compact mandatory category → positive amount → immediate save. The keyboard-resizing overlay stays above the Android keyboard; the category sheet puts Other first and uses one stateful categories/task/event flow with a 60–84% related-item surface and virtualized search. Successful creation returns directly to the owning list, where the new row receives one short transform/opacity breath that respects Reduce Motion. Routine create/update success never opens a toast; destructive Undo remains available for five seconds.

## Component contracts

- `Screen` owns safe-area background and outer bounds.
- `AppText` owns typography roles and semantic text tones, including bounded serif emotional roles and `onNight` variants.
- `PageHeader` owns compact functional root titles. The Home wordmark is not a generic page title.
- `Button`, `IconButton`, and `MotionPressable` preserve 48dp targets, pending state, accessible labels, and restrained feedback.
- `TextField`, `DateField`, `TimeField`, and `SelectField` share 56dp labelled elevated controls, optional leading Lucide icons, inline error/helper copy, visible focus/pressed feedback, and clearable optional dates/times.
- `AppBottomSheet` owns modal option/filter/suggestion presentation: phone bottom sheet, centred expanded panel, scrim/backdrop close, Android Back, labelled close action, safe areas, keyboard avoidance, reduced motion, and no fake drag handle.
- `SelectField` opens `AppBottomSheet` instead of changing form layout inline. Options expose radio semantics, text/checkmark selection, optional icons/descriptions, haptics, trigger-focus restoration, and automatic search for lists longer than eight items. Colour never carries selection alone.
- `FormShell` owns the keyboard-safe scroll region, compact functional header, submission error, and fixed primary action. Feature forms own field order and validation.
- `TaskCompletionRow` owns checkbox semantics, completion motion, checked state, recycled-ID reset, and compact/detailed presentation.
- `StatusBadge` always includes short text. Shared progress indicators expose a numeric and textual accessibility value.
- `SegmentedControl` uses one translated active indicator and crossfaded labels, while `FilterChip` and `FilterSheet` expose state in text, shape, and accessibility metadata. Task filter choices remain inside their parent sheet to avoid nested native modals.
- `ConfirmationDialog` protects destructive actions. Submissions prevent duplicate requests and display actionable failures.
- `EmptyState` is a shared 64dp-minimum row with an optional concise description and code-native icon. It has no image contract. When it is the sole creation path the entire row becomes the `+ Add…` action; when a footer or FAB already creates records it stays neutral. Filtered-empty rows reset the current filter/search instead of adding another creation action. Dynamic Type may expand the row vertically.

## Local media and accessibility

- The wedding cover is copied into app-owned document storage after native 16:9 cropping. First-run selection remains staged until the workspace write succeeds; replacing, removing, or abandoning setup cleans up the staged copy. Event-cover selection is retired; legacy references remain preserved. Structured backups exclude local photo and attachment URIs/bytes.
- Generated decorative assets live under `assets/images/mangalya`, are optimized for their rendered size, reserve fixed layout space, ignore touch, and remain hidden from accessibility services. Live countdown text and semantic labels never become raster content.
- Decorative SVG gradients and flourishes are hidden from accessibility services and ignore touch.
- TalkBack order follows the visual content order. Every non-text control is labelled; completion controls expose checked/disabled state; countdown and progress visuals expose equivalent text.
- Support Android at 360dp, larger system text, and tablet/landscape layouts without clipped titles, truncated money, hidden actions, or whole-screen horizontal scrolling.
