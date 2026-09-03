# Ward Fast shared sign-up setup

The website is ready to publish, but Google requires the sheet owner to authorize the private sign-up backend once.

1. Open the configured [Sundance 1st Ward September Fast 2026 sheet](https://docs.google.com/spreadsheets/d/1KMBZ-QJKKdFCmFcUeu4dcALQaFLL6hBAPHRBDXpuIw8/edit).
2. Choose **Extensions > Apps Script**.
3. Replace `Code.gs` with the contents of this folder's `Code.gs`.
4. Open **Project Settings**, enable **Show "appsscript.json" manifest file**, and replace the manifest with `appsscript.json`.
5. Run `setup` once and approve the permissions. This creates the `Signups` tab and a daily 6 PM Arizona reminder trigger.
6. The web app is deployed with **Execute as: Me** and **Who has access: Anyone**.
7. Its current `/exec` URL is configured in `BACKEND_URL` near the top of `../app.js`.
8. After backend code changes, create a new deployment version and keep `../app.js` pointed at the deployment URL.

Public visitors can see names and daily coverage. Phone numbers and reminder emails remain private in the Google Sheet. Opt-in reminders are sent by email the evening before the selected fast day. Missionaries can use the private phone column for their reminder calls.
