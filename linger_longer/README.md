# Linger Longer: December 2026

The public page is <https://wardmission.org/linger_longer/>; `/lingerlonger/`
redirects there. The flyer announces a Baked Potato Bar and Christmas Cookie
Exchange at **2:00 PM in the Gym** in December 2026. It does not specify a
day. The page and printable sheet say the date is to be announced; no calendar
links are offered until the event date and duration are confirmed.

## Sign-up setup

Online sign-up is deliberately disabled: `EVENT_ID` is `null`, so the page
does not query the backend, load event caches, or submit entries. A blank
printable sign-up sheet is available instead. No food assignments or capacities
are assumed.

The existing Apps Script deployment ignores event/sheet parameters. Categories
are managed in the private [Linger Longer Google Sheet](https://docs.google.com/spreadsheets/d/18HJiZ4goU4xTla5U9ICGlbZp7EpHWKMiV1d0XRbY-ZE/edit).
Before enabling December online sign-ups, the organizer must confirm the date,
contribution categories, and needed quantities, then add active, date-scoped
category IDs and capacities in the sheet. Set `EVENT_ID` to the confirmed
`YYYY-MM-DD` after that setup, verify the live categories and availability,
and update the displayed date. Never submit fake production records to verify it.
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
