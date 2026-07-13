# UI system

Wed Master is a warm, premium planning tool for Indian families. The interface should feel calm and practical: it prioritises the next decision over decoration, explains money in plain language, and leaves family customs fully editable.

## Single source of truth

`src/theme/tokens.json` is the value source. TypeScript imports it through `src/theme/index.ts`, while `tailwind.config.js` consumes the same file for NativeWind v4. Screens and feature components use semantic roles and reusable primitives; they do not introduce raw colours, spacing values, radii, shadows, or motion durations.

## Colour direction

The light theme uses a warm ivory background, raised off-white surfaces, a deep plum brand colour, and restrained state colours. Brand is reserved for primary actions, active navigation, selected controls, and key progress. Surfaces are not routinely tinted or elevated.

| Role            | Value     | Use                                            |
| --------------- | --------- | ---------------------------------------------- |
| `surface`       | `#F8F4EF` | warm app background                            |
| `surfaceRaised` | `#FFFEFC` | forms, summaries, sheets, dialogs              |
| `surfaceSubtle` | `#F2EBE5` | selected/quiet supporting areas                |
| `textPrimary`   | `#2B2526` | headings and body copy                         |
| `textSecondary` | `#6E6564` | metadata and support copy                      |
| `border`        | `#E7DDD7` | quiet division                                 |
| `brand`         | `#5A233E` | primary action and active state                |
| `accent`        | `#A76576` | sparing supporting accent only                 |
| `success`       | `#237449` | completed and paid states                      |
| `warning`       | `#A45E12` | payment due / attention state                  |
| `danger`        | `#B23B34` | overdue, over-budget, destructive confirmation |

Do not add gradients, glassmorphism, saturated pink decoration, or coloured category systems. Status labels must still be readable without their colour.

## Hierarchy and layout

- Typography roles are display, title, heading, body, label, and caption. Do not turn every label into a heading.
- A screen begins with one title and then places summaries before details.
- The spacing scale is `4, 8, 12, 16, 20, 24, 32, 40`; controls use a 48dp minimum target.
- Cards are reserved for a financial summary, a compact context group, empty/error states, sheets, and dialogs. They are not the default wrapper for every row.
- Events, tasks, categories, and expenses use divider-based rows. Rows reveal only the information needed to decide whether to open them.

## Screen rules

- **Home:** wedding context, up to three priority actions, one budget snapshot, and one bottom Add action. The Add sheet offers task, expense, and event creation.
- **Plan:** a compact Events/Tasks segmented switch controls one content view at a time. Event rows are chronological; task rows include a completion control. Filters are in one sheet and only active filters appear in the main view.
- **Budget:** one compact financial overview precedes active category summaries and expense rows. Vendor and note content stays in expense detail.
- **More:** remains quiet until a real preference or workspace-management need exists; do not fill it with speculative modules.
- **Detail screens:** show a visible back action, key facts first, secondary notes only when present, one primary action, and a visually secondary destructive action protected by a confirmation dialog.

## Component contracts

- `Screen` owns safe-area background and outer screen bounds.
- `SectionHeader` gives a section one readable title and, when necessary, one quiet action.
- `Button` supports primary, secondary, ghost, destructive-confirmation, and quiet-danger variants. Pending actions are disabled.
- `Card` has raised and subtle variants; it is not interactive.
- `ListRow` is the default compact, accessible press target for list content.
- `StatusBadge` is short textual state feedback with neutral, success, warning, danger, or brand tone.
- `ProgressBar` communicates progress with an accessible numeric value.
- `FilterSheet` is the single filter entry pattern and always exposes a one-tap clear action.
- The Plan Events/Tasks segmented switch is the only in-screen mode control and uses the same semantic selected state as other controls.
- `Disclosure` hides optional form fields until requested.
- `ConfirmationDialog` protects destructive actions and keeps the destructive confirmation distinct from the page action.

## Forms

Forms lead with the smallest required set of fields. Optional context belongs in an `Add details` disclosure and does not visually compete with essentials. The reusable form shell provides keyboard-safe scrolling, a reachable save action, disabled pending state, and a clear Cancel action. Use date-only pickers and reader-friendly formatted date values; never expose paise implementation details in UI copy.

## Accessibility and interaction

- Every non-text control has an accessible label; completion controls expose checked state.
- Support 360dp Android width and larger system text without clipped titles or horizontal scrolling.
- Use labels plus shape/text for status, not colour alone.
- Pressed feedback is subtle and immediate. Use motion only for sheets, dialogs, and meaningful state feedback.
- Android back closes sheets/modals first, then returns through the stack. Forms should remain scrollable above the keyboard.
