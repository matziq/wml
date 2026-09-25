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
   - `TrunkOrTreatCategories` — CategoryId, Name, Needed, Icon (seeded with the salad categories)
5. Deploy as a **Web app** with **Execute as: Me** and **Who has access: Anyone**.
6. Copy the `/exec` URL into `SHARED_BACKEND_URL` near the top of `../index.html` (replace the empty
   string next to the `TODO`). The page switches to shared mode automatically.
7. After backend code changes, create a new deployment version and update the URL if it changes.

Adjust how many of each salad are needed by editing the `Needed` column in `TrunkOrTreatCategories`.

Privacy matches the other ward sign-ups: the public page shows **name and item only**. Email and
phone are written to the Google Sheet for the organizers and are never returned to the website.
