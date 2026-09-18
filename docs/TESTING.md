# Testing strategy

Test behavior that can cost users time, money, privacy, or trust. Do not optimise for a coverage
percentage. Keep dated results in the verification archive or a release-specific build record.

## Automated coverage

- Money parsing/formatting, refund/net totals and backup round trips, date-only behavior, task activity timestamps and ranking, budget selectors, spending trends,
  category grouping, and event/task progress.
- Strict workspace validation and v1-v5 migration; starter-event/task deduplication; household RSVP
  derivation; backup limits; serialized persist-first writes; recovery; deletion tombstones; and
  managed-file cleanup.
- Form validation, duplicate-submit prevention, navigation guards, keyboard behavior, destructive
  Undo, and compatibility-field preservation.
- Navigation state, onboarding selection and atomic creation, deep-link fallbacks, loading/error/
  empty states, filters, responsive behavior, and accessibility semantics.
- Inspire schema/store behavior, stable pagination, filtering, event unlinking, deletion/Undo,
  recovery, backup exclusion, media validation, WebP derivatives, rollback, and orphan cleanup.
- A deterministic schema-valid stress fixture with 1,000 guests, 500 tasks, and 500 expenses. It is
  test data and must never become production seed data.

## Local gate

Run from `/Users/kira/wed-master` after focused tests pass:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run format:check
npx expo install --check
git diff --check
```

Run `npx expo-doctor` when available. Before a distributable build, also run the production Android
export documented in [RELEASE.md](./RELEASE.md). Record unavailable, skipped, timed-out, and
interrupted checks accurately; none count as passing.

## Android journey tests

The tracked Maestro flows under `.maestro/` target `com.suman.mangalya.development`:

```bash
maestro test .maestro
```

They cover fresh setup, event/task completion, expense capture, invalid household links,
backup/share opening, restart persistence, and typed local deletion. The backup flow still requires
physical-device confirmation of the Android share picker. Install or upgrade Maestro only with
explicit approval, and never point these destructive-data flows at a valued workspace.

## Manual release matrix

- Test fresh setup, an existing v5 workspace, v4 and v1-v3 migrations, malformed storage,
  recovery-copy export, valid/invalid import, demo reset, and typed full deletion.
- Exercise all five roots and every create/edit/detail/delete/Undo flow, rapid taps, deep links,
  gestures, and Android hardware/predictive Back.
- Test first and last form fields with the keyboard, multiline input, large text, pickers,
  attachment cancellation/denial/oversize/missing files, and share-sheet availability.
- Verify contact picker denial/cancellation/multiple numbers/custom names, red debit and green refund signs, recent task order after relaunch, Inspire titles and Small/Medium/Big, collapsed settings/history, and the post-wedding card with Reduced Motion.
- Cover 360dp Android, larger phone/tablet widths, compact-height landscape, 600/840dp expanded
  layouts, largest font size, both themes, hot theme switching, Reduced Motion, and TalkBack.
- Test Inspire with 0, 1, 3, 20, and 200+ records, long images, missing files, permission denial,
  cancellation/retry, chronological TalkBack order, and mid-range device scrolling/memory.
- Exercise filters, sheets, dialogs, keyboard-settled opening, focus restoration, category reuse,
  Tasks/Events switching, and large-list behavior under the stress fixture.
- Verify upgrade installation, process termination during entry/save, offline launch, native
  package/scheme identity, release signing, permissions, launcher/splash, and Sentry source maps.

When an emulator has a hardware keyboard, enable its soft keyboard with:

```bash
adb shell settings put secure show_ime_with_hard_keyboard 1
```

## Performance acceptance

- Preview cold start: at most 2.5 seconds on representative hardware.
- Task persistence p95: at most 150 ms.
- Expense save p95: at most 300 ms.
- Scrolling: no sustained period below 55 FPS in the stress scenarios.
- Hermes bundle: no unexplained growth above 10% from the 7,647,249-byte current-source baseline
  recorded after LB-03; the corresponding ceiling is 8,411,974 bytes. The older 8,912,246-byte
  value predates the asset and module-graph reductions and remains historical evidence only.

Run the deterministic host diagnostic before final device profiling:

```bash
npm run measure:lb04
```

It measures schema parsing, in-memory hydration and persistence, list preparation, currency
formatting, and a 200-record Inspire query with the 1,000-guest/500-task/500-expense fixture. Host
results exclude Android storage, the native bridge, rendering, image decoding, and release Hermes,
so they identify regressions and relative improvements but never satisfy the device thresholds.

Metro can serve new JavaScript inside an old native shell. Every native result must therefore name
the installed package, scheme, source commit, and build artifact. Rebuild after config-plugin,
permission, identifier, icon, splash, or native-dependency changes.

Historical results are in
[VERIFICATION_HISTORY_2026-09-05.md](./archive/VERIFICATION_HISTORY_2026-09-05.md); the latest signed
APK evidence is in [PREVIEW_BUILD_2026-09-11.md](./PREVIEW_BUILD_2026-09-11.md).
