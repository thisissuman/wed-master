# Testing strategy

Test behavior that can cost users time, money, privacy, or trust. Do not optimise for a coverage percentage.

## Foundation

- Unit-test money arithmetic, date-only rules, schema validation, permission mappings, and pure feature utilities.
- Use React Native Testing Library for UI behavior: validation, pending state, retry, empty state, and accessibility labels.
- Test through public feature APIs where practical; do not couple tests to private implementation detail.

## V1 and release testing

- Add Maestro journeys after the first three flows stabilize: wedding setup, task completion, and expense creation.
- Manually test 360dp Android width, large text, TalkBack, keyboard/back behavior, failing network, and rapid duplicate taps.
- Add regression tests for every confirmed money, permission, or data-loss defect.

## Performance testing

Profile before optimizing. Test on a lower-end Android device when long lists, images, or animation become user-visible. FlashList and Expo Image establish a production path; they do not remove the need to measure render work and image sizes.
