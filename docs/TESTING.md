# Testing strategy

Test behavior that could cost users time, money, or trust. Do not chase coverage percentages.

## Start with unit tests

Add tests for INR paise calculations, date formatting/validation, form schemas, and any permission or status mapping. These should be fast and deterministic.

## Add component tests selectively

Use React Native Testing Library for reusable UI behavior and important forms: validation feedback, disabled/pending submission, error retry, and accessible labels.

## Add end-to-end tests after real flows exist

Use Maestro after the app has a development build and at least two stable journeys. Begin with:

1. Create a wedding and event.
2. Create and complete a task.
3. Create a budget category and expense.

Run device checks on meaningful flow changes, not for every copy or styling adjustment. Add release-blocking E2E automation only after the flows are stable.

## What to verify manually

- 360dp Android width and large font scale
- keyboard and back behavior in forms
- slow/failing network behavior
- no duplicate submit when tapping quickly
- INR values and date-only fields
