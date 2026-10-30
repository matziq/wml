# Linger Longer: November 1, 2026

The public page is <https://wardmission.org/linger_longer/>; `/lingerlonger/`
redirects there. The Nacho Bar is Sunday, November 1 at **2 PM** in the Sundance
1st Ward Cultural Hall. Queso is provided. Contributions are chips, beans,
guacamole, and other toppings. No contribution quantities were specified.

The calendar preserves the 90-minute event and 2 PM local start. The ward uses
America/Phoenix (UTC-7 year-round), so the November calendar starts at 21:00 UTC.
The October calendar remains available at its original URL for existing downloads.

## Required organizer setup before online sign-ups open

The existing Apps Script deployment ignores event/sheet parameters. Its public
response on October 30 still listed `soup`, `bread`, `desserts`, and `beverages`
and 15 prior commitments. Its event metadata was even older. Changing only the
page date, cache key, or an `event` query parameter would not isolate November.

The updated page uses exact, date-scoped CategoryIds for both reads and writes.
It shows and prints only those commitments, and enables submission only after a
fresh backend response includes all four active November categories. Cached
entries never enable submission. Until setup is complete, visitors see an
explicit notice and can use the printable sheet instead.

In the **existing Linger Longer Google Sheet's Categories tab**, add these rows
using the tab's existing column layout:

| CategoryId | Name |
|---|---|
| `2026-11-01-chips` | Chips |
| `2026-11-01-beans` | Beans |
| `2026-11-01-guacamole` | Guacamole |
| `2026-11-01-toppings` | Other toppings |

Use organizer-selected positive capacities in `Needed` and mark the rows active
if the tab has an `Active` column. Do not copy the old soup/bread quantities as
Nacho Bar requirements. Do not add a queso contribution category.

**Do not clear, delete, overwrite, or remap old sign-up rows or category IDs.**
Keep all October commitments intact. November entries append to the existing
sheet under the new IDs; the page filters out all other dates and legacy IDs.
Future events must use new date-scoped IDs as well.

After adding the rows, refresh the public page and verify that the warning clears,
all four choices are available, and only November commitments appear. Confirm one
organizer-approved real signup through a second browser and the printed sheet;
do not submit fake records to the production sheet. If the deployed backend
cannot accept these categories, it needs an authorized backend update or a separate
deployment before online sign-ups can open. Backend source and deployment
credentials for Linger Longer are not stored in this repository.

## Regression checks

From the repository root:

```sh
node --test linger_longer/signup.test.cjs
```

Tests use the actual inline frontend script with a fake DOM and backend. They
cover event isolation, submission gating and confirmation, optional fields,
category choices, print content, calendar dates, cache handling, and load errors.
