# UI system

Wed Master should feel like a premium consumer product: calm like Reminders, structured like Linear, flexible like Notion, and clear like Material Design 3—without copying any product's visual identity or becoming a card-heavy CRUD UI.

## Single source of truth

NativeWind v4 theme values and typed semantic tokens are the design source of truth. Screens and feature components use semantic component variants; they never introduce raw colours, spacing values, radius values, shadows, or motion durations.

## Token foundation

### Colour roles

| Role | Light starting value | Meaning |
|---|---|---|
| `surface` | `#FFFBFF` | app background |
| `surfaceRaised` | `#FFFFFF` | cards, sheets, dialogs |
| `textPrimary` | `#1D1B20` | main content |
| `textSecondary` | `#625B61` | supporting content |
| `border` | `#E9E0E6` | quiet separation |
| `brand` | `#7A3854` | primary action and focus |
| `success` | `#167A3F` | completed/safe state |
| `warning` | `#A95B00` | attention-needed state |
| `danger` | `#B3261E` | destructive state |
| `info` | `#315DA8` | neutral information |

Create a matching dark token set before enabling dark-mode selection. Do not use opacity as the only way to create a semantic state.

### Layout and typography

- Spacing scale: `4, 8, 12, 16, 20, 24, 32, 40`.
- Radius scale: `8, 12, 16, 24`; controls use 12, cards/sheets use 16.
- Use system typography first; define display, title, body, label, and caption roles. Add a custom font only after verifying multilingual coverage and performance.
- Prefer tonal surfaces and subtle borders. Elevation is reserved for floating actions, sheets, and dialogs.
- Interactive elements have a 48dp minimum target.

### Motion

- 120ms feedback, 180ms standard transitions, 240ms sheets/dialogs.
- Animate feedback, order, and state changes. Do not animate decoration merely to make a screen feel busy.
- Respect reduced-motion preferences and never delay interaction behind an animation.

## Component variants and states

Build primitives before feature screens: `Screen`, `Text`, `Button`, `IconButton`, `Card`, `TextField`, `SelectField`, `StatusBadge`, `ListRow`, `Dialog`, `Snackbar`, `LoadingState`, `EmptyState`, and `ErrorState`.

- Buttons have primary, secondary, destructive, and ghost variants; pending state prevents duplicate submit.
- Inputs always include a visible label, helper/error text, a suitable keyboard mode, and accessible error semantics.
- Cards group information; they are not default page decoration.
- Skeletons preserve layout while data is expected shortly. Use loading state when the shape is unknown or the delay is meaningful.
- Empty states explain the absence and offer one clear action.
- Error states name the failure safely and provide retry when recovery is possible.
- Snackbars acknowledge completed actions or non-blocking recovery; critical failures remain visible in the content area.

## Accessibility and icon rules

- Icon-only controls require an accessible label.
- Use Lucide icons consistently; icons reinforce labels and never carry critical meaning alone.
- Support large text, screen readers, keyboard-safe forms, 360dp Android width, and non-colour-only status signals.
- Images that communicate meaning include an accessibility label; decorative images are hidden from assistive technology.
