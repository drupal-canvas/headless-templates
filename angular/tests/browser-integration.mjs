import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const origin = process.env["TEMPLATE_ORIGIN"] ?? "http://127.0.0.1:4522";
const mock = process.env["MOCK_ORIGIN"] ?? "http://127.0.0.1:4520";
const output =
  process.env["EVIDENCE_DIR"] ?? join(tmpdir(), "angular-template-browser");
assert(
  process.env["AGENT_BROWSER_SESSION"],
  "Use an owned AGENT_BROWSER_SESSION",
);
await mkdir(output, { recursive: true });
const browser = (...args) => {
  const result = JSON.parse(
    execFileSync("agent-browser", [...args, "--json"], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    }),
  );
  assert(result.success, JSON.stringify(result));
  return result.data;
};
const evaluate = (js) => browser("eval", js).result;
const assertions = [];
const passed = (name) => {
  assertions.push(name);
  console.log(name);
};
const getAssertion = async (ttl = 900) =>
  (
    await (
      await fetch(mock + "/assertion?ttl=" + ttl, {
        headers: { Connection: "close" },
      })
    ).json()
  ).assertion;
try {
  const response = await fetch(origin + "/gallery");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /ng-server-context="ssr"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /application\/ld\+json/);
  assert(!html.includes("fixture-private-token"));
  assert(!html.includes("codeVerifier"));
  assert(!html.includes("data-canvas-marker"));
  assert.equal((await fetch(origin + "/missing")).status, 404);
  const redirect = await fetch(origin + "/redirect", { redirect: "manual" });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), "/components/heading/0");
  for (const path of ["/gallery", "/missing", "/api/canvas/page?path=/"])
    assert.match(
      (await fetch(origin + path)).headers.get("cache-control"),
      /private, no-store/,
    );
  passed(
    "Request-time SSR, published markers absent, metadata head, 301/404 and private/no-store",
  );

  assert.equal((await fetch(origin + "/api/canvas/components")).status, 401);
  const metadata = await fetch(origin + "/api/canvas/components", {
    headers: {
      Authorization: "Bearer " + (await getAssertion()),
      Origin: mock,
    },
  });
  assert.equal(metadata.status, 200);
  assert.equal((await metadata.json()).components.length, 18);
  passed(
    "Authenticated metadata contains all 18 components; anonymous request denied",
  );

  const activate = await fetch(
    origin + "/api/draft?assertion=" + encodeURIComponent(await getAssertion()),
    { redirect: "manual" },
  );
  assert.equal(activate.status, 307);
  const cookies = activate.headers.getSetCookie();
  assert(
    cookies.every(
      (c) =>
        /HttpOnly/.test(c) &&
        /Secure/.test(c) &&
        /SameSite=None/.test(c) &&
        /Partitioned/.test(c),
    ),
  );
  const Cookie = cookies.map((c) => c.split(";")[0]).join("; ");
  const pageData = await (
    await fetch(origin + "/api/canvas/page?path=/components/accordion/0", {
      headers: { Cookie },
    })
  ).json();
  assert.equal(pageData.page.content.canvasDraftMode, true);
  assert.equal(pageData.page.route.entity.uuid, "fixture-entity");
  assert.equal(pageData.session.enabled, true);
  assert(!JSON.stringify(pageData).includes("fixture-private-token"));
  const entity = await (
    await fetch(origin + "/api/canvas/entity?type=node&id=42&viewMode=teaser", {
      headers: { Cookie },
    })
  ).json();
  assert.equal(entity.entity.uuid, "fixture-entity");
  const thumbnail = await fetch(
    origin + "/api/canvas/component-preview?componentId=js.heading",
    { headers: { Cookie } },
  );
  assert.equal(thumbnail.status, 200);
  const thumbnailHtml = await thumbnail.text();
  assert.match(thumbnailHtml, /Enter a heading/);
  assert.match(thumbnailHtml, /ng-server-context="ssr"/);
  passed(
    "Draft cookies, allowlisted page/session data, route/entity context and SSR component thumbnail",
  );

  browser("errors", "--clear");
  browser("open", origin + "/missing");
  browser("wait", "--text", "Not found");
  evaluate('window.navigationSentinel = "retained"');
  browser("click", 'a[href="/"]');
  browser(
    "wait",
    "--fn",
    'document.querySelector("app-hero") !== null && document.title === "Fixture /"',
  );
  assert.equal(evaluate("window.navigationSentinel"), "retained");
  assert.equal(
    evaluate(
      'document.querySelectorAll("link[rel=canonical][data-canvas-head]").length',
    ),
    1,
  );
  passed(
    "Angular RouterLink navigation resolves through the adapter and replaces document head without reloading",
  );

  browser("open", origin + "/components/accordion/0");
  browser(
    "wait",
    "--fn",
    "document.querySelectorAll('[data-accordion-button]').length === 3",
  );
  browser("focus", "[data-accordion-button]");
  browser("press", "Enter");
  browser(
    "wait",
    "--fn",
    "document.querySelector('[data-accordion-button]').getAttribute('aria-expanded') === 'false'",
  );
  assert.equal(
    evaluate("document.querySelector('[data-accordion-content]').inert"),
    true,
  );
  browser("press", "Space");
  browser(
    "wait",
    "--fn",
    "document.querySelector('[data-accordion-button]').getAttribute('aria-expanded') === 'true'",
  );
  browser("click", "#faq-multiple button");
  browser(
    "wait",
    "--fn",
    "document.querySelectorAll('[data-accordion-button][aria-expanded=true]').length === 2",
  );
  browser("open", origin + "/components/accordion/0#faq-editors");
  browser(
    "wait",
    "--fn",
    "document.querySelector('#faq-editors button').getAttribute('aria-expanded') === 'true'",
  );
  passed(
    "Accordion keyboard Enter/Space, inert collapsed content, multiple panels, anchor opening",
  );

  browser("open", origin + "/components/video/0");
  browser("wait", "--fn", 'document.querySelector("video").readyState >= 2');
  assert.equal(evaluate('document.querySelector("video").controls'), true);
  browser("find", "role", "button", "click", "--name", "play", "--exact");
  browser("wait", "--fn", 'document.querySelector("video").currentTime > 0');
  evaluate('document.querySelector("video").pause()');
  passed("Native video controls and actual local media playback");

  // Install tests/host.html and a bundled tests/host.ts in the disposable
  // build's browser directory only. This is not a production application route.
  browser(
    "open",
    origin +
      "/host.html?frontend=" +
      encodeURIComponent(origin) +
      "&mock=" +
      encodeURIComponent(mock),
  );
  browser(
    "wait",
    "--fn",
    'window.fixtureEvents?.some(e => e.type === "active")',
  );
  const frame = 'document.querySelector("iframe").contentWindow';
  browser(
    "wait",
    "--fn",
    `${frame}.document.querySelectorAll('[data-canvas-marker]').length > 0`,
  );
  assert.equal(
    evaluate(`${frame}.document.cookie.includes("canvas_headless")`),
    false,
  );
  assert.equal(
    evaluate(
      `${frame}.document.querySelector("[data-draft-session-view=active]") === null`,
    ),
    true,
  );
  evaluate(
    `window.fixtureButton = ${frame}.document.querySelector("#faq-multiple button"); window.fixtureButton.click()`,
  );
  browser(
    "wait",
    "--fn",
    'window.fixtureButton.getAttribute("aria-expanded") === "true"',
  );
  browser("click", "#refresh");
  browser(
    "wait",
    "--fn",
    'window.fixtureEvents.some(e => e.type === "geometry" && e.geometry.some(g => g.id === "accordion-0"))',
  );
  browser(
    "wait",
    "--fn",
    'window.fixtureEvents.some(e => e.type === "renewing") && window.fixtureEvents.some(e => e.type === "active" && e.tokenExpiresAt > Date.now() + 600000)',
  );
  assert.equal(
    evaluate(
      'window.fixtureButton.isConnected && window.fixtureButton.getAttribute("aria-expanded") === "true"',
    ),
    true,
  );
  passed(
    "Shared host activation, hidden embedded banner, geometry, refresh state retention and timer renewal",
  );

  browser(
    "open",
    origin +
      "/api/draft?assertion=" +
      encodeURIComponent(await getAssertion(1)),
  );
  browser("wait", "--text", "Draft preview session expired.");
  assert.equal(
    evaluate(
      'document.querySelector("[data-draft-session-view=expired] a").href',
    ),
    mock + "/renew",
  );
  browser("click", 'form[action="/api/disable-draft"] button');
  browser("wait", "--url", origin + "/");
  browser("wait", "--fn", 'document.querySelector("app-hero") !== null');
  assert.equal(
    evaluate('document.querySelectorAll("[data-canvas-marker]").length'),
    0,
  );
  passed(
    "Expired banner, signed renewal link, ordinary POST exit and public navigation",
  );

  for (const width of [1440, 390]) {
    browser("set", "viewport", String(width), "900");
    browser("open", origin + "/gallery");
    browser(
      "wait",
      "--fn",
      "Array.from(document.images).every(i => i.complete)",
    );
    browser("screenshot", `${output}/all-components-${width}.png`, "--full");
  }
  const errors = browser("errors").errors;
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/integration.json`,
    JSON.stringify(
      {
        origin,
        assertions,
        errors,
        limitation:
          "Loopback mock transport; not live Drupal authorization or HTTPS cross-site browser-matrix proof",
      },
      null,
      2,
    ),
  );
} finally {
  browser("close");
}
