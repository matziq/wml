# Trunk or Treat shared sign-up setup

The page at `/trunkortreat/` works right now in **static mode**: entries save in the visitor's own
browser, and the organizer can export/import/print. To collect sign-ups in one shared Google Sheet,
deploy this backend once.

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
