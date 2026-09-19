# Android Preview 8 — compact Home and stable Plan lists

## Requested outcome and implementation

- Home Focus today uses 56dp minimum rows instead of 72dp, smaller decorative icon wells, and
  tighter section spacing. Checkbox and open actions retain at least 48dp touch targets; large
  text can expand rows. Two normal-size rows plus the surrounding spacing save about 76dp.
- A single Sort button sits beside Filters. Each tap toggles due-date/recent-activity ordering;
  the selected treatment and accessibility value expose the state without a visible mode label.
- Removed the custom Reanimated FlashList cell renderer, detailed-row layout transitions and
  keyed list entrance fade. The pinned FlashList implementation owns absolute top/left positions;
  animating its measurement corrections was a plausible cause of the supplied overlap screenshot.
- Removed the list-animation preparation call, which disables recycling, and disabled automatic
  visible-content anchoring for the explicitly sortable task list.
- Plan titles use static two-line text rather than per-row marquee measurement/animations. Home
  retains its compact marquee and accessibility fallback. Completion feedback remains animated.
- No data, dependency, route, provider, or native permission changes. Android version code is 8.

## Verification

- Focused Home/Plan/row tests passed, including compact touch targets, static titles, sort toggle
  in both directions, repeated Events/Tasks switching and retained sorting state.
- TypeScript, Expo lint, Prettier and git diff whitespace checks: passed.
- Full Jest gate: 69 suites and 425 tests passed.
- Expo SDK compatibility check passed; Expo Doctor passed 21/21.
- Production Android export passed: Hermes bundle 7,684,934 bytes, below the recorded 10% ceiling.
- Host stress diagnostic passed with 500 tasks, 500 expenses, 1,000 guests and 200 inspirations.
  List preparation p95 was 1ms; task persistence p95 77ms and expense persistence p95 52ms. These
  figures exclude native rendering, Android storage and frame timing; they do not prove the phone
  switching delay or overlap is resolved.
- Separate read-only review confirmed the animation/recycling concern and identified automatic
  scroll anchoring and invisible sort state; both follow-up findings were addressed.
- Dependency audits still report 21 advisories (17 moderate, 4 high) in the existing dependency
  graph, as recorded for Preview 7. Packages were not changed in this task.
- No Android phone/emulator was connected; Maestro and native visual/performance verification were
  not run. The web smoke-check reached fresh onboarding but its date picker did not open, blocking
  access to Home/Plan. No screenshot-based claim is made for the revised screens.

## Build handoff

Expo account `thisissuman` was confirmed. Commit the exact source and submit Preview with
`--no-wait --non-interactive`; record the source and returned build link here. The Product Owner
will monitor completion; do not poll the build after handing over the link.

## Phone acceptance

Upgrade the existing Preview without uninstalling. Verify two Focus today rows leave more of Budget
visible at normal text size; toggle Sort repeatedly; switch Events/Tasks repeatedly with completed
and incomplete tasks; scroll, filter, complete/reopen, and sort. Confirm rows never overlap and the
new first task is visible after sorting. Check both themes, large text, TalkBack and Reduced Motion.
