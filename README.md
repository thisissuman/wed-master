# Mangalya

Mangalya is an Android-first, local-first wedding operating system for Indian couples and families. It keeps ceremonies and family practices editable, stores money as integer INR paise, and preserves the approved lavender-and-ivory visual identity across Expo-supported Android, iOS, and web targets.

## Product status

The private device-local product is feature-complete for an **internal Android local beta**:

- wedding setup and editable settings;
- events, tasks, checklists, and attachments;
- quick actual-expense capture, a recent-expenses Money tab, and a separate budget overview with spending trends, dates, and category ranking;
- guest households, gifts, and emergency contacts;
- validated JSON backup/restore plus CSV exports; and
- explicit local-data deletion and corrupted-workspace recovery.

There is no public authentication, cloud sync, marketplace, AI, or payment flow in this beta. The Supabase client boundary remains for the separately designed future shared-data architecture; it does not perform startup session work or access application tables. Public release still requires the native, physical-device, Maestro, performance, signing, and observability gates tracked in [Next Steps](docs/NEXT_STEPS.md).

## Local setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Public Supabase values are optional in the current local release. Leave them blank unless working on the future remote-data boundary. Never put service-role keys, Sentry auth tokens, payment secrets, or other privileged values in `EXPO_PUBLIC_*` variables.

Use a development build for normal Android work. Install Android Studio, an Android SDK/emulator, and a compatible Java runtime, then run `APP_VARIANT=development npx expo run:android` once and `npm run android` for later JS-only sessions. Regenerate and rebuild the native client after changing app identifiers, schemes, config plugins, permissions, native dependencies, icons, or the splash screen; Metro cannot update those native values.

A brand-new installation opens the minimum wedding setup flow and never silently installs demo records. Demo content is available only to tests and the development variant's explicit reset action.

## App variants

`app.config.ts` reads `APP_VARIANT`:

| Variant       | App name         | App identifier                   | Scheme                 |
| ------------- | ---------------- | -------------------------------- | ---------------------- |
| `development` | Mangalya Dev     | `com.suman.mangalya.development` | `mangalya-development` |
| `preview`     | Mangalya Preview | `com.suman.mangalya.preview`     | `mangalya-preview`     |
| `production`  | Mangalya         | `com.suman.mangalya`             | `mangalya`             |

`eas.json` defines matching development, preview, and production profiles. Version `0.1.0` currently uses Android version code `4` and iOS build number `1`; increment each platform counter deliberately for every store build. Signing credentials stay in EAS or the release environment and are never committed.

## Local data and recovery

The version-4 workspace is persisted through a serialized, persist-first repository boundary. Startup validates every snapshot and migrates valid version-1, version-2, or version-3 data without deleting the legacy keys. Missing data routes to setup; a corrupted workspace is never silently replaced. Mangalya offers a recovery copy, import of a valid backup, or explicit deletion of the unreadable data before returning to setup.

Mangalya does not upload a workspace. Users choose when to export a data-only backup. Android Auto Backup is disabled; Android 12+ device-to-device transfer behavior can still vary by device manufacturer, so product copy never promises that data can exist only on one physical device.

Structured backups are capped at 5 MB and exclude device-local media bytes. Cover photos, receipts, task attachments, and generated exports are app-owned files and are cleaned up after replacement, deletion, cancellation, or a failed record mutation where applicable.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npm run format:check
npx expo install --check
APP_VARIANT=production npx expo export --platform android --output-dir /tmp/mangalya-export
```

Run `npx expo-doctor` when the package/network environment makes it available. Release approval also requires physical Android checks for TalkBack, hardware/predictive back, keyboard behavior, large text, landscape, reduced motion, and release signing.

Start with [Product Brief](docs/PRODUCT_BRIEF.md), [Architecture](docs/ARCHITECTURE.md), [UI System](docs/UI_SYSTEM.md), [Next Steps](docs/NEXT_STEPS.md), and [Release Guide](docs/RELEASE.md).
