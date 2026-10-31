# Linger Longer: November 1, 2026

The public page is <https://wardmission.org/linger_longer/>; `/lingerlonger/`
redirects there. The Nacho Bar is Sunday, November 1 at **2 PM** in the Sundance
1st Ward Cultural Hall. Queso is provided, not a requested contribution.

The calendar preserves the 90-minute event and 2 PM local start. The ward uses
America/Phoenix (UTC-7 year-round), so the November calendar starts at 21:00 UTC.
The October calendar remains available at its original URL for existing downloads.

## Shared categories

The existing Apps Script deployment ignores event/sheet parameters. Categories
are managed in the private [Linger Longer Google Sheet](https://docs.google.com/spreadsheets/d/18HJiZ4goU4xTla5U9ICGlbZp7EpHWKMiV1d0XRbY-ZE/edit).
The frontend reads all active categories whose exact IDs start with
`2026-11-01-`, using their sheet names and nonnegative integer `Needed` values.
No fixed four-category list is required. The organizer's current configuration is:

| CategoryId | Name | Needed |
|---|---|---|
| `2026-11-01-sourcream` | Sour Cream | 2 |
| `2026-11-01-beans` | Beans | 2 |
| `2026-11-01-jalapenos` | Jalapenos | 2 |
| `2026-11-01-olives` | Black Olives | 1 |
| `2026-11-01-chips` | Tortilla Chips | 4 |
| `2026-11-01-drinks` | Drinks | 3 |
| `2026-11-01-toppings` | Other Toppings | 2 |
| `2026-11-01-guacamole` | Guacamole | 3 |

Choices show remaining spots and disable full categories; counts show signed-up
contributions versus required quantities. Zero closes a category. The sheet
backend remains authoritative for concurrent writes. Print output includes the
same categories/quantities and each person's exact contribution labels.

**Do not clear, delete, overwrite, or remap old sign-up rows or category IDs.**
November writes append under their date-scoped IDs. Display, cache, print, and
duplicate checks exclude all other dates and unscoped legacy IDs. Future events
must use new date-scoped IDs. Category names are escaped before HTML rendering.

Cached November categories and sign-ups are for offline display only. Submission
requires a fresh valid backend response; a missing/failed response leaves an
explicit warning and a usable printable sheet. Malformed categories are not
offered. The page preserves prior array-format caches while writing the new
category-plus-signups format.

Verify setup by refreshing the public page: the warning should clear, all active
November categories should appear with the sheet's quantities, and only November
commitments should display. Never submit fake production records to verify it.
Backend source and deployment credentials are not stored in this repository.

## Regression checks

```sh
node --test linger_longer/signup.test.cjs
```

Tests run the actual inline frontend script with a fake DOM and backend. They
cover event isolation, dynamic categories, capacities, escaped names, cache
compatibility, submission gating/confirmation, print content, calendars, and
load errors.
