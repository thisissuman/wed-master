# UI system

Mangalya uses a fixed light lavender-and-ivory visual system for a calm, premium planning workspace. `Final_Home.png` is the Home visual anchor; real workspace data and accessible mobile behavior take precedence over decorative fidelity.

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

## Motion

Shared presets are fast 150ms, exit 180ms, state 240ms, and entrance 300ms with ease-out timing. Reanimated transitions use `ReduceMotion.System`. Navigation and modal custom transitions become `none` when Reduce Motion is enabled. There is no looping decorative animation.

## Navigation and global chrome

- `MangalyaHeader` is a compact wordmark header. It renders a 48dp search action only when a screen supplies `onSearch`; Home currently reports Search as coming soon without navigating.
- The four-tab bar participates in layout. It uses a light translucent shell, readable plum/grey labels, and a purple top rule for the selected tab.
- Home, Plan, Money, and More retain their routes. Tab fades are brief and disabled under Reduce Motion.
- Detail screens use platform-default stack transitions. Forms use bottom-modal transitions. Status and navigation bars use the ivory surface with dark system content.

## Screen rules

- **Home:** wordmark/search → open wedding summary → Focus today → Budget overview → Quick actions. Short screens scroll; content is never forced beneath the tab bar.
- **Wedding summary:** show the real circular cover, labelled camera action, wedding name/date, active-task progress, and date-only glass countdown. The generated transparent `countdown-halo.png` supplies the luminous periwinkle rings and gold leaf ornament around live text; the code-native radial fill remains beneath it. The cover fallback remains actionable when the photo is missing.
- **Focus today:** exclude completed/cancelled tasks and show at most two, ranked overdue, due today, priority, due date, then stable title/id. Each task is an independent rounded card with a lavender accent rail, a vertically centred labelled checkbox, a rounded-square category-aware Lucide icon, a one-line title above compact metadata, and a centred textual priority/status badge plus disclosure chevron. On narrow Android screens, an overflowing title scrolls horizontally by touch while the checkbox, icon, badge, and chevron remain fixed; the full title remains in the accessible task label. The same native-layout card contract is shared with Plan and event-detail task lists.
- **Budget:** use the positive wedding target before positive expense estimates. The Home card uses a solid primary surface with an ivory-to-gold progress bar and Planned, Spent, and Progress columns. Visual progress clamps at 100%; text and accessibility report actual over-budget values. With no plan, show an em dash and guidance.
- **Quick actions:** Add task, Add expense, Add event, and Add guest navigate directly to the existing forms. Home does not mount the floating Add button or chooser.
- **Plan:** preserve FlashList virtualization. Task cells use stable keys, recycled-item state reset, prepared layout transitions before completion reorders, and the shared native task-card contract. Event timeline cards show the compact date, name, and task progress; venue addresses stay in event detail/edit surfaces rather than repeating in the timeline.
- **Money and More:** expense list cards show title, amount, category, due date, and payment state. Wedding/couple names and vendor/address metadata stay in expense detail/edit surfaces instead of repeating on every card. Other surfaces retain their body information architecture while using the shared light tokens, type, header, tab shell, and contrast rules.
- **Details and forms:** key facts first, a visible back action, explicit pending/error states, and confirmed destructive actions. Form routes share the ivory-to-lavender canvas, compact botanical accent, serif title, safe-area-aware gradient action bar, 48dp controls, and visible required/optional labels. Decorative references never replace responsive layout or semantic content.

## Component contracts

- `Screen` owns safe-area background and outer bounds.
- `AppText` owns typography roles and semantic text tones, including the bounded serif countdown role.
- `Button`, `IconButton`, and `MotionPressable` preserve 48dp targets, pending state, accessible labels, and restrained feedback.
- `TextField`, `DateField`, `TimeField`, and `SelectField` share labelled elevated controls, optional leading Lucide icons, inline error/helper copy, focus/pressed feedback, and clearable optional dates/times.
- `SelectField` expands a bounded, scrollable option panel directly beneath the field, with text selection state, optional icons/descriptions, a checkmark, tap feedback, and reduced-motion behavior. Colour never carries selection alone.
- `FormShell` owns the keyboard-safe scroll region, premium form header, decorative background, submission error, and fixed primary action. Feature forms own field order and validation.
- `TaskCompletionRow` owns checkbox semantics, completion motion, checked state, recycled-ID reset, and compact/detailed presentation.
- `StatusBadge` always includes short text. Shared progress indicators expose a numeric and textual accessibility value.
- `SegmentedControl`, `FilterChip`, and `FilterSheet` expose selected/filter state in text, shape, and accessibility metadata.
- `ConfirmationDialog` protects destructive actions. Submissions prevent duplicate requests and display actionable failures.

## Local media and accessibility

- Wedding and optional event cover photos are copied into app-owned document storage before persistence. Structured backups exclude local photo and attachment URIs/bytes.
- Generated decorative assets live under `assets/images/mangalya`, are optimized for their rendered size, reserve fixed layout space, ignore touch, and remain hidden from accessibility services. Live countdown text and semantic labels never become raster content.
- Decorative SVG gradients and flourishes are hidden from accessibility services and ignore touch.
- TalkBack order follows the visual content order. Every non-text control is labelled; completion controls expose checked/disabled state; countdown and progress visuals expose equivalent text.
- Support Android at 360dp, larger system text, and tablet/landscape layouts without clipped titles, truncated money, hidden actions, or whole-screen horizontal scrolling.
