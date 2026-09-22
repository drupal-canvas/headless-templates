// Run against owned, already-running servers with the loopback mock transport.
// REFERENCE_ORIGIN may point to an independently copied existing template.
// No running app, source file, or shared Drupal configuration is changed.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const origin = process.env["TEMPLATE_ORIGIN"] ?? "http://127.0.0.1:4522";
const reference = process.env["REFERENCE_ORIGIN"];
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
const properties = [
  "display",
  "color",
  "backgroundColor",
  "fontSize",
  "lineHeight",
  "fontWeight",
  "textAlign",
  "gap",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginBottom",
  "borderTopWidth",
  "borderBottomWidth",
  "borderColor",
  "borderTopLeftRadius",
  "borderBottomLeftRadius",
  "gridTemplateColumns",
  "flexDirection",
];
const measure = `(() => {
 const seen = new Map();
 return Array.from(document.body.querySelectorAll('*')).filter(el => el.namespaceURI === 'http://www.w3.org/1999/xhtml' && !el.localName.includes('-') && el.className && !el.closest('[aria-live]')).map(el => {
  const style = getComputedStyle(el); const box = el.getBoundingClientRect();
  const key = el.localName + ':' + Array.from(el.classList).filter(c => c !== 'ng-star-inserted').sort().join(' ');
  const index = seen.get(key) || 0; seen.set(key, index + 1);
  return { key: key + ':' + index, tag: el.localName, text: (el.innerText || '').trim(), x: box.x, y: box.y, width: box.width, height: box.height, style: Object.fromEntries(${JSON.stringify(properties)}.map(p => [p, style[p]])) };
 });
})()`;
async function capture(base, path) {
  browser("open", base + path);
  browser(
    "wait",
    "--fn",
    "document.querySelector('video') ? document.querySelector('video').readyState >= 1 : Array.from(document.images).every(i => i.complete)",
  );
  // Bordered Vue items derive group state in onMounted; wait for hydration work.
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
      assert(actual.length, `${path} rendered no component elements`);
      const result = {
        ...entry,
        width,
        measuredElements: actual.length,
        compared: 0,
        differences: [],
      };
      if (reference) {
        const expected = await capture(reference, path);
        const byKey = new Map(expected.map((el) => [el.key, el]));
        for (const el of actual) {
          const other = byKey.get(el.key);
          if (!other) continue; // Framework wrapper differences aren't parity differences.
          result.compared++;
          for (const dimension of ["x", "y", "width", "height"]) {
            if (Math.abs(el[dimension] - other[dimension]) > 1)
              result.differences.push({
                key: el.key,
                property: dimension,
                actual: el[dimension],
                expected: other[dimension],
              });
          }
          for (const prop of properties) {
            const actualValue = el.style[prop],
              expectedValue = other.style[prop];
            const roundingOnly =
              /^-?[\d.]+px$/.test(actualValue) &&
              /^-?[\d.]+px$/.test(expectedValue) &&
              Math.abs(parseFloat(actualValue) - parseFloat(expectedValue)) <
                0.01;
            if (actualValue !== expectedValue && !roundingOnly)
              result.differences.push({
                key: el.key,
                property: prop,
                actual: actualValue,
                expected: expectedValue,
              });
          }
        }
        assert(result.compared, `No comparable native elements: ${path}`);
      }
      results.push(result);
      console.log(
        `${width} ${entry.name}/${entry.index}: ${result.compared} compared, ${result.differences.length} differences`,
      );
    }
  }
  const errors = browser("errors").errors;
  await writeFile(
    `${output}/parity.json`,
    JSON.stringify({ origin, reference, results, errors }, null, 2),
  );
  console.log(`Evidence: ${output}/parity.json`);
  assert.deepEqual(errors, [], "Browser errors");
  assert.equal(
    results.reduce((total, result) => total + result.differences.length, 0),
    0,
    "Computed layout/style parity differences; inspect evidence",
  );
} finally {
  browser("close");
}
