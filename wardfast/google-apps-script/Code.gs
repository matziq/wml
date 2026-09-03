/**
 * Sundance 1st Ward September 2026 missionary fast sign-up backend.
 * Run setup() once, then deploy as a web app with access set to Anyone.
 */

const SPREADSHEET_ID = "1KMBZ-QJKKdFCmFcUeu4dcALQaFLL6hBAPHRBDXpuIw8";
const SOURCE = "ward-fast-september-2026";
const TIME_ZONE = "America/Phoenix";
const SIGNUP_SHEET = "Signups";
const SIGNUP_HEADERS = [
  "Timestamp", "SignupId", "Date", "Name", "Phone",
  "ReminderOptIn", "Email", "ReminderSent", "UserAgent"
];

function setup() {
  const spreadsheet = getSpreadsheet_();
  ensureSignupSheet_(spreadsheet);
  installReminderTrigger_();
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", spreadsheet.getId());
  Logger.log(`Sign-up sheet: ${spreadsheet.getUrl()}`);
}

function doGet(e) {
  try {
    ensureSignupSheet_(getSpreadsheet_());
    const action = getParam_(e, "action") || "list";
    if (action !== "list") {
      return jsonp_({ success: false, error: `Unknown action: ${action}` }, e);
    }
    return jsonp_(buildPublicPayload_(), e);
  } catch (error) {
    return jsonp_({ success: false, error: errorMessage_(error) }, e);
  }
}

function doPost(e) {
  try {
    ensureSignupSheet_(getSpreadsheet_());
    const action = getParam_(e, "action") || "signup";
    if (action !== "signup") {
      return htmlPostMessage_({ success: false, error: `Unknown action: ${action}` });
    }
    return htmlPostMessage_(handleSignup_(e));
  } catch (error) {
    return htmlPostMessage_({ success: false, error: errorMessage_(error) });
  }
}

function handleSignup_(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const date = clean_(getParam_(e, "date"), 10);
    const name = clean_(getParam_(e, "name"), 100);
    const phone = clean_(getParam_(e, "phone"), 30);
    const reminderOptIn = getParam_(e, "reminderOptIn") === "true";
    const email = clean_(getParam_(e, "email"), 150);
    const userAgent = clean_(getParam_(e, "userAgent"), 500);

    if (!isAvailableDate_(date)) {
      return { success: false, error: "Please choose an available day in September 2026." };
    }
    if (!name || !phone) {
      return { success: false, error: "Please provide a name and phone number." };
    }
    if (reminderOptIn && !isValidEmail_(email)) {
      return { success: false, error: "Please provide a valid email address for the reminder." };
    }

    const duplicate = readSignupRows_().find((row) =>
      formatDateKey_(row.Date) === date &&
      clean_(row.Name, 100).toLowerCase() === name.toLowerCase() &&
      normalizePhone_(row.Phone) === normalizePhone_(phone)
    );
    if (duplicate) {
      return {
        success: true,
        message: `${name}, you are already signed up for ${formatDateLabel_(date)}.`,
        payload: buildPublicPayload_()
      };
    }

    const sheet = getSpreadsheet_().getSheetByName(SIGNUP_SHEET);
    sheet.appendRow([
      new Date(), Utilities.getUuid(), date, name, phone,
      reminderOptIn, reminderOptIn ? email : "", "", userAgent
    ]);

    return {
      success: true,
      message: `Thank you, ${name}! You are signed up for ${formatDateLabel_(date)}.`,
      payload: buildPublicPayload_()
    };
  } finally {
    lock.releaseLock();
  }
}

function buildPublicPayload_() {
  const seen = new Set();
  const signups = readSignupRows_()
    .filter((row) => {
      const key = [
        formatDateKey_(row.Date),
        clean_(row.Name, 100).toLowerCase(),
        normalizePhone_(row.Phone)
      ].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row) => ({
      id: String(row.SignupId || ""),
      date: formatDateKey_(row.Date),
      name: String(row.Name || ""),
      createdAt: stringifyDate_(row.Timestamp)
    }));
  return { success: true, signups, serverTime: new Date().toISOString() };
}

function sendReminders() {
  const spreadsheet = getSpreadsheet_();
  const sheet = ensureSignupSheet_(spreadsheet);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headers = values[0].map(String);
  const dateIndex = headers.indexOf("Date");
  const nameIndex = headers.indexOf("Name");
  const optInIndex = headers.indexOf("ReminderOptIn");
  const emailIndex = headers.indexOf("Email");
  const sentIndex = headers.indexOf("ReminderSent");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = Utilities.formatDate(tomorrow, TIME_ZONE, "yyyy-MM-dd");

  values.slice(1).forEach((row, offset) => {
    const optedIn = row[optInIndex] === true || String(row[optInIndex]).toLowerCase() === "true";
    const email = String(row[emailIndex] || "").trim();
    const alreadySent = String(row[sentIndex] || "").trim();
    if (!optedIn || !email || alreadySent || String(row[dateIndex]) !== tomorrowKey) return;

    const name = String(row[nameIndex] || "Friend");
    MailApp.sendEmail({
      to: email,
      subject: "Reminder: Your missionary fast is tomorrow",
      htmlBody:
        `<p>Hello ${escapeHtml_(name)},</p>` +
        `<p>This is a reminder that you signed up to fast and pray for missionary work tomorrow, ` +
        `${escapeHtml_(formatDateLabel_(tomorrowKey))}.</p>` +
        "<p>Thank you for helping the Sundance 1st Ward cover September in faith and prayer.</p>"
    });
    sheet.getRange(offset + 2, sentIndex + 1).setValue(new Date());
  });
}

function installReminderTrigger_() {
  const exists = ScriptApp.getProjectTriggers()
    .some((trigger) => trigger.getHandlerFunction() === "sendReminders");
  if (!exists) {
    ScriptApp.newTrigger("sendReminders")
      .timeBased()
      .atHour(18)
      .everyDays(1)
      .inTimezone(TIME_ZONE)
      .create();
  }
}

function getSpreadsheet_() {
  const storedId = SPREADSHEET_ID ||
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (storedId) return SpreadsheetApp.openById(storedId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const created = SpreadsheetApp.create("Sundance 1st Ward September Fast 2026");
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", created.getId());
  return created;
}

function ensureSignupSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(SIGNUP_SHEET);
  if (!sheet) sheet = spreadsheet.insertSheet(SIGNUP_SHEET);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SIGNUP_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SIGNUP_HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function readSignupRows_() {
  const sheet = getSpreadsheet_().getSheetByName(SIGNUP_SHEET);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((header) => String(header || "").trim());
  return values.slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

function isAvailableDate_(value) {
  const match = /^2026-09-(\d{2})$/.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  return day >= 1 && day <= 30 && day !== 6;
}

function formatDateKey_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !Number.isNaN(value.getTime())) {
    return Utilities.formatDate(value, TIME_ZONE, "yyyy-MM-dd");
  }
  const text = String(value || "").trim();
  if (isAvailableDate_(text)) return text;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : Utilities.formatDate(parsed, TIME_ZONE, "yyyy-MM-dd");
}

function normalizePhone_(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatDateLabel_(value) {
  const parts = String(value).split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
  return Utilities.formatDate(date, TIME_ZONE, "EEEE, MMMM d, yyyy");
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getParam_(e, name) {
  return e && e.parameter && Object.prototype.hasOwnProperty.call(e.parameter, name)
    ? e.parameter[name] : "";
}

function clean_(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function errorMessage_(error) {
  return String(error && error.message ? error.message : error);
}

function stringifyDate_(value) {
  return Object.prototype.toString.call(value) === "[object Date]"
    ? value.toISOString() : String(value || "");
}

function sanitizeCallback_(value) {
  const callback = String(value || "").trim();
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback)
    ? callback : "";
}

function jsonp_(payload, e) {
  const callback = sanitizeCallback_(getParam_(e, "callback"));
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlPostMessage_(payload) {
  const safePayload = Object.assign({ source: SOURCE }, payload);
  const json = JSON.stringify(safePayload).replace(/</g, "\\u003c");
  return HtmlService
    .createHtmlOutput(
      `<!doctype html><html><body><script>window.top.postMessage(${json}, "*");</script></body></html>`
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
