"use strict";

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwpIPhF2ANhh3JIjsktNsw38peHWln7tgqd4tpsihZgTeIkY8fEx82lDJxBeUuXxa-Rvg/exec";
const YEAR = 2026;
const MONTH_INDEX = 8;
const EXCLUDED_DAY = 6;
const AVAILABLE_DAYS = 29;
const SOURCE = "ward-fast-september-2026";

const state = { signups: [], selectedDay: null, loading: false };
const $ = (id) => document.getElementById(id);
const configured = () => /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/i.test(BACKEND_URL);
const dateKey = (day) => `${YEAR}-09-${String(day).padStart(2, "0")}`;
const dateLabel = (day) => new Intl.DateTimeFormat("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric"
}).format(new Date(YEAR, MONTH_INDEX, day));
const signupsFor = (day) => state.signups.filter((entry) => entry.date === dateKey(day));

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function setStatus(message, type = "") {
  const element = $("status");
  element.textContent = message;
  element.className = `notice status ${type}`.trim();
  element.hidden = !message;
}

function render() {
  renderStats();
  renderCalendar();
  renderPrintList();
  if (state.selectedDay) renderDialogContent(state.selectedDay);
}

function renderStats() {
  const covered = Array.from({ length: 30 }, (_, index) => index + 1)
    .filter((day) => day !== EXCLUDED_DAY && signupsFor(day).length > 0).length;
  const open = AVAILABLE_DAYS - covered;
  const percent = Math.round((covered / AVAILABLE_DAYS) * 100);
  $("covered-count").textContent = covered;
  $("open-count").textContent = open;
  $("signup-count").textContent = state.signups.length;
  $("coverage-percent").textContent = `${percent}%`;
  $("progress-message").textContent = open === 0 ? "Every day is covered!" : `${open} ${open === 1 ? "day" : "days"} left to fill`;
  $("progress-fill").style.transform = `scaleX(${percent / 100})`;
  const track = document.querySelector(".progress-track");
  track.setAttribute("aria-valuenow", String(covered));
}

function renderCalendar() {
  const grid = $("calendar-grid");
  const firstWeekday = new Date(YEAR, MONTH_INDEX, 1).getDay();
  const cells = [];
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push('<span class="day blank" aria-hidden="true"></span>');
  }
  for (let day = 1; day <= 30; day += 1) {
    if (day === EXCLUDED_DAY) {
      cells.push(`
        <button class="day unavailable" type="button" disabled>
          <span class="day-number">${day}</span>
          <span class="day-status">Ward fast Sunday</span>
        </button>`);
      continue;
    }
    const entries = signupsFor(day);
    const covered = entries.length > 0;
    const names = entries.slice(0, 2).map((entry) => escapeHtml(entry.name)).join(", ");
    const more = entries.length > 2 ? ` +${entries.length - 2} more` : "";
    cells.push(`
      <button class="day ${covered ? "covered" : "open"}" type="button" data-day="${day}" aria-label="${dateLabel(day)}: ${covered ? `${entries.length} signed up` : "needs someone"}">
        <span class="day-number">${day}</span>
        <span class="day-status">${covered ? `${entries.length} signed up` : "Needs someone"}</span>
        ${covered ? `<span class="day-names">${names}${more}</span>` : ""}
      </button>`);
  }
  grid.innerHTML = cells.join("");
  grid.querySelectorAll("[data-day]").forEach((button) => {
    button.addEventListener("click", () => openDay(Number(button.dataset.day)));
  });
}

function renderPrintList() {
  const items = [];
  for (let day = 1; day <= 30; day += 1) {
    if (day === EXCLUDED_DAY) continue;
    const entries = signupsFor(day);
    items.push(`
      <div class="print-day">
        <strong>September ${day}</strong>
        ${entries.length
          ? `<ul>${entries.map((entry) => `<li>${escapeHtml(entry.name)}</li>`).join("")}</ul>`
          : "<span>— Needs someone —</span>"}
      </div>`);
  }
  $("list-days").innerHTML = items.join("");
}

function openDay(day) {
  state.selectedDay = day;
  renderDialogContent(day);
  $("signup-date").value = dateKey(day);
  $("signup-dialog").showModal();
  $("signup-name").focus();
}

function renderDialogContent(day) {
  $("dialog-title").textContent = dateLabel(day);
  const entries = signupsFor(day);
  $("day-signups").innerHTML = entries.length
    ? `<strong>${entries.length} already signed up:</strong><ul>${entries.map((entry) => `<li>${escapeHtml(entry.name)}</li>`).join("")}</ul>`
    : "<strong>This day still needs someone.</strong> Be the first to cover it.";
}

function loadSharedData() {
  if (!configured()) {
    $("setup-notice").hidden = false;
    render();
    return;
  }
  const callbackName = `wardFastCallback_${Date.now()}`;
  const script = document.createElement("script");
  const timeout = window.setTimeout(() => {
    cleanup();
    setStatus("The sign-up list could not be loaded. Please refresh and try again.", "error");
  }, 12000);
  function cleanup() {
    window.clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
  }
  window[callbackName] = (payload) => {
    cleanup();
    if (!payload || !payload.success) {
      setStatus(payload?.error || "The sign-up list could not be loaded.", "error");
      return;
    }
    state.signups = Array.isArray(payload.signups) ? payload.signups : [];
    render();
  };
  const url = new URL(BACKEND_URL);
  url.searchParams.set("action", "list");
  url.searchParams.set("callback", callbackName);
  url.searchParams.set("_", String(Date.now()));
  script.src = url.toString();
  script.onerror = () => {
    cleanup();
    setStatus("The sign-up list could not be loaded. Please refresh and try again.", "error");
  };
  document.head.appendChild(script);
}

function submitSignup(event) {
  event.preventDefault();
  if (state.loading) return;
  if (!configured()) {
    setStatus("Shared sign-ups are not connected yet. Please check back shortly.", "error");
    $("signup-dialog").close();
    return;
  }
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const reminder = $("signup-reminder").checked;
  if (reminder && !$("signup-email").value.trim()) {
    $("signup-email").required = true;
    $("signup-email").focus();
    return;
  }
  state.loading = true;
  form.querySelector("button[type='submit']").disabled = true;

  const iframeName = `ward_fast_submit_${Date.now()}`;
  const iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.hidden = true;
  const postForm = document.createElement("form");
  postForm.method = "POST";
  postForm.action = BACKEND_URL;
  postForm.target = iframeName;
  postForm.hidden = true;
  const fields = {
    action: "signup",
    date: $("signup-date").value,
    name: $("signup-name").value.trim(),
    phone: $("signup-phone").value.trim(),
    reminderOptIn: reminder ? "true" : "false",
    email: reminder ? $("signup-email").value.trim() : "",
    userAgent: navigator.userAgent
  };
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    postForm.appendChild(input);
  });
  const timeout = window.setTimeout(() => {
    window.removeEventListener("message", onMessage);
    finishSubmit({
      success: false, error: "The sign-up timed out. Please try again."
    }, iframe, postForm);
  }, 15000);
  const onMessage = (message) => {
    const trustedGoogleOrigin =
      message.origin === "https://script.google.com" ||
      /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/i.test(message.origin);
    if (!trustedGoogleOrigin || !message.data || message.data.source !== SOURCE) return;
    window.removeEventListener("message", onMessage);
    window.clearTimeout(timeout);
    finishSubmit(message.data, iframe, postForm);
  };
  window.addEventListener("message", onMessage);
  document.body.append(iframe, postForm);
  postForm.submit();
}

function finishSubmit(payload, iframe, postForm) {
  state.loading = false;
  $("signup-form").querySelector("button[type='submit']").disabled = false;
  iframe.remove();
  postForm.remove();
  if (!payload.success) {
    setStatus(payload.error || "Your sign-up could not be saved.", "error");
    return;
  }
  if (payload.payload?.signups) state.signups = payload.payload.signups;
  $("signup-form").reset();
  $("email-row").hidden = true;
  $("signup-email").required = false;
  $("signup-dialog").close();
  setStatus(payload.message || "Thank you! Your day is covered.", "success");
  render();
}

function printWithMode(mode) {
  document.body.classList.toggle("print-list-mode", mode === "list");
  $("print-dialog").close();
  window.print();
}

$("close-dialog").addEventListener("click", () => $("signup-dialog").close());
$("signup-form").addEventListener("submit", submitSignup);
$("signup-reminder").addEventListener("change", (event) => {
  $("email-row").hidden = !event.target.checked;
  $("signup-email").required = event.target.checked;
});
$("print-button").addEventListener("click", () => $("print-dialog").showModal());
document.querySelector(".close-print").addEventListener("click", () => $("print-dialog").close());
document.querySelectorAll("[data-print-mode]").forEach((button) => {
  button.addEventListener("click", () => printWithMode(button.dataset.printMode));
});
window.addEventListener("afterprint", () => document.body.classList.remove("print-list-mode"));

render();
loadSharedData();
