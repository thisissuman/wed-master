# Android local-beta flows

These flows target the generated development client (`com.suman.mangalya.development`). They are
ordered so each can run independently with a clean local workspace.

The development build needs Metro plus an ADB reverse tunnel. Start them before Maestro:

```sh
APP_VARIANT=development npx expo start --dev-client --localhost
adb reverse tcp:8081 tcp:8081
```

Then run all flows from the repository root in another terminal:

```sh
maestro test .maestro
```

Run one flow while debugging:

```sh
maestro test .maestro/02-event-and-task.yaml
```

The bootstrap subflow opens the localhost project and dismisses Expo development-client onboarding
when it appears. The backup flow crosses into Android's share picker and therefore remains part of
the physical-device release pass even when it succeeds on the emulator. Never point these
destructive-data flows at a production package or a device workspace that has not been backed up.
