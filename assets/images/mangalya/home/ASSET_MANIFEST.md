# Mangalya Home wedding-card artwork

The two wedding-card shells were generated on 2026-08-14 and encoded as WebP for the Android self-test release candidate. They are decorative background layers only: names, date state, countdown, cover photo, progress, controls, focus behavior, and accessibility copy remain code-owned.

## Runtime assets

| File                                     |               Dimensions | Purpose                                                                     |
| ---------------------------------------- | -----------------------: | --------------------------------------------------------------------------- |
| `wedding-hero-shell.webp`                | 1600 × 983 px (1.6277:1) | Royal Plum shell with empty live-copy, cover, countdown, and progress zones |
| `wedding-hero-shell-lavender-pearl.webp` | 1600 × 983 px (1.6277:1) | Lavender Pearl shell with the same overlay geometry                         |

Both files are fully opaque and preserve the source PNG dimensions and aspect ratio. The two source PNGs totalled 4,993,983 bytes; the WebP files total 501,598 bytes, an 89.96% reduction. The source PNGs were removed after runtime-reference and metadata verification.

Across the nine onboarding illustrations and these two Home shells, the referenced raster payload fell from 18,851,932 to 1,875,094 bytes: 16,976,838 bytes saved, or 90.05%.

## Live-content alignment

- Render each shell at its native `1600 / 983` aspect ratio. A different crop would cut the outer border or progress panel.
- Keep the live name overlay within approximately `x: 39–66%`, `y: 18–49%`; place the live date below the central divider around `y: 57–64%`.
- Keep countdown content within approximately `x: 73–91%`, `y: 22–59%`.
- Keep progress copy and fill within approximately `x: 9–91%`, `y: 75–91%`.
- Both themes share this geometry; theme switching changes only the decorative shell and code-native foreground colours.

## Neutral fallback

When no personal cover photo exists, Home renders a code-native neutral two-person monogram derived from the entered names. It does not assume genders, clothing, a region, a ceremony, or a family structure. The retired illustrated couple and planner-medallion rasters are intentionally not part of the runtime asset contract.
