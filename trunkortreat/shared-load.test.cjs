const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const source = html.slice(
    html.indexOf("        const SHARED_LOAD_TIMEOUT_MS"),
    html.indexOf("        function appendHiddenInput")
);

function harness() {
    const scripts = [];
    const timers = new Map();
    const statuses = [];
    let timerId = 0;
    const context = vm.createContext({
        window: {},
        document: {
            createElement: () => ({ remove() { this.removed = true; } }),
            body: { appendChild: (script) => scripts.push(script) }
        },
        setTimeout: (fn, delay) => {
            timers.set(++timerId, { fn, delay });
            return timerId;
        },
        clearTimeout: (id) => timers.delete(id),
        Date, Math, Number, Array,
        isSharedMode: () => true,
        buildSharedUrl: (params) => `https://example.test/?${new URLSearchParams(params)}`,
        showStatus: (message, type) => statuses.push({ message, type }),
        els: { signupAvailability: { textContent: "" } },
        DEFAULT_STATE: {
            event: {},
            categories: [{ id: "salad-or-side", needed: 15 }]
        },
        normalizeState: (state) => state,
        saveSharedCache: () => {},
        render: () => {},
        renderSignupAvailability: () => {}
    });
    vm.runInContext("let sharedCategoriesReady = false; let sharedDataLoaded = false; let state;", context);
    vm.runInContext(source, context);
    return {
        context, scripts, statuses, timers,
        start: () => context.loadSharedData({ quiet: true }),
        ready: () => vm.runInContext("sharedCategoriesReady", context),
        loaded: () => vm.runInContext("sharedDataLoaded", context),
        state: () => vm.runInContext("state", context),
        respond: (payload, index = scripts.length - 1) => {
            const callback = new URL(scripts[index].src).searchParams.get("callback");
            context.window[callback](payload);
        },
        fire: (delay) => {
            const entry = [...timers].find(([, timer]) => timer.delay === delay);
            assert.ok(entry, `Expected a ${delay}ms timer`);
            timers.delete(entry[0]);
            entry[1].fn();
        }
    };
}

const payload = (needed = 15) => ({
    success: true,
    categories: [{ id: "salad-or-side", name: "Salad or Side", needed }],
    signups: [{ id: "one", categoryId: "salad-or-side", name: "Test", item: "Beans" }]
});

test("normal response enables shared sign-ups and preserves entries", () => {
    const h = harness();
    h.start();
    h.respond(payload());
    assert.equal(h.ready(), true);
    assert.equal(h.state().signups.length, 1);
    assert.equal(h.timers.size, 0);
});

test("two network errors recover on the third request", () => {
    const h = harness();
    h.start();
    h.scripts[0].onerror();
    h.fire(2000);
    h.scripts[1].onerror();
    h.fire(5000);
    h.respond(payload());
    assert.equal(h.scripts.length, 3);
    assert.equal(h.ready(), true);
});

test("backend error payload is retried", () => {
    const h = harness();
    h.start();
    h.respond({ success: false, error: "Temporary failure" });
    h.fire(2000);
    h.respond(payload());
    assert.equal(h.ready(), true);
});

test("a hung request times out; late response cannot overwrite fresh data", () => {
    const h = harness();
    h.start();
    h.fire(15000);
    h.fire(2000);
    h.respond(payload());
    h.respond(payload(20), 0);
    assert.equal(h.ready(), true);
    assert.equal(h.state().categories[0].needed, 15);
});

test("permanent failure stops after four attempts and reports an error", () => {
    const h = harness();
    h.start();
    for (const delay of [2000, 5000, 10000]) {
        h.scripts.at(-1).onerror();
        h.fire(delay);
    }
    h.scripts.at(-1).onerror();
    assert.equal(h.scripts.length, 4);
    assert.equal(h.ready(), false);
    assert.equal(h.loaded(), true);
    assert.equal(h.statuses.at(-1).type, "error");
    assert.equal(h.timers.size, 0);
});

test("sheet capacity is authoritative, including a closed zero-capacity bucket", () => {
    for (const needed of [20, 0]) {
        const h = harness();
        h.start();
        h.respond(payload(needed));
        assert.equal(h.ready(), true);
        assert.equal(h.state().categories[0].needed, needed);
    }
});

test("unrelated categories cannot capture this event's sign-ups", () => {
    const h = harness();
    h.start();
    const response = payload();
    response.categories.unshift({ id: "other-event", needed: 100 });
    h.respond(response);
    assert.equal(h.ready(), true);
    assert.equal(h.state().categories.length, 1);
    assert.equal(h.state().categories[0].id, "salad-or-side");
});

test("missing event bucket or invalid capacities keep sign-ups disabled", () => {
    for (const categories of [[], [{ id: "other", needed: 15 }],
        [{ id: "salad-or-side", needed: -1 }],
        [{ id: "salad-or-side", needed: "invalid" }],
        [{ id: "salad-or-side", needed: 1.5 }]]) {
        const h = harness();
        h.start();
        h.respond({ success: true, categories, signups: [] });
        assert.equal(h.ready(), false);
        assert.equal(h.statuses.at(-1).type, "error");
    }
});
