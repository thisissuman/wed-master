# UI system

Wed Master should feel calm, precise, and warm—not ornate or generic. Use native mobile conventions, Material Design 3's clarity, and the information hierarchy of Reminders, Notion, and Linear. Do not imitate their brands.

## Token rules

Use semantic tokens from one theme file. Components never contain hard-coded colours, spacing, corner radii, shadows, or animation durations.

### Initial light tokens

| Role | Value | Use |
|---|---|---|
| `surface` | `#FFFBFF` | screen background |
| `surfaceRaised` | `#FFFFFF` | cards, dialogs, sheets |
| `textPrimary` | `#1D1B20` | primary text |
| `textSecondary` | `#625B61` | supporting text |
| `border` | `#E9E0E6` | subtle separation |
| `brand` | `#7A3854` | primary action and focus |
| `brandOn` | `#FFFFFF` | text on brand |
| `success` | `#167A3F` | completed state |
| `warning` | `#A95B00` | attention state |
| `danger` | `#B3261E` | destructive state |
| `info` | `#315DA8` | neutral information |

Add dark tokens before enabling a theme switch. Never derive semantic states by changing opacity alone.

### Layout tokens

- Spacing: `4, 8, 12, 16, 20, 24, 32, 40`.
- Radius: `8, 12, 16, 24`; use 12 for controls and 16 for cards/sheets.
- Minimum touch target: 48dp.
- Use system typography initially. Add a custom font only after verifying legibility, script support, and bundle impact.
- Prefer borders and tonal surfaces over heavy shadow. Use elevation only to establish a temporary layer such as a sheet or dialog.

### Motion tokens

- Fast feedback: 120ms; standard transition: 180ms; sheet/dialog transition: 240ms.
- Animate state changes, ordering, and feedback—not decoration.
- Respect reduced-motion settings. Do not block interaction while an animation runs.

## Shared primitives

Build these before screen-specific visual variants: `Screen`, `Text`, `Button`, `IconButton`, `Card`, `TextField`, `SelectField`, `StatusBadge`, `ListRow`, `EmptyState`, `ErrorState`, and `LoadingState`.

Each primitive owns its accessibility behavior and states. Screens compose primitives; they do not recreate button, field, or empty-state styling.

## Component behavior

- **Buttons:** one primary action per visual area; show pending state and prevent repeat submission.
- **Cards:** group related information; do not use cards as decoration for every row.
- **Inputs:** visible label, optional helper text, inline error, and keyboard-appropriate input mode.
- **Dialogs:** use for destructive confirmation or short decisions. The primary action must be explicit.
- **Bottom sheets:** introduce only when an edit flow benefits from staying in context; provide a title, dismiss action, keyboard-safe layout, and unsaved-change behavior.
- **Snackbars:** acknowledge completed actions or recoverable background failures; never hide a critical error only in a snackbar.

## Required screen states

Every data screen intentionally handles loading, empty, error, permission-denied when applicable, and success. Explain what an empty area is and offer one obvious next action. Give recoverable failures a retry action.

## Accessibility baseline

- Icon-only controls need an accessible label.
- Labels and errors must be available to screen readers.
- Status must use text or an icon as well as colour.
- Support large system font sizes without clipping core actions.
- Test a 360dp Android width before calling a screen complete.
