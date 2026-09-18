# Android Preview 7 — mobile refinements

## Changes

- Emergency contacts can import a phone contact, select among multiple phone numbers and edit the
  displayed name. Cancellation/denial preserves manual entry. Android requests read access only;
  WRITE_CONTACTS is blocked. Expo Contacts legacy picker was separately reviewed before addition.
- Inspire displays saved photo titles and offers Small, Medium and Big layouts.
- Tasks offer Due date and Recently actioned sorting. New edits, status changes, creation and restore
  persist timestamps; older records do not get invented historical activity.
- Expenditure rows show red minus amounts; Got back records show green plus amounts. Refunds reduce
  net spending on Home, Money and event details. Structured backups preserve direction; CSV includes
  a Type column. Category and trend charts explicitly describe spending before refunds.
- Settings and Backup use concise copy and collapsed secondary information/history. Destructive
  actions retain confirmation and import explains which data will be replaced.
- After the wedding date, Home celebrates the couple with a themed congratulations card and a brief
  reduced-motion-aware heart animation. Cover editing and the keepsake interaction remain available.
- Android version code is 7. Expo SDK 57 compatible patch updates resolve the compatibility check.

## Verification before submission

- TypeScript, Expo lint, Prettier, and git diff whitespace check: passed.
- Jest: 69 suites, 422 tests passed.
- Expo install compatibility check: passed; Expo Doctor: 21/21 passed.
- Production Android export: passed. Hermes bundle 7,685,360 bytes, 0.50% above the
  7,647,249-byte baseline and below the 10% ceiling.
- Preview config introspection: com.suman.mangalya.preview, mangalya-preview, 0.1.0 (7).
  READ_CONTACTS is added; WRITE_CONTACTS and the existing blocked permissions have removal rules.
  This is generated-config evidence, not inspection of the eventual signed APK.
- Separate read-only review found an event refund total/display inconsistency; corrected to use the
  same amount helpers as Money. No Supabase schema, RLS, route hierarchy or provider changes were made.
- Dependency audits (all and omit-dev): 21 advisories, 17 moderate and 4 high, in the existing Expo/
  Metro/Xcode-related graph. A non-force npm audit fix did not clear these. No incompatible SDK
  downgrade or forced upgrade was accepted. This is not a clean security audit or a store release.
- No Android device/emulator was connected. Maestro, native visual inspection, native contact-picker
  operation, signed artifact inspection, and the physical-device matrix were not run for this build.

## Build handoff

The active Expo account was verified as `thisissuman`. Submit the committed source using the Preview
profile with `--no-wait --non-interactive`; record the returned source commit/build page below.
The Product Owner requested the status link and will monitor completion personally. Do not poll EAS
or claim the APK passed installation/signing checks before actual evidence exists.

## Phone acceptance

Install as an upgrade to Preview 6 and verify existing data remains. Check the seven changes above,
including contact denial/cancel/multiple numbers/custom name, expense-to-refund editing, backup
round-trip, task order after restart, all three photo sizes, and a past wedding date in both themes
with large text and Reduced Motion. After the Product Owner confirms the phone result, continue
with the open measured performance, tablet, cold deep-link and observability gates in NEXT_STEPS.md.
