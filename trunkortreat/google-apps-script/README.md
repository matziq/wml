# Trunk or Treat shared sign-up setup

The page at `/trunkortreat/` now runs in **shared mode**, backed by a dedicated Google Sheet and
Apps Script web app. Current deployment:

- Google Sheet: <https://docs.google.com/spreadsheets/d/19x467lLR5lADb1AF3jHVY9JISv4F41XvTdG91qwqybY/edit>
- Apps Script project: <https://script.google.com/d/1jPnusHRuAmUzb2OvunS442_RAHSr6CZZ4y2rPlnGBdJTVg9M-dR1RHTD/edit>
- Web app `/exec` URL (set as `SHARED_BACKEND_URL` in `../index.html`):
  `https://script.google.com/macros/s/AKfycbwr67nyGwbaY8v393ZueGupBq7NDEqLEXYWnid-jTVvJwg9SXq2NHH2mNIx3uKhMN8_/exec`

The steps below describe how this deployment was set up and how to redeploy after backend code
changes.

> **Do not point this page at the Linger Longer `/exec` URL.** That deployment ignores `event` and
> `sheet` parameters and always returns Linger Longer data, so sharing it would mix Trunk or Treat
> sign-ups into the Linger Longer sheet. This event needs its own deployment.

1. Create (or open) a Google Sheet for the Trunk or Treat, then choose **Extensions > Apps Script**.
2. Replace `Code.gs` with the contents of this folder's `Code.gs`.
3. Open **Project Settings**, enable **Show "appsscript.json" manifest file**, and replace the
   manifest with `appsscript.json`.
4. Run `setup` once and approve the permissions. This creates two tabs:
   - `TrunkOrTreatSignups` — Timestamp, SignupId, CategoryId, Name, Email, Phone, Item, UserAgent
   - `TrunkOrTreatCategories` — CategoryId, Name, Needed, Icon (seeded with one `Salad or Side` row, 15 slots)
5. Deploy as a **Web app** with **Execute as: Me** and **Who has access: Anyone**.
6. Copy the `/exec` URL into `SHARED_BACKEND_URL` near the top of `../index.html` (replace the empty
   string next to the `TODO`). The page switches to shared mode automatically.
7. After backend code changes, create a new deployment version and update the URL if it changes.

The page now uses a single combined bucket: `salad-or-side | Salad or Side | 15 | 🥗`. Redeploy
this `Code.gs` after changing `DEFAULT_CATEGORIES` — on the next request the backend rewrites
`TrunkOrTreatCategories` to match and rewrites any `salads` / `sides` rows in
`TrunkOrTreatSignups` to `salad-or-side`, so earlier sign-ups are kept. Do not clear or delete
`TrunkOrTreatSignups`. The deployed backend validates new sign-ups against the category tab, so
deploy the updated script before publishing a page that changes the buckets.

Quick alternative without redeploying: edit `TrunkOrTreatCategories` by hand so the only data row
is `salad-or-side | Salad or Side | 15 | 🥗`, and change any `salads` / `sides` values in the
`CategoryId` column of `TrunkOrTreatSignups` to `salad-or-side`.

Privacy matches the other ward sign-ups: the public page shows **name and item only**. Email and
phone are written to the Google Sheet for the organizers and are never returned to the website.

## Troubleshooting shared sign-ups

The page gives each shared-sheet load 15 seconds and retries failed or stalled requests up to
three times (after 2, 5, and 10 seconds). Sign-ups stay disabled until a valid response arrives;
cached entries are for display only and never authorize an offline submission. After all
attempts fail, the page displays an error asking the visitor to refresh.

The `salad-or-side` category must exist in the backend response. Its nonnegative whole-number
`Needed` value controls capacity; it does not have to match the HTML default of 15. A value of
zero closes sign-ups. Unrelated category rows are not offered by this page.

If loading still fails, check the browser's network errors and confirm the deployed web app is
accessible to **Anyone**. If the required category is missing, reconcile the sheet using the
setup instructions above. The frontend loading fix does not require a backend redeployment.

Run the frontend regression tests from the repository root:

```sh
node --test trunkortreat/shared-load.test.cjs
```
