# Release guide

## Before the first beta

- Verify the three alpha flows on a physical Android device.
- Run lint, typecheck, unit tests, and available smoke tests.
- Check loading, empty, error, and retry states.
- Check TalkBack labels, 48dp targets, large text, and 360dp width.
- Confirm no secrets, guest data, financial data, or tokens appear in logs, screenshots, or analytics.
- Set app name, icon, package identifier, privacy policy, and support contact.
- Add Sentry before inviting external testers.

## Release checklist

- Review unresolved crashes and high-severity bugs.
- Test upgrade from the previous build if storage or schema changed.
- Increment Android version code and user-visible version deliberately.
- Write concise release notes focused on user-visible changes.
- Keep a rollback path: retain the prior tested build and avoid irreversible remote migrations without a backup plan.

## Performance checklist

- Use standard lists first; profile before adding performance libraries.
- Keep images sized for their display area.
- Avoid unnecessary renders in long lists and avoid expensive calculations during render.
- Measure a slow Android device before optimizing.
