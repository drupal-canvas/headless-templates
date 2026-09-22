// Compare owned running servers backed by the same loopback fixture transport.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  properties,
  measureComponent,
  compareMeasurements,
} from "./parity-comparison.mjs";

const origin = process.env["TEMPLATE_ORIGIN"] ?? "http://127.0.0.1:4522";
const reference = process.env["REFERENCE_ORIGIN"];
assert(reference, "REFERENCE_ORIGIN is required for cross-framework parity");
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
const cases = await (await fetch(mock + "/cases")).json();
const measure = `(${measureComponent.toString()})(${JSON.stringify(properties)})`;
async function capture(base, path) {
  browser("open", base + path);
  browser(
    "wait",
    "--fn",
    "document.querySelector('video') ? document.querySelector('video').readyState >= 1 : Array.from(document.images).every(i => i.complete)",
  );
  browser("wait", "--fn", "document.readyState === 'complete'");
  return evaluate(measure);
}
const results = [];
try {
  browser("errors", "--clear");
  for (const width of [1440, 390]) {
    browser("set", "viewport", String(width), "900");
    for (const entry of cases) {
      const path = `/components/${entry.name}/${entry.index}`;
      const actual = await capture(origin, path);
      assert(actual.records.length, `${path} rendered no component elements`);
      const expected = await capture(reference, path);
      const result = {
        ...entry,
        width,
        actualElements: actual.records.length,
        expectedElements: expected.records.length,
        allowedStructuralDifferences: {
          actual: actual.allowed,
          expected: expected.allowed,
        },
        ...compareMeasurements(actual, expected),
      };
      results.push(result);
      console.log(
        `${width} ${entry.name}/${entry.index}: ${result.compared} compared, ${result.differences.length} differences`,
      );
    }
  }
  // Negative controls alter only this browser's disposable DOM, never fixtures
  // or template files. Reload before each mutation, and after the final one.
  const negativeControls = [];
  for (const [name, mutation, property] of [
    [
      "missing element",
      'document.querySelector("app-button a").remove()',
      "missing actual element",
    ],
    [
      "unexpected element",
      'document.querySelector("app-button").append(document.createElement("p"))',
      "unexpected actual element",
    ],
    [
      "changed class",
      'document.querySelector("app-button a").classList.remove("rounded-lg")',
      "classes",
    ],
    [
      "changed style",
      'document.querySelector("app-button a").style.color = "rgb(255, 0, 0)"',
      "color",
    ],
    [
      "changed content",
      'document.querySelector("app-button a").textContent = "Deliberately broken"',
      "text",
    ],
    [
      "changed link",
      'document.querySelector("app-button a").href = "/deliberately-broken"',
      "attrs",
    ],
  ]) {
    const expected = await capture(origin, "/components/button/0");
    evaluate(mutation);
    const comparison = compareMeasurements(evaluate(measure), expected);
    assert(
      comparison.differences.some((d) => d.property === property),
      `${name} regression escaped detection`,
    );
    negativeControls.push({
      name,
      caught: true,
      properties: [...new Set(comparison.differences.map((d) => d.property))],
    });
  }
  await capture(origin, "/components/button/0");
  const errors = browser("errors").errors;
  await writeFile(
    `${output}/parity.json`,
    JSON.stringify(
      { origin, reference, results, negativeControls, errors },
      null,
      2,
    ),
  );
  console.log(`Evidence: ${output}/parity.json`);
  assert.deepEqual(errors, [], "Browser errors");
  assert.equal(
    results.reduce((n, r) => n + r.differences.length, 0),
    0,
    "Parity differences; inspect evidence (including unmatched elements on both sides)",
  );
} finally {
  browser("close");
}
