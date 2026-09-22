// Run in each disposable installed consumer:
// node --import @angular/compiler --test tests/canonical-request.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";
import {
  copyRequestToUrl,
  prepareRequest,
  requestPolicy,
} from "../src/request-policy.ts";

function message(target, headers = {}, rawHeaders) {
  const req = new IncomingMessage(new Socket());
  req.url = target;
  req.method = "GET";
  req.headers = { host: "localhost:4542", ...headers };
  req.rawHeaders =
    rawHeaders ??
    Object.entries(req.headers).flatMap(([k, v]) =>
      Array.isArray(v) ? v.flatMap((value) => [k, value]) : [k, v],
    );
  return req;
}
const canonical = (origin = "https://frontend.example") =>
  requestPolicy({
    CANVAS_ALLOWED_HOSTS: "localhost",
    CANVAS_CANONICAL_ORIGIN: origin,
  });

test("canonical URL and encoded target invariant under baseline/spoof/duplicate forwarding", () => {
  for (const origin of [
    "https://frontend.example",
    "https://frontend.example:8443",
  ]) {
    const policy = canonical(origin);
    assert.equal(policy.trustProxyHeaders, false);
    assert.deepEqual(policy.allowedHosts, ["localhost"]);
    assert(policy.engineAllowedHosts.includes("frontend.example"));
    for (const target of [
      "/a%2Fb/%23?q=%26%3F&case=%2f&plus=a+b",
      "/a?",
      "/api/draft?assertion=e30.%2F%2B%3D.signature",
    ]) {
      for (const headers of [
        {},
        {
          "x-forwarded-host": "evil.example",
          "x-forwarded-proto": "http",
          "x-forwarded-port": "444",
        },
        {
          "x-forwarded-host": "evil.example,frontend.example",
          forwarded: "host=evil.example;proto=http",
          "x-forwarded-prefix": "/evil",
        },
        {
          "x-forwarded-host": ["evil.example", "frontend.example"],
          "x-forwarded-proto": ["http", "https"],
          "x-forwarded-port": ["444", "443"],
          "x-forwarded-unknown": "anything",
        },
      ]) {
        const request = prepareRequest(message(target, headers), policy);
        assert.equal(request.url, origin + target);
        assert.equal(new URL(request.url).origin, origin);
        assert.equal(request.headers.get("host"), "localhost:4542");
        assert(
          ![...request.headers.keys()].some(
            (name) => name === "forwarded" || name.startsWith("x-forwarded-"),
          ),
        );
      }
    }
  }
});

test("validate the actual converter target (originalUrl takes precedence)", () => {
  const invalid = [
    "https://evil.example/a",
    "evil.example:443",
    "//evil.example/a",
    "/\\evil",
    "/a#fragment",
    "/a\r\nb",
    "/a\tb",
    "/a\u0000b",
    "/a\u007fb",
    "/a/../b",
    "/%2e%2e/b",
    "/a b",
  ];
  for (const target of invalid) {
    assert.throws(() => prepareRequest(message(target), canonical()), /target/);
    const req = message("/safe");
    req.originalUrl = target;
    assert.throws(() => prepareRequest(req, canonical()), /target/);
  }
  const req = message("/rewritten");
  req.originalUrl = "/original%2Fpath?x=%23";
  assert.equal(
    prepareRequest(req, canonical()).url,
    "https://frontend.example/original%2Fpath?x=%23",
  );
});

test("raw Host remains mandatory, singular and independent of canonical authority", () => {
  for (const host of [
    "",
    "evil.example",
    "frontend.example",
    "localhost/path",
    "user@localhost",
    "localhost,evil.example",
    "localhost\t",
  ]) {
    assert.throws(() => prepareRequest(message("/", { host }), canonical()));
  }
  assert.throws(
    () =>
      prepareRequest(
        message("/", {}, ["Host", "localhost", "host", "localhost"]),
        canonical(),
      ),
    /Repeated/,
  );
});

test("Node POST stream is consumed once; encoded body, cookies, auth and Origin unchanged", async () => {
  const payload = "assertion=e30.%2B%2F%3D&json=%7B%22x%22%3A%22a%2Bb%22%7D";
  const headers = {
    origin: "https://foreign.example",
    cookie: "one=a%2Fb; two=c+d",
    authorization: "Bearer fixture-credential",
    "content-type": "application/x-www-form-urlencoded",
    "x-forwarded-host": ["evil.example", "frontend.example"],
  };
  const req = message("/api/draft/renew?q=%2B%2f", headers);
  req.method = "POST";
  let pushes = 0;
  req._read = () => {
    if (!pushes++) {
      req.push(Buffer.from(payload));
      req.push(null);
    }
  };
  const request = prepareRequest(req, canonical());
  assert.equal(
    request.url,
    "https://frontend.example/api/draft/renew?q=%2B%2f",
  );
  assert.equal(request.method, "POST");
  assert.equal(request.bodyUsed, false);
  for (const name of ["origin", "cookie", "authorization", "content-type"])
    assert.equal(request.headers.get(name), headers[name]);
  assert.equal(await request.text(), payload);
  assert.equal(pushes, 1);
  await assert.rejects(request.text());
});

test("retargeting keeps the same body stream and propagates supplied abort signal", async () => {
  const abort = new AbortController();
  const request = new Request("http://localhost:4542/api/draft/renew", {
    method: "POST",
    body: "unchanged body",
    signal: abort.signal,
  });
  const copy = copyRequestToUrl(
    request,
    new URL("https://frontend.example/api/draft/renew"),
  );
  assert.equal(copy.body, request.body, "No tee, clone or second body read");
  assert.equal(copy.signal.aborted, false);
  abort.abort();
  assert.equal(copy.signal.aborted, true);
  assert.equal(await copy.text(), "unchanged body");
  await assert.rejects(request.text());
});

test("canonical configuration fails closed on conflicts and invalid origin syntax", () => {
  for (const value of [
    "",
    "http://frontend.example",
    "https://frontend.example/path/..",
    "https://frontend.example?",
    "https://frontend.example#",
    "https://user@frontend.example",
    "https://@frontend.example",
    "https://*.example",
    " https://frontend.example",
    "https://front\tend.example",
  ]) {
    assert.throws(() => canonical(value));
  }
  for (const conflicting of [
    { CANVAS_PROXY_ORIGIN: "" },
    { CANVAS_TRUSTED_PROXY_IPS: "" },
    {
      CANVAS_PROXY_ORIGIN: "https://frontend.example",
      CANVAS_TRUSTED_PROXY_IPS: "::1",
    },
  ]) {
    assert.throws(
      () =>
        requestPolicy({
          CANVAS_CANONICAL_ORIGIN: "https://frontend.example",
          ...conflicting,
        }),
      /conflicts/,
    );
  }
});
