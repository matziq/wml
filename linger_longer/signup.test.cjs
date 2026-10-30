const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ids = ["chips", "beans", "guacamole", "toppings"].map((id) => `2026-11-01-${id}`);
const november = { categoryId: ids[0], name: "November Person", item: "Tortilla chips" };
const october = { categoryId: "soup", name: "October Person", item: "Chowder" };
const payload = (signups = []) => ({
    success: true, categories: ids.map((id) => ({ id, active: true })), signups
});

function harness(cache = {}) {
    const nodes = new Map();
    const scripts = [];
    const forms = [];
    const timers = new Map();
    const selected = [];
    const fields = [];
    const storage = new Map(Object.entries(cache));
    let timerId = 0;
    let now = Date.now();
    const node = () => ({
        innerHTML: "", textContent: "", value: "", disabled: false, hidden: true,
        dataset: {}, children: [], attributes: {},
        addEventListener() {}, focus() { this.focused = true; },
        setAttribute(name, value) { this.attributes[name] = value; },
        appendChild(child) { this.children.push(child); },
        remove() { this.removed = true; },
        submit() { this.submitted = true; },
        reset() { selected.length = 0; fields.length = 0; },
        contains() { return false; },
        querySelector() { return node(); }
    });
    const get = (id) => {
        if (!nodes.has(id)) nodes.set(id, node());
        return nodes.get(id);
    };
    const schedule = (fn, delay) => {
        timers.set(++timerId, { fn, delay });
        return timerId;
    };
    const context = vm.createContext({
        URL, console,
        Date: class extends Date { static now() { return now; } },
        navigator: { userAgent: "Regression test" },
        localStorage: {
            getItem: (key) => storage.get(key),
            setItem: (key, value) => storage.set(key, value)
        },
        document: {
            getElementById: get,
            createElement: (tag) => {
                const element = node();
                element.tag = tag;
                if (tag === "script") scripts.push(element);
                if (tag === "form") forms.push(element);
                return element;
            },
            body: { appendChild() {}, append() {} },
            addEventListener() {},
            querySelectorAll: (selector) => {
                if (selector === 'input[name="signup-type"]:checked') return selected;
                if (selector === "[data-item-for]") return fields;
                if (selector === "[data-shared-submit]") return forms;
                return [];
            },
            querySelector: (selector) => {
                const id = selector.match(/data-item-for="([^"]+)"/);
                return id ? fields.find((field) => field.dataset.itemFor === id[1]) : get("first-choice");
            }
        },
        window: {
            setTimeout: schedule, clearTimeout: (id) => timers.delete(id),
            setInterval: schedule, clearInterval: (id) => timers.delete(id),
            print() {}
        }
    });
    get("signup-submit").disabled = /id="signup-submit" disabled/.test(html);
    vm.runInContext(script, context);
    return {
        context, nodes, scripts, forms, timers, storage, get,
        read: (expression) => vm.runInContext(expression, context),
        respond: (response, index = scripts.length - 1) => {
            const callback = new URL(scripts[index].src).searchParams.get("callback");
            context.window[callback](response);
        },
        fire: (delay) => {
            const entry = [...timers].find(([, timer]) => timer.delay === delay);
            assert.ok(entry, `Expected a ${delay}ms timer`);
            if (delay !== 2000) timers.delete(entry[0]);
            entry[1].fn();
        },
        advance: (milliseconds) => { now += milliseconds; },
        choose: (...choices) => {
            selected.length = 0;
            fields.length = 0;
            choices.forEach((id) => {
                selected.push({ value: id });
                fields.push({ dataset: { itemFor: id }, value: "" });
            });
        },
        submit: () => context.onSubmit({ preventDefault() {} })
    };
}

test("November content, categories, and print sheet consistently offer nacho contributions, not queso", () => {
    const h = harness();
    assert.match(html, /Sunday, November 1, 2026/);
    assert.match(html, /<title>November Linger Longer: Nacho Bar Sign-Up/);
    assert.match(html, /Queso will be provided/);
    assert.match(html, /Queso is provided/);
    assert.doesNotMatch(html, /October|Soup|Bread|Dessert|Beverage/);
    assert.deepEqual(Array.from(h.read("TYPES"), (type) => type.id), ids);
    assert.match(h.get("type-options").innerHTML, /Guacamole/);
    assert.doesNotMatch(h.get("type-options").innerHTML, /Queso/);
    assert.equal(h.get("print-rows").innerHTML.match(/<tr>/g).length, 15);
});

test("both calendars preserve 2 PM Phoenix, location, 90 minutes, and provided queso", () => {
    const h = harness();
    const google = new URL(h.get("google-cal-link").href);
    assert.equal(google.searchParams.get("dates"), "20261101T210000Z/20261101T223000Z");
    assert.equal(google.searchParams.get("text"), "November Linger Longer: Nacho Bar");
    assert.match(google.searchParams.get("details"), /Queso is provided/);
    assert.equal(google.searchParams.get("location"), "Sundance 1st Ward Cultural Hall");
    const ics = fs.readFileSync(path.join(__dirname, "linger-longer-november-2026.ics"), "utf8");
    assert.match(html, /href="linger-longer-november-2026.ics"/);
    assert.match(ics, /DTSTART:20261101T210000Z/);
    assert.match(ics, /DTEND:20261101T223000Z/);
    assert.match(ics, /UID:linger-longer-2026-11-01@wardmission.org/);
    assert.match(ics, /SUMMARY:November Linger Longer: Nacho Bar/);
    const local = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Phoenix", hour: "numeric", minute: "numeric", weekday: "long"
    }).format(new Date("2026-11-01T21:00:00Z"));
    assert.equal(local, "Sunday 2:00 PM");
});

test("legacy backend never enables submission or carries October entries into display, print, or cache", () => {
    const h = harness();
    h.respond({ categories: [{ id: "soup" }, { id: "bread" }], signups: [october] });
    assert.equal(h.get("signup-submit").disabled, true);
    assert.match(h.get("signup-status").textContent, /organizer needs to enable/);
    assert.doesNotMatch(h.get("signup-list").innerHTML, /October Person|Chowder/);
    assert.doesNotMatch(h.get("print-rows").innerHTML, /October Person|Chowder/);
    h.get("signup-name").value = "Test";
    h.choose(ids[0]);
    h.submit();
    assert.equal(h.forms.length, 0);
    assert.equal(h.storage.get("linger-longer-2026-11-01-cache-v1"), "[]");
});

test("fresh complete categories enable submission and only exact November IDs are displayed and printed", () => {
    const h = harness();
    h.respond(payload([october, november, { ...november, categoryId: "2026-11-01-chips-old" }]));
    assert.equal(h.get("signup-submit").disabled, false);
    assert.equal(h.read("signups.length"), 1);
    assert.match(h.get("signup-list").innerHTML, /November Person/);
    assert.match(h.get("print-rows").innerHTML, /Tortilla chips/);
    assert.doesNotMatch(h.get("print-rows").innerHTML, /October Person/);
    assert.match(h.get("print-count").textContent, /1 signed up/);
});

test("missing, inactive, malformed, and error responses fail closed", () => {
    for (const response of [
        null, { success: false }, {}, { categories: ids.map((id) => ({ id })) },
        { ...payload(), categories: ids.slice(1).map((id) => ({ id })) },
        { ...payload(), categories: ids.map((id) => ({ id, active: id !== ids[0] })) }
    ]) {
        const h = harness();
        h.respond(payload());
        h.context.loadSharedData();
        h.respond(response);
        assert.equal(h.get("signup-submit").disabled, true);
        assert.equal(h.read("backendReady"), false);
    }
});

test("event cache is filtered and never authorizes offline writes; October cache is untouched", () => {
    const oldKey = "linger-longer-october-2026-cache-v1";
    const oldValue = JSON.stringify([october]);
    const h = harness({
        [oldKey]: oldValue,
        "linger-longer-2026-11-01-cache-v1": JSON.stringify([october, november])
    });
    assert.equal(h.read("signups.length"), 1);
    assert.equal(h.get("signup-submit").disabled, true);
    h.scripts[0].onerror();
    assert.match(h.get("signup-status").textContent, /cached/);
    h.submit();
    assert.equal(h.forms.length, 0);
    assert.equal(h.storage.get(oldKey), oldValue);
    for (const value of ["not json", "{}", "null"]) {
        const invalid = harness({ "linger-longer-2026-11-01-cache-v1": value });
        assert.equal(invalid.read("signups.length"), 0);
    }
});

test("hung requests time out and late callbacks cannot re-enable submission", () => {
    const h = harness();
    h.fire(15000);
    assert.equal(h.get("signup-submit").disabled, true);
    assert.match(h.get("signup-status").textContent, /Couldn't load/);
    h.respond(payload());
    assert.equal(h.get("signup-submit").disabled, true);
    h.context.loadSharedData();
    h.respond(payload());
    assert.equal(h.get("signup-submit").disabled, false);
});

test("real submit path sends date-scoped categories, preserves optional fields, and confirms only backend reads", () => {
    const h = harness();
    h.respond(payload([october]));
    h.get("signup-name").value = "New Person";
    h.choose(ids[0], ids[1]);
    h.submit();
    assert.equal(h.get("signup-submit").disabled, true);
    h.fire(0);
    h.fire(600);
    assert.equal(h.forms.length, 2);
    const posts = h.forms.map((form) => Object.fromEntries(form.children.map((input) => [input.name, input.value])));
    assert.deepEqual(posts.map((post) => post.categoryId), ids.slice(0, 2));
    assert.ok(posts.every((post) => post.email === "Not provided" && post.phone === "Not provided"));
    assert.ok(h.forms.every((form) => form.submitted));
    h.fire(2000);
    h.respond(payload());
    assert.doesNotMatch(h.get("signup-status").textContent, /You're signed up/);
    h.fire(2000);
    h.respond(payload(ids.slice(0, 2).map((categoryId) => ({ categoryId, name: "New Person", item: "Test contribution" }))));
    assert.match(h.get("signup-status").textContent, /You're signed up. See you on November 1/);
    assert.equal(h.get("signup-submit").disabled, false);
    assert.equal(h.read("submitSignup.timer"), null);
});

test("partial writes and failed confirmation never report success", () => {
    const h = harness();
    h.respond(payload());
    h.get("signup-name").value = "New Person";
    h.choose(ids[0], ids[1]);
    h.submit();
    h.fire(2000);
    h.advance(40000);
    h.respond(payload([{ categoryId: ids[0], name: "New Person", item: "Chips" }]));
    assert.match(h.get("signup-status").textContent, /Only part of your sign-up saved/);
    assert.doesNotMatch(h.get("signup-status").textContent, /You're signed up/);
});

test("validation and duplicate detection prevent unintended posts", () => {
    const h = harness();
    h.respond(payload([november]));
    h.submit();
    assert.match(h.get("signup-status").textContent, /enter your name/);
    h.get("signup-name").value = "November Person";
    h.submit();
    assert.match(h.get("signup-status").textContent, /choose chips, beans, guacamole/);
    h.choose(ids[0]);
    h.get("signup-email").value = "bad";
    h.submit();
    assert.match(h.get("signup-status").textContent, /email doesn't look right/);
    h.get("signup-email").value = "";
    h.submit();
    assert.match(h.get("signup-status").textContent, /already signed up/);
    assert.equal(h.forms.length, 0);
});
