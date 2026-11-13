# Linger Longer: December 2026

The public page is <https://wardmission.org/linger_longer/>; `/lingerlonger/`
redirects there. The flyer announces a Baked Potato Bar and Christmas Cookie
Exchange at **2:00 PM in the Gym**. The organizer confirmed **Sunday,
December 6, 2026**, and that baked potatoes are provided. The page and printable
sheet display the requested prominent note, "Baked Potato's Provided."
No calendar links are offered until the event duration is confirmed.

## Sign-up setup

Online sign-up is deliberately disabled: `EVENT_ID` is `null`, so the page
does not query the backend, load event caches, or submit entries. A blank
printable sign-up sheet is available instead. For about 75 attendees, the
organizer approved these contribution quantities, planning for about 10 food
servings or 12 drinks per contribution:

| CategoryId | Name | Needed |
|---|---|---|
| `2026-12-06-toppings` | Baked Potato Toppings | 8 |
| `2026-12-06-desserts` | Desserts | 8 |
| `2026-12-06-drinks` | Drinks | 7 |
| `2026-12-06-chips` | Chips | 8 |

The existing Apps Script deployment ignores event/sheet parameters. Categories
are managed in the private [Linger Longer Google Sheet](https://docs.google.com/spreadsheets/d/18HJiZ4goU4xTla5U9ICGlbZp7EpHWKMiV1d0XRbY-ZE/edit).
Google Sheet browser access was denied during this update; no sheet changes were
made. Before enabling December online sign-ups, add the four active, date-scoped
categories above to the sheet. Set `EVENT_ID` to `2026-12-06` after that setup
and verify the live categories and availability. Never submit fake production
records to verify it.
Do not clear, delete, overwrite, or remap prior sign-up rows or category IDs.
Backend source and deployment credentials are not stored in this repository.

October and November calendar files remain at their original URLs for existing
downloads. Neither is linked from the current December page.

## Regression checks

```sh
node --test linger_longer/signup.test.cjs
```

Tests execute the inline frontend script with a fake DOM and backend. They
cover the disabled December state, event isolation, dynamic categories,
capacities, cache behavior, submission gating and confirmation, print content,
and load errors. Configured-backend tests use November fixture IDs only in the
test harness, not in the live page.
