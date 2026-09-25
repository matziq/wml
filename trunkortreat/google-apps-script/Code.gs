/**
 * Sundance 1st Ward Trunk or Treat salad/side sign-up backend.
 *
 * This is a SEPARATE deployment from the Linger Longer backend. The Linger Longer
 * web app ignores event/sheet parameters and always returns its own data, so this
 * event gets its own script, its own tabs, and its own /exec URL.
 *
 * Run setup() once, then deploy as a web app with access set to Anyone.
 * Paste the resulting /exec URL into SHARED_BACKEND_URL in ../index.html.
 */

// Leave blank to use the spreadsheet this script is bound to, or paste a spreadsheet ID.
const SPREADSHEET_ID = "";
const SOURCE = "trunk-or-treat-salads";
const TIME_ZONE = "America/Phoenix";
const SIGNUP_SHEET = "TrunkOrTreatSignups";
const CATEGORY_SHEET = "TrunkOrTreatCategories";
const SIGNUP_HEADERS = [
  "Timestamp", "SignupId", "CategoryId", "Name", "Email", "Phone", "Item", "UserAgent"
];
const CATEGORY_HEADERS = ["CategoryId", "Name", "Needed", "Icon"];
const DEFAULT_CATEGORIES = [
  ["cole-slaw", "Cole Slaw", 4, "🥬"],
  ["potato-salad", "Potato Salad", 4, "🥔"],
  ["pasta-salad", "Pasta Salad", 4, "🍝"],
  ["green-salad", "Green Salads", 4, "🥗"],
  ["fruit-salad", "Fruit Salads", 3, "🍎"],
  ["other-salads", "Other Salads & Sides (Bean, Broccoli, Corn, Chips)", 3, "🎃"]
];

function setup() {
  const spreadsheet = getSpreadsheet_();
  ensureSignupSheet_(spreadsheet);
  ensureCategorySheet_(spreadsheet);
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", spreadsheet.getId());
  Logger.log(`Trunk or Treat sign-up sheet: ${spreadsheet.getUrl()}`);
}

function doGet(e) {
  try {
    const spreadsheet = getSpreadsheet_();
    ensureSignupSheet_(spreadsheet);
    ensureCategorySheet_(spreadsheet);
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
    const spreadsheet = getSpreadsheet_();
    ensureSignupSheet_(spreadsheet);
    ensureCategorySheet_(spreadsheet);
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
    const categoryId = clean_(getParam_(e, "categoryId"), 60);
    const name = clean_(getParam_(e, "name"), 100);
    const email = clean_(getParam_(e, "email"), 150);
    const phone = clean_(getParam_(e, "phone"), 30);
    const item = clean_(getParam_(e, "item"), 200);
    const userAgent = clean_(getParam_(e, "userAgent"), 500);

    const category = readCategoryRows_().find((row) => row.id === categoryId);
    if (!category) {
      return { success: false, error: "Please choose a salad or side type from the list." };
    }
    if (!name || !item) {
      return { success: false, error: "Please provide your name and what you are bringing." };
    }
    if (!isValidEmail_(email)) {
      return { success: false, error: "Please provide a valid email address." };
    }
    if (!phone) {
      return { success: false, error: "Please provide a phone number." };
    }

    const existing = readSignupRows_();
    const taken = existing.filter((row) => clean_(row.CategoryId, 60) === categoryId).length;
    if (taken >= category.needed) {
      return {
        success: false,
        error: `${category.name} is full. Please choose another salad or side.`,
        payload: buildPublicPayload_()
      };
    }

    const duplicate = existing.find((row) =>
      clean_(row.CategoryId, 60) === categoryId &&
      clean_(row.Name, 100).toLowerCase() === name.toLowerCase() &&
      clean_(row.Item, 200).toLowerCase() === item.toLowerCase()
    );
    if (duplicate) {
      return {
        success: true,
        message: `${name}, you are already signed up to bring ${item}.`,
        payload: buildPublicPayload_()
      };
    }

    getSpreadsheet_().getSheetByName(SIGNUP_SHEET).appendRow([
      new Date(), Utilities.getUuid(), categoryId, name, email, phone, item, userAgent
    ]);

    return {
      success: true,
      message: `Thank you, ${name}! You are signed up to bring ${item}.`,
      payload: buildPublicPayload_()
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Public payload: name and item only. Email and phone stay private in the sheet.
 */
function buildPublicPayload_() {
  const categories = readCategoryRows_().map((row) => ({
    id: row.id,
    name: row.name,
    needed: row.needed,
    icon: row.icon
  }));
  const signups = readSignupRows_().map((row) => ({
    id: String(row.SignupId || ""),
    categoryId: clean_(row.CategoryId, 60),
    name: String(row.Name || ""),
    item: String(row.Item || ""),
    createdAt: stringifyDate_(row.Timestamp)
  })).filter((entry) => entry.categoryId && entry.name && entry.item);
  return { success: true, categories, signups, serverTime: new Date().toISOString() };
}

function getSpreadsheet_() {
  const storedId = SPREADSHEET_ID ||
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (storedId) return SpreadsheetApp.openById(storedId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const created = SpreadsheetApp.create("Sundance 1st Ward Trunk or Treat 2026");
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", created.getId());
  return created;
}

function ensureSignupSheet_(spreadsheet) {
  return ensureSheet_(spreadsheet, SIGNUP_SHEET, SIGNUP_HEADERS, []);
}

function ensureCategorySheet_(spreadsheet) {
  return ensureSheet_(spreadsheet, CATEGORY_SHEET, CATEGORY_HEADERS, DEFAULT_CATEGORIES);
}

function ensureSheet_(spreadsheet, name, headers, seedRows) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    seedRows.forEach((row) => sheet.appendRow(row));
  }
  return sheet;
}

function readSignupRows_() {
  return readRows_(SIGNUP_SHEET);
}

function readCategoryRows_() {
  return readRows_(CATEGORY_SHEET)
    .map((row) => ({
      id: clean_(row.CategoryId, 60),
      name: clean_(row.Name, 120),
      needed: Math.max(0, parseInt(row.Needed, 10) || 0),
      icon: clean_(row.Icon, 8) || "🥗"
    }))
    .filter((row) => row.id && row.name);
}

function readRows_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((header) => String(header || "").trim());
  return values.slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
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
