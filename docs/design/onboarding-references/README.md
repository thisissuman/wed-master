# Mangalya onboarding reference

This document is the living source of truth for Mangalya's first-run experience. The PNGs in this folder communicate mood and composition; this specification governs product copy, interaction, accessibility, typography, colour, spacing, and motion.

## Design system

### Colour

| Role            | Value     | Use                                                               |
| --------------- | --------- | ----------------------------------------------------------------- |
| Lavender        | `#A783C4` | Celebration gradient and atmospheric detail                       |
| Soft lavender   | `#E9DFF0` | Selected cards and quiet supporting surfaces                      |
| Plum            | `#4B174D` | Interactive detail, icons, and high-emphasis light-screen content |
| Deep plum       | `#28102F` | Celebration gradient depth and strong contrast                    |
| Bridal red      | `#C5163A` | Primary action and progress                                       |
| Dark bridal red | `#9E1230` | Primary-action gradient depth                                     |
| Ivory           | `#FFF8F2` | Light-screen canvas and text on dark surfaces                     |
| Elevated ivory  | `#FFFDFC` | Fields and content cards                                          |
| Restrained gold | `#D9AA58` | Decorative linework and celebration accents only                  |
| Primary text    | `#2B1835` | Body and heading text on light screens                            |
| Muted text      | `#665B6D` | Helper and supporting copy                                        |

Gold is never used as the only status indicator or for low-contrast body copy. Welcome, review, and building screens use the lavender–plum–bridal-red celebration gradient. Data-entry screens remain primarily ivory with soft lavender atmosphere.

### Typography, shape, and spacing

- **Mangalya wordmark and emotional headlines:** EB Garamond Semibold.
- **All functional UI:** Manrope Regular, Medium, Semibold, or Bold.
- **Personalised values inside illustration paper:** EB Garamond Semibold. These values are emotional keepsake content rather than controls; they sit directly on the generated ivory paper with no added pill, glass panel, or white backing.
- Intro/review headline: 38–42dp; setup headline: 36dp; body: 16/22; labels: 14dp Semibold; metadata: 12–13dp.
- Page padding is 24dp on phones. Content is centred at a maximum width of 560dp on larger screens.
- Use the 8dp spacing rhythm. Buttons and fields are 56dp high; every interactive target is at least 48×48dp.
- Controls use a 14dp radius. Content cards use a 20dp radius. Pills and progress dots use a fully rounded radius.
- Pages must reflow at 360dp width and with larger system text; important information must not be rasterized.

## Flow and behavior

1. **Introduction:** three horizontally swipeable slides: “Plan your wedding, together”, “Everything in one calm place”, and “Made for your family”. Three dots expose the active slide. Slides one and two auto-advance after 4.8 seconds, while swipe and the visible `Next` button remain available. Slide three stops and shows `Get started`. There is no Skip action. Reduced Motion disables auto-advance.
2. **About you:** collect required `Your name` and `Partner’s name`. Persist the existing combined wedding-name contract as `Your name & Partner’s name`.
3. **Your wedding:** require a date-only Wedding date and optionally collect a Target budget. Format budget input with Indian grouping and persist integer paise.
4. **Make it yours:** optionally stage a native-cropped 16:9 cover photo. The selected photo fills the large central illustrated frame; a second duplicate photo preview is not shown. Cancellation and permission denial never block setup. Replacing, removing, or abandoning setup cleans up staged files.
5. **Events:** show all seven editable starter suggestions. Only Wedding is selected initially. The seven live names map to the seven illustrated event cards without floating chips. Every functional selection is also expressed through a checkmark, surface, border, text, and checkbox semantics—not colour alone.
6. **Review:** show names, full date, budget or `No budget target`, cover status, and selected-event count in a compact two-column deep-plum summary. Each tile returns directly to its setup step. The `Build my planner` action is fixed above the bottom safe area and remains visible without scrolling.
7. **Building:** start workspace persistence and the assembly sequence together. With normal motion, keep the staged sequence visible for about 4.5 seconds. Status copy moves through events, checklist, dates/budget, and workspace finishing while four modules assemble. With Reduce Motion enabled, persist and continue without the decorative delay.

Names, date, budget, cover-photo choice, and selected events are live inputs to the illustration layer. Generated PNG artwork deliberately contains no baked-in text or sample values; React Native text and photo overlays keep the visuals accurate, accessible, localizable, and animated as the user edits. Every overlay uses proportional coordinates measured against the asset's aspect ratio, so content remains seated in its intended paper region across phone and tablet widths.

Back retains values during the current mounted session. Android Back moves to the previous slide or setup step; it exits normally from the first introduction slide and is consumed while persistence is active. Unfinished drafts are intentionally not persisted between app-process launches.

Submissions prevent duplicates. A persistence failure retains every entered value and the staged photo, then offers `Try again` and `Back to review`. Successful persistence adopts the staged file and replaces onboarding with the existing planner.

## Motion map

| Screen          | Normal motion                                                                                                 | Reduced Motion                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Introduction    | Each generated hero settles from 96% scale; slides auto-advance after 4.8s and remain swipe/button controlled | Static hero; no auto-advance                   |
| About you       | Illustration settles once; each typed name fades upward inside its corresponding live artwork panel           | Static image and immediately updated names     |
| Date and budget | Illustration panels arrive from opposing sides; chosen date and formatted budget update with short fades      | Static image and immediately updated values    |
| Cover photo     | Generated photo composition settles once; a selected real photo scales into its frame                         | Static image and immediate photo preview       |
| Events          | Selected names bloom directly into the seven illustrated paper cards; removal clears the corresponding card   | Static image and immediate selected-event list |
| Review          | Summary illustration grows from 94%; names, date, budget, event count, and optional photo populate its paper  | Static illustration and immediate values       |
| Building        | Four planner modules assemble in 820ms stages; determinate progress and status copy run for about 4.5 seconds | Static assembled modules; no minimum delay     |

Page entrances are 240ms and exits 160ms. Press feedback is 90ms down and 140ms release. Interaction transitions use strong ease-out; on-screen moves use intentional ease-in-out. Animations transform opacity, translation, scale, and rotation instead of layout. No onboarding decoration loops indefinitely.

## Reference images

- [01 Welcome](./01-welcome.png): palette and emotional direction. The old `Wed Master` branding is invalid; use Mangalya. The raster typography, sizes, gold button treatment, and ornate illustration are composition references only.
- [02 Couple names](./02-couple-names.png): opposing-card motion concept. The implementation uses `Your name` and `Partner’s name`, not Partner 1/2.
- [03 Date and budget](./03-date-budget.png): calendar-flip and budget-orbit concept. Functional typography follows this document, not the oversized serif controls in the PNG.
- [04 Cover photo](./04-cover-photo.png): fanned-photo concept and privacy reassurance. The implementation uses one clear primary Next action.
- [05 Event prefill](./05-event-prefill.png): inclusive selectable-card concept. The app shows all seven existing suggestions and does not imply any ceremony is required.
- [06 All set](./06-all-set.png): celebration-gradient and summary-card concept. Branding and all type roles follow this document.
- [07 Building planner](./07-building-planner.png): module-assembly concept. The app uses the real current date only in persisted data and does not render the decorative sample calendar literally.

The PNG set contains inconsistent font sizes, type assignments, button treatments, aspect ratios, and progress patterns. Those inconsistencies must not be copied into implementation.

### Shipped illustration assets

The app-owned PNGs live in [`assets/images/mangalya/onboarding`](../../../assets/images/mangalya/onboarding). They use one text-free editorial paper-cut/gouache system so typography and real values remain code-owned:

- [`intro-together.png`](../../../assets/images/mangalya/onboarding/intro-together.png), [`intro-calm.png`](../../../assets/images/mangalya/onboarding/intro-calm.png), and [`intro-family.png`](../../../assets/images/mangalya/onboarding/intro-family.png)
- [`names.png`](../../../assets/images/mangalya/onboarding/names.png), [`date-budget.png`](../../../assets/images/mangalya/onboarding/date-budget.png), [`cover-photo.png`](../../../assets/images/mangalya/onboarding/cover-photo.png), and [`events.png`](../../../assets/images/mangalya/onboarding/events.png)
- [`review.png`](../../../assets/images/mangalya/onboarding/review.png) and [`building.png`](../../../assets/images/mangalya/onboarding/building.png)

## Future application-wide direction

The lavender, plum, bridal red, ivory, and restrained-gold family should be considered for a future Mangalya-wide colour evolution. That work must be handled as a separate design-system change: audit every semantic token, contrast state, chart, navigation surface, empty/error state, and generated asset before changing shared tokens.

This onboarding phase deliberately does **not** change `src/theme/tokens.json`, the existing planner screens, the shared navigation shell, or the workspace schema.

## Change log

### 2026-08-14

- Removed generic ivory/glass pills from the live artwork layer and mapped content directly to each illustrated paper region with responsive percentage coordinates.
- Switched personalised illustration values to EB Garamond Semibold for a more invitation-like aesthetic while keeping functional fields and controls in Manrope.
- Made the selected cover photo fill the central illustrated frame and removed the duplicate large preview.
- Mapped all seven starter-event names to their corresponding artwork cards.
- Populated the review illustration with names, date, budget, event count, and optional photo.
- Replaced the long white review card with compact deep-plum summary tiles and fixed the Build action above the bottom safe area.

### 2026-08-13

- Established Mangalya as the only user-facing brand name.
- Replaced the one-page setup with the seven-stage onboarding state machine.
- Added the onboarding-scoped palette, typography, layout, and motion contracts.
- Added three swipeable introduction slides, inclusive name fields, date/budget, staged cover photo, starter events, editable review, and concurrent build/persistence state.
- Preserved the existing local workspace, photo-safety, integer-paise, date-only, and editable-event contracts.
- Added a consistent nine-image app asset set while keeping all functional text and personalised values code-rendered.
- Added live animated illustration overlays for names, wedding date, Indian-grouped budget, cover photo, and starter-event selection.
- Added gentle 4.8-second auto-advance to the first two introduction slides with swipe, button, and Reduced Motion safeguards.
- Expanded the finite build sequence to 4.5 seconds with staged modules and changing progress messages.
- Replaced the Hermes-incompatible `Intl.NumberFormat(BigInt)` budget path with precision-safe string grouping.
