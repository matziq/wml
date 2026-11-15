# Linger Longer: December 2026

The public page is <https://wardmission.org/linger_longer/>; `/lingerlonger/`
redirects there. The flyer announces a Baked Potato Bar and Christmas Cookie
Exchange at **2:00 PM in the Gym**. The organizer confirmed **Sunday,
December 6, 2026**, and that baked potatoes are provided. The page and printable
sheet display the prominent note, "Baked Potatoes Provided."
No calendar links are offered until the event duration is confirmed.

Link previews use the Open Graph/Twitter tags in `index.html`, pointing to
`december-linger-longer-preview.jpg` (1200×628 JPEG, under 600 KB). Update the
tags and preview image with each new event. Preview services cache old scrapes;
refresh them with a tool such as the Facebook Sharing Debugger, or share the
link with a query string (for example `?dec`).

## Sign-up setup

Online sign-up uses `EVENT_ID = "2026-12-06"`. Submission stays disabled until
a fresh valid backend response provides active December categories. The page
filters all reads, caches, print output, and writes to this event's category IDs.
A printable sign-up sheet is also available. For about 75 attendees, the
organizer approved these contribution quantities, planning for about 10 food
servings per topping or side contribution, or 12 drinks per drink contribution:

| CategoryId | Name | Needed |
|---|---|---|
| `2026-12-06-toppings` | Baked Potato Toppings | 10 |
| `2026-12-06-desserts` | Christmas Cookies | 99 |
| `2026-12-06-drinks` | Drinks | 5 |
| `2026-12-06-chips` | Sides | 5 |

The organizer updated the existing dessert row to Christmas Cookies. Keep the
existing `desserts` and `chips` IDs despite the new labels so
existing commitments remain attached to their categories. No cookie serving
quantity is specified.

The existing Apps Script deployment ignores event/sheet parameters. Categories
are managed in the private [Linger Longer Google Sheet](https://docs.google.com/spreadsheets/d/18HJiZ4goU4xTla5U9ICGlbZp7EpHWKMiV1d0XRbY-ZE/edit).
Direct Google Sheet browser access was denied; no sheet changes were made by this
update. A subsequent read-only check of the public backend confirmed all four
active December categories with the approved names and capacities above, allowing
the frontend to be enabled. Never submit fake production records to verify it.
Do not clear, delete, overwrite, or remap prior sign-up rows or category IDs.
Backend source and deployment credentials are not stored in this repository.

October and November calendar files remain at their original URLs for existing
downloads. Neither is linked from the current December page.

## Regression checks

```sh
node --test linger_longer/signup.test.cjs
```

Tests execute the inline frontend script with a fake DOM and backend. They
cover December submission gating, event isolation, dynamic categories,
capacities, cache behavior, submission gating and confirmation, print content,
and load errors. Configured-backend tests use November fixture IDs only in the
test harness, not in the live page.
