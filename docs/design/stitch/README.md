# Mangalya Stitch references

These compressed references document the visual source used for the Mangalya workspace redesign. They are implementation references, not runtime dependencies.

## Project

- Title: Mangalya Wedding Planner UI System
- Project ID: `14603388552645068026`

## Screens

| Screen                                           | Stitch ID                          | Local folder                          |
| ------------------------------------------------ | ---------------------------------- | ------------------------------------- |
| 01_Home_Recreated_Final                          | `c00965d265db4b3eaba299bab825b03f` | `01-home-recreated-final`             |
| 02_Plan_Tasks_Refined_Spacing                    | `5fa7243267eb494b9580499625bcbece` | `02-plan-tasks-refined-spacing`       |
| 03_Plan_Events_Refined_Text_Spacing              | `77efb7c0e7f7409e90571f95379c0269` | `03-plan-events-refined-text-spacing` |
| 04_Money_Expenses_Full_Text                      | `288c90a062054a84b60bc8deaa424353` | `04-money-expenses-full-text`         |
| 05_More_Refined_Illustration                     | `2f81e69f96044d6583966491cae81064` | `05-more-refined-illustration`        |
| 02_Plan_Task_Detail_Heritage_Refined_V3          | `32d0db03c6df480ca4b03b63d55755b8` | `02-plan-task-detail`                 |
| 03_Plan_Event_Detail_Heritage_Refined_V2         | `164b059af28c4029b53a2277f2af53e9` | `03-plan-event-detail`                |
| 02_Plan_Add_Task_Heritage_Refined                | `e2f53ddb71e54a32ae28ea0155bcdb91` | `02-plan-add-task`                    |
| 03_Plan_Add_Event_Heritage_Refined               | `062f0dd4f1314e00bc7542eb3e5cdc36` | `03-plan-add-event`                   |
| 04_Money_Add_Expense_Heritage_Refined            | `794390a9b81f457aa6f6ee7921201a63` | `04-money-add-expense`                |
| 05_More_Guests_List_Heritage_Perfect_Fidelity_V2 | `d239d3e0bf734c24bb16d81999f913bb` | `05-more-guests`                      |
| 05_More_Gifts_Heritage_Refined                   | `49107df09c644493b2276b230228c87f` | `05-more-gifts`                       |
| 05_More_Emergency_Contacts_Heritage_Refined      | `92b9da5deff04df1aad2ea4fe380af3c` | `05-more-emergency-contacts`          |
| 05_More_Backup_Export_Heritage_Refined           | `13581d8607de40d6b11b9ed78e799752` | `05-more-backup-export`               |
| 05_More_Wedding_Settings_Heritage_Refined        | `85fbececfc144198bf6056108a6eecc9` | `05-more-wedding-settings`            |
| 05_More_Empty_States_Heritage_Refined            | `61cc00c41a9c44b58a9b108252e7a2eb` | `05-more-empty-states`                |

Each folder contains the hosted Stitch HTML and a compressed screenshot. Intentional implementation differences are recorded below; the original five reference folders also retain their screen-specific notes.

## Product deviations

- Live editable workspace records replace all illustrative names, counts, dates, ceremonies, and amounts.
- The wedding-date event is highlighted by date; the product never requires a ceremony based on its regional or religious name.
- Existing create, edit, detail, completion, loading, error, retry, empty, and filtered-empty behavior is preserved.
- Expenses is the Money landing, while the budget summary remains on Home.
- Settings, Guests, Gifts, Backup & Export, and Emergency Contacts now route to persisted local-first features. Support, About, and Feedback retain accessible coming-soon feedback.
- Guests use culturally neutral stored family sides and derive readable labels from the editable wedding name.
- Event vendors are deduplicated from event-linked expense vendor names; unsupported phone records are not invented.
- Backups contain structured data only and explicitly exclude task/receipt attachment file bytes. Delete Local Data is intentionally deferred until onboarding can safely create a replacement workspace.
- Stack details and forms use the real Expo navigation shell instead of duplicating the bottom bar shown in Stitch.
- Device frames and supplied multi-megabyte PNGs are excluded. Runtime assets are limited to the optimized botanical, mandap, and contextual empty-state illustrations.
