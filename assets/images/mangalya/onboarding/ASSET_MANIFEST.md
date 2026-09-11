# Mangalya onboarding illustration manifest

Generated on 2026-08-13. These nine WebP files are the complete runtime onboarding artwork set.
The retired reference PNGs were composition inputs only; this manifest, `docs/UI_SYSTEM.md`, and
the current implementation are authoritative.

Artwork uses one premium editorial paper-cut/gouache direction with subtle textile grain. Its
generation palette was lavender `#A783C4`, soft lavender `#E9DFF0`, plum `#4B174D`, deep plum
`#28102F`, bridal red `#C5163A`, dark bridal red `#9E1230`, ivory `#FFF8F2`, and restrained gold
`#D9AA58`. Runtime controls and surfaces follow the active Royal Plum or Lavender Pearl theme.

| File                  | Size     | Intended use         | Prompt focus                                                                    |
| --------------------- | -------- | -------------------- | ------------------------------------------------------------------------------- |
| `intro-together.webp` | 1200×900 | Intro slide 1        | Indian couple collaborating over one shared planner, connected by a gold thread |
| `intro-calm.webp`     | 1200×900 | Intro slide 2        | Couple with a calm all-in-one planning space and blank modular paper surfaces   |
| `intro-family.webp`   | 1200×900 | Intro slide 3        | Inclusive multi-generational family gathered around a shared blank planner      |
| `names.webp`          | 1200×750 | Names step           | Couple above two blank ivory name cards joined by a gold thread                 |
| `date-budget.webp`    | 1200×750 | Date and budget step | Blank calendar and blank gold-edged budget panel for live overlays              |
| `cover-photo.webp`    | 1200×750 | Cover-photo step     | Three fanned photo cards with a large blank center frame                        |
| `events.webp`         | 1200×750 | Starter-events step  | Seven blank event cards blooming from a gold-thread stem                        |
| `review.webp`         | 1200×750 | Review step          | Open planner with blank summary fields inside a hand-drawn gold path            |
| `building.webp`       | 1200×750 | Build state          | Blank planner modules floating clockwise into one assembled workspace           |

Shared constraints in every prompt: no text, letters, numerals, logos, watermarks, readable writing, or fake app chrome; contemporary Indian representation without implying a mandatory custom or religious ritual. Blank panels are deliberate targets for live React Native overlays.

The generated originals were downscaled to the dimensions above and encoded as WebP for the mobile bundle. The nine runtime files preserve their PNG dimensions; `cover-photo.webp` also preserves the source alpha channel. The PNG sources totalled 13,857,949 bytes and the WebP files total 1,373,496 bytes, a 90.09% reduction. The source PNGs were removed after reference and metadata verification.

## Runtime contract

- `intro-*` use 4:3 frames; the remaining illustrations use their native 8:5 frames.
- Names, date, budget, selected photo, event names, and review values are code-owned overlays. Never
  bake personal data or functional copy into replacement artwork.
- Preserve blank paper regions and current overlay geometry. Verify replacements at 360dp, the
  560dp maximum content width, and large text.
- The task-selection step is intentionally image-free.
- Artwork is decorative and excluded from accessibility. The complete flow must remain usable
  without it.
- Use the Mangalya name only. Avoid gender assumptions, mandatory ceremony cues, religion-specific
  symbols, readable sample stationery, fake app chrome, and region-specific claims.
- Optimise committed artwork as WebP. Remove source renders only after visual, alpha, dimensions,
  runtime-reference, and metadata verification.
