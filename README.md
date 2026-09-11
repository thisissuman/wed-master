# Mangalya

Mangalya is an Android-first, local-first wedding planning app for Indian couples and families. It
keeps ceremonies and family practices editable, stores money as integer INR paise, and supports
Royal Plum and Lavender Pearl themes across Expo-compatible Android, iOS, and web targets.

The current private beta includes setup, events, tasks, expenses and budget insights, guest
households, gifts, emergency contacts, local inspiration, attachments, structured backup/restore,
CSV export, local-data deletion, and corrupted-workspace recovery. It has no public authentication,
cloud sync, marketplace, AI, or payment flow.

## Quick start

```bash
npm ci
cp .env.example .env
npm run dev
```

Public Supabase values are optional for the local beta. Never put service-role keys, Sentry auth
tokens, payment secrets, or other privileged values in `EXPO_PUBLIC_*` variables. A fresh install
opens setup and never silently creates demo records.

The app currently writes workspace schema v5. Version `0.1.0` uses Android version code `5` and iOS
build number `1`. See the release guide before rebuilding native clients or creating a Preview APK.

## Documentation

- [Product brief](docs/PRODUCT_BRIEF.md)
- [Architecture](docs/ARCHITECTURE.md)
- [UI system](docs/UI_SYSTEM.md)
- [Engineering guide](docs/ENGINEERING_GUIDE.md)
- [Testing](docs/TESTING.md)
- [Release guide](docs/RELEASE.md)
- [Next steps](docs/NEXT_STEPS.md)
- [Decisions](docs/DECISIONS.md)
