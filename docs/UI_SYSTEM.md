# UI system

Mangalya has two manually selected, app-wide themes with one semantic interface contract. Royal Plum is the fresh-install default and composes deep plum surfaces with antique-gold action and lavender/champagne detail. Lavender Pearl preserves the established light ivory, lavender, plum, and bridal-red application appearance. A selection changes onboarding, recovery, every workspace route, forms, transient UI, navigation, native system chrome, charts, and the matching Home wedding card together. Real workspace data and accessible mobile behavior take precedence over historical mock-ups.

## Single source of truth

`src/theme/tokens.json` owns values that do not change at runtime: typography, spacing, radii, motion, layout, artwork primitives, and shadow geometry. `src/theme/palettes.json` owns every runtime colour, gradient, translucent state, and shadow colour. `app-theme.ts` enforces the shared palette shape; `AppThemeProvider` installs CSS-variable-backed NativeWind roles and exposes runtime values for native props, SVG, gradients, ripples, and placeholders. `wedding-card-themes.ts` is keyed by the same `AppThemeId` and adds only intentional artwork-specific presentation values. Production screens use semantic roles and never restore fixed semantic colours.

## Colour system

Semantic roles describe purpose rather than a specific hue. The core palette mapping is:

| Role                            | Royal Plum            | Lavender Pearl        | Use                                       |
| ------------------------------- | --------------------- | --------------------- | ----------------------------------------- |
| `canvas`                        | `#1D0B23`             | `#FFF8F2`             | root and system background                |
| `surface` / `navigationSurface` | `#28102F` / `#28102F` | `#F6EEF7` / `#4B174D` | grouped content and navigation            |
| `elevatedSurface`               | `#35143D`             | `#FFFDFC`             | cards, forms, sheets, and dialogs         |
| `surfaceMuted`                  | `#432449`             | `#EFE5F2`             | supporting and selected regions           |
| `textPrimary`                   | `#FFF8F2`             | `#2B1835`             | headings and body copy                    |
| `textSecondary` / `textMuted`   | `#E9DFF0` / `#C8B8CD` | `#665B6D` / `#74687B` | supporting copy and metadata              |
| `primary` / `primarySoft`       | `#D9AA58` / `#4B3150` | `#C5163A` / `#E9DFF0` | actions, selection, focus, and soft state |
| `secondary` / `secondarySoft`   | `#C8A7DF` / `#4A2D50` | `#4B174D` / `#F2E9F4` | structural emphasis                       |
| `accent` / `accentSoft`         | `#F0D2A0` / `#4A351F` | `#8C5A14` / `#F8ECD8` | champagne/gold-family detail              |
| `borderSubtle` / `borderStrong` | `#57325E` / `#7A5780` | `#E4D7E6` / `#9A899F` | division and control boundaries           |
| `success` / `successSoft`       | `#A9D7B8` / `#243B31` | `#3E6852` / `#E7F0EA` | completed and healthy states              |
| `warning` / `warningSoft`       | `#F2C47C` / `#4A351F` | `#875719` / `#F8EAD4` | attention states                          |
| `danger` / `dangerSoft`         | `#F4A3A8` / `#4A202B` | `#A13D32` / `#F8E1DD` | errors and destructive actions            |

Royal Plum primary actions, selected compact navigation, focus rings, progress, and key highlights use antique gold; red is reserved for errors and destructive states. Lavender Pearl retains bridal red as its established primary. Both action-gradient endpoints maintain readable `onPrimary` content, and status is always communicated with text, shape, or accessibility state in addition to colour. User wedding photos and anime wedding artwork retain their source colours without a theme filter.

## Type, shape, and spacing

- EB Garamond is reserved for intentional decorative artwork: the Mangalya wordmark and wedding-card typography. Onboarding headings, user-entered artwork values, navigation, charts, dialogs, forms, and all operational UI use Manrope.
- Page titles are 28/34 bold, form titles 24/30 bold, section titles 16/21 semibold, body 15/22 medium, labels 14/19 semibold, and captions 13/18 medium. Functional text remains at least 12dp and respects system scaling. Money values use tabular numerals and reflow for large text.
- Use the 4/8dp rhythm. Controls have a 48dp minimum target; text, date, time, number, and select fields are 56dp tall. In NativeWind classes, the project `4xl` spacing token represents the 48dp touch target.
- Controls use 14dp radii, cards 16dp, the tab shell 22dp, and sheets 24dp.
- Filled or outlined surfaces organize content. Shadows are reserved for floating navigation, sheets, snackbars, truly elevated actions, and a soft raised treatment on the Home budget affordance and More navigation tiles. Shadow geometry is static; each palette supplies its own colour and opacity, with Royal Plum relying primarily on surface tone and borders for depth.
- Long text and large Dynamic Type reflow. Compact Home money uses lakh/crore notation visually while full INR values remain available to assistive technology.
- `layout.expandedWidth` (`600dp`), `layout.largeTextScale` (`1.3`), and `layout.sideBySideControlsMinWidth` (`380dp`) are shared structural thresholds. Components use the responsive helpers rather than repeating numeric checks.

## Motion

Press feedback uses 90ms down and 140ms release transitions. Shared exit, tab, state, and entrance presets are 160ms, 180ms, 200ms, and 240ms with strong ease-out or intentional move curves. UI exits never use ease-in. Animate transforms and opacity instead of layout where possible. Reanimated transitions use `ReduceMotion.System`; navigation and modal custom transitions become `none` when Reduce Motion is enabled. Routine lists and repeated screen visits do not stagger, sparkle, bounce, or loop.

## Navigation and global chrome

- `MangalyaHeader` is a Home-only wordmark header. Plan, Money, More, and utility routes use direct functional titles without repeating the brand above them.
- Home, Plan, Money, and More root headers carry one small bridal-red/lavender heart flourish. It is decorative, hidden from accessibility, and is not repeated on task-focused detail or form screens.
- The five-destination shell participates in layout only on exact Home, Plan, Inspire, Money, and More roots. Compact bottom navigation and the 88dp expanded rail both resolve their surfaces, borders, shadows, active indicators, and icon/text colours from the selected palette. Expanded items stretch across the rail and flex evenly through its height; compact-height landscape falls back to bottom navigation so every destination remains reachable. Every pressable retains at least 48×48dp. Labels remain functional 12dp text, scale through the 1.3 large-text breakpoint, and must fit the 360dp minimum without truncation. Pushed detail/create/edit and nested More routes hide it while preserving the owning tab in navigation state.
- Home, Plan, Inspire, Money, and More retain their routes. Inspire uses `/inspire`; the Money label continues to use `/budget`. Pushed Inspire details/forms and `/budget/overview` hide the tab bar and preserve a visible fallback-aware back action. Tab fades are brief and disabled under Reduce Motion.
- Leaving More pops its nested stack to `index`, so reopening the tab never restores a previously visited Guests or utility screen. Detail screens use platform-default stack transitions. Create/edit forms use bottom-modal transitions except quick expense creation, which uses a transparent route-backed overlay. React Native appearance, the status bar, root/system background, and Android navigation-button style follow the manually selected palette; Royal Plum uses light system content and Lavender Pearl uses dark system content.

## Screen rules

- **Onboarding:** follow the flow contract below. Empty artwork slots render no fallback copy;
  generated images remain decorative while controls and live copy carry functional meaning.
- **Home:** wordmark → selected wedding-card presentation → Focus today → Budget overview. Operational copy uses compact Manrope roles and section headings use the light theme accent. Focus rows are 56dp at standard text size, retain a separate 48dp completion target, and make the full remaining row the open action. Overflowing titles translate at a calm constant speed behind 16dp edge fades; Reduce Motion, TalkBack, and large text receive static two-line text. Home has no Quick actions strip; a 56dp circular Add expense FAB remains anchored at the scene’s bottom-right with scroll clearance above navigation.
- **Wedding summary:** show the real circular cover, labelled camera action, wedding name/date, active-task progress, and live date-only countdown in the card paired with the selected application theme. Both raster shells share one fixed overlay contract; no user data is baked into artwork. After the date passes, the card shows the couple, congratulations, and a one-time heart animation that respects Reduced Motion. Cover editing and the keepsake remain available. The full card is the labelled keepsake control and opens the centred modal when pressed; the nested camera action changes only the cover photo. The modal moves focus into its content, provides an explicit Close action, performs one reduced-motion-aware 3D turn to the couple's editable private message, and restores focus to the card on dismissal. The cover fallback remains actionable when the photo is missing. Settings exposes both application themes as labelled radio controls with visible previews and persists the choice outside the workspace snapshot and backup contract.
- **Focus today:** exclude completed/cancelled tasks and show at most two, ranked overdue, due today, priority, due date, then stable title/id. Task rows use a labelled animated checkbox, category-aware Lucide icon, overflow-only title marquee with static accessibility fallback, compact metadata, textual status, and disclosure. Accent rails and routine card shadows are prohibited; full titles remain in accessible labels.
- **Budget overview:** the wedding target is the only plan. Net spent is expenditure minus money got back; Home labels target minus spent as “Remaining”, while overspending is labelled “Over by”. Home uses one lightly raised accessible pressable with a compact progress bar. The drill-down retains its night Target/Spent/Pending-or-Over summary and icon-only target editor, then selectable 30-day/90-day/all-time trend → all-time insights → Where money went, with a secondary path back to recent expenses.
- **Plan:** the segmented order is always Tasks, Events. The header and control remain mounted; taps update local selected state immediately, the selected surface has a pre-measurement fallback, and list content switches without an entrance fade. Route parameters initialize or externally change the view without writes on the tap path. Tasks use one shallow `Today · Overdue · Completed` strip, one compact anchored Filters control containing Status and Priority, plus one Sort button beside Filters that toggles Due date/Recently actioned without a visible mode label (selected treatment and accessibility value expose state), immediate results, active count, and Reset, plus one Add task action. Plan titles use static two-line text to avoid marquee measurement and animation during recycled-row mounting; the two-target row interaction remains. Event and task suggestions are onboarding-only and never reappear in Plan. Preserve FlashList virtualization, use its default cell renderer with no cell or detailed-row layout transitions, disable maintainVisibleContentPosition for explicitly sorted tasks, mount only the active list, and memoize sorted data, maps, callbacks, and rows.
- **Inspire:** use a functional `PageHeader` with a quiet subtitle plus labelled Search and Add icon buttons. The board has a 16dp outer inset, 8dp gutter, Medium defaults to two phone columns, three columns from 600dp, and four on large tablets; Small adds one column and Big removes one (minimum one). FlashList masonry preserves chronological/assistive order; personal tiles use natural image ratios, restrained borders/radii, no shadows, with a readable saved-title caption and a subtle non-interactive heart on shortlisted items. An empty, unfiltered real board instead shows exactly five labelled bundled examples; they are read-only, never persisted, and disappear after the first personal image. Filters remain one horizontal non-wrapping row; the soft selected chip includes a checkmark and selected accessibility state. Search expands inline and combines with the active mutually exclusive All/Favourites/category filter. Detail uses the uncropped image followed by one editorial metadata flow and omits empty fields. Empty, skeleton, processing, denied-permission, error, retry, and broken-image states are feature-owned.
- **Money and More:** `/budget` begins with a night budget-position summary, then groups virtualized expenses under newest-date-first headers. Each compact row keeps title first, category/receipt metadata second, and the exact amount at the trailing edge: red with a minus for expenditure, green with a plus for Got back refunds. Expense creation is available from the Home and Money Add expense FABs. `/budget/overview` keeps exact INR analytics and accessible trends. Legacy zero-actual records say “Amount not recorded” and open editing; estimates are never shown as spending. More removes the redundant Budget shortcut and returns to a two-column tool grid with dark icon wells; large text stacks every tile and the unmatched final destination spans the row.
- **Guests, households, contacts, and gifts:** Guests adds RSVP progress, guest-name/household search, and one anchored filter popover with RSVP status and Needs support. Results update immediately, expose an active count, and reset without a full-screen filter route. Adaptive one/two-column household cards keep initials, family side, guest count, RSVP, invitation, stay, and transport states. Household detail uses an identity header, icon-led planning statuses, a readable notes section, a primary Edit action, and a separated confirmed Delete action. Emergency contacts use initials, role and phone hierarchy, direct Call/Message actions, card editing, and confirmed secondary deletion. People lists use safe-area-aware circular add FABs. The household-level data model and hidden legacy guest records remain unchanged. Gifts exposes Received records only; historical kinds and follow-up data remain stored but are not surfaced.
- **Details and forms:** key facts first, a visible fallback-aware back action, explicit pending/error/not-found states, and confirmed destructive actions. `FormShell` shows only the functional back action and title. Native forms use focused-input-aware scrolling plus a measured keyboard-sticky submit footer; web uses a regular scroll view. Text inputs use semantic cursor/selection colors, medium Manrope values, neutral placeholders, compact examples, and consistent vertical alignment. The quick-expense overlay keeps its specialized animation under the same provider without a double offset. Successful creation returns directly to the owning list, where the new row receives one short reduced-motion-safe breath. Routine create/update success never opens a toast; destructive Undo remains available for five seconds.

## Onboarding flow contract

The sequence is introduction → names → wedding date/budget → cover photo → starter events → starter
tasks → review → building. The three introduction slides are swipeable and button-driven; they do
not auto-advance and have no Skip action.

- Names and a date-only wedding date are required. Budget, native-cropped 16:9 cover photo, starter
  events, and ten starter tasks are optional and remain editable. Budget input uses Indian grouping
  and persists integer paise. Hidden compatibility fields begin as `To be decided` and
  `Not specified`.
- Ceremony and task suggestions use checkbox semantics plus visible shape, border, checkmark, and
  text state. They never imply that a custom is required and never reappear in the live Plan view.
- Review shows every choice and routes each summary tile to its source step. The Build action stays
  above the bottom safe area.
- Moving backward preserves the mounted draft. Android Back moves to the previous slide or stage,
  exits from the first introduction slide, and is consumed while persistence is active.
- Workspace persistence and the decorative 4.5-second assembly run together. Reduced Motion
  removes the decorative wait. Failure retains inputs and the staged photo and offers Try again and
  Back to review; success atomically adopts the staged file.
- Artwork contains no functional text or sample user data. Code-owned values use proportional
  coordinates against the asset ratio. Artwork is hidden from accessibility; fields, selections,
  progress, and review actions provide the accessible meaning.
- Onboarding follows the selected theme from its first frame. Pages use 24dp phone padding, a 560dp
  maximum width, 56dp fields/actions, and at least 48×48dp targets. Entrances are 240ms, exits
  160ms, and press/release feedback 90/140ms; no decoration loops.

The runtime image inventory and replacement constraints live in
[`assets/images/mangalya/onboarding/ASSET_MANIFEST.md`](../assets/images/mangalya/onboarding/ASSET_MANIFEST.md).

## Component contracts

- `Screen` owns safe-area background and outer bounds.
- `AppText` owns typography roles and semantic text tones, including bounded serif emotional roles and `onNight` variants.
- `PageHeader` owns compact functional root titles. The Home wordmark is not a generic page title.
- `Button`, `IconButton`, and `MotionPressable` preserve 48dp targets, pending state, accessible labels, and restrained feedback.
- `FloatingActionButton` owns the reusable 56dp circular creation action and scene-relative trailing/bottom placement. `PersonAvatar` and `StatusPill` own initials and non-colour-only people status presentation.
- `TextField`, `DateField`, `TimeField`, and `SelectField` share 56dp labelled elevated controls, optional leading Lucide icons, inline error/helper copy, visible focus/pressed feedback, and clearable optional dates/times.
- `AppBottomSheet` owns adaptive modal option/filter/suggestion presentation. `presentation="dialog"` centres up to four simple choices; `presentation="sheet"` floats inset content with five or more choices, search, or forms. Both modes show all four 24dp corners, translucent Android system-bar space, safe-area clearance, scrim/backdrop and Android Back dismissal, a 48dp-plus labelled close target, brief reduced-motion-aware fades, focus restoration, and optional `onAfterClose`. `SelectField` selects the presentation automatically at the four-option threshold unless the feature contract overrides it.
- `SelectField` opens `AppBottomSheet` instead of changing form layout inline. Options expose radio semantics, text/checkmark selection, optional icons/descriptions, haptics, trigger-focus restoration, and automatic search for lists longer than eight items. Colour never carries selection alone.
- `FormShell` owns the keyboard-aware scroll region, measured focused-field bottom offset, keyboard-sticky safe-area footer, compact functional header, submission error, and primary action. Feature forms own field order, Next/Done traversal, validation, and error focus.
- `TaskCompletionRow` owns checkbox semantics, completion motion, checked state, recycled-ID reset, and compact/detailed presentation.
- `StatusBadge` always includes short text. Shared progress indicators expose a numeric and textual accessibility value.
- `SegmentedControl` uses one translated active indicator and crossfaded labels. `FilterChip` and the anchored filter popover expose state in text, shape, count, and accessibility metadata. Task filters contain only Status and Priority; guest filters contain RSVP status and Needs support. Both filter immediately and use Reset instead of a confirmation footer.
- `ConfirmationDialog` protects destructive actions. Submissions prevent duplicate requests and display actionable failures.
- `EmptyState` is a shared 64dp-minimum row with an optional concise description and code-native icon. It has no image contract. When it is the sole creation path the entire row becomes the `+ Add…` action; when a footer or FAB already creates records it stays neutral. Filtered-empty rows reset the current filter/search instead of adding another creation action. Dynamic Type may expand the row vertically.

## Local media and accessibility

- The wedding cover is copied into app-owned document storage after native 16:9 cropping. First-run selection remains staged until the workspace write succeeds; replacing, removing, or abandoning setup cleans up the staged copy. Event-cover selection is retired; legacy references remain preserved. Inspire generates uncropped orientation-safe WebP detail/thumbnail files, renders thumbnails with memory/disk caching and recycling keys, and loads detail files only for detail/share. Structured backups exclude the Inspire document and all local photo/attachment URIs and bytes; Settings and Backup disclose this before replacement or deletion.
- Generated decorative assets live under `assets/images/mangalya`, are optimized for their rendered size, reserve fixed layout space, ignore touch, and remain hidden from accessibility services. Paired wedding-card themes preserve identical shell and medallion dimensions and are keyed by `AppThemeId`. Live names, date, countdown, cover, progress and semantic labels never become raster content.
- Decorative SVG gradients and flourishes are hidden from accessibility services and ignore touch.
- TalkBack order follows the visual content order. Every non-text control is labelled; completion controls expose checked/disabled state; countdown and progress visuals expose equivalent text.
- Support Android at 360dp, larger system text, and tablet/landscape layouts without clipped titles, truncated money, hidden actions, or whole-screen horizontal scrolling.

## Settings and backup disclosure

Settings keeps wedding details, theme and budget controls concise. Privacy and build information
are collapsed under Privacy & app information. Backup & export shows the three actions and a
short exclusion reminder; export history is collapsed. Import and deletion retain explicit
consequences and confirmation.
