// Real HTTP requests to an isolated production build. Forwarded headers model
// an HTTPS-terminating proxy; this is not live Drupal or browser HTTPS proof.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { request as httpRequest } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

assert(
  process.env.TEST_SERVER_ENTRY,
  "Set TEST_SERVER_ENTRY to the owned production server bundle",
);
const owned = [];
async function port() {
  const s = createServer();
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  const p = s.address().port;
  await new Promise((r) => s.close(r));
  return p;
}
async function start(entry, env) {
  const child = spawn(process.execPath, [entry], {
    env: {
      ...process.env,
      CANVAS_ALLOWED_HOSTS: "",
      CANVAS_PROXY_ORIGIN: "",
      CANVAS_TRUSTED_PROXY_IPS: "",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  owned.push(child);
  let log = "";
  child.stdout.on("data", (c) => {
    log += c;
  });
  child.stderr.on("data", (c) => {
    log += c;
  });
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(log);
    if (log.includes("listening")) return { child, log: () => log };
    await delay(100);
  }
  throw new Error("Server did not start: " + log);
}
const evidence = [];
try {
  const mockPort = await port();
  await start(fileURLToPath(new URL("./mock-drupal.mjs", import.meta.url)), {
    MOCK_PORT: String(mockPort),
  });
  const mock = `http://127.0.0.1:${mockPort}`;
  async function scenario(
    name,
    config,
    test,
    entry = process.env.TEST_SERVER_ENTRY,
  ) {
    const listenPort = await port();
    const server = await start(entry, {
      PORT: String(listenPort),
      CANVAS_SITE_URL: mock,
      CANVAS_ALLOWED_HOSTS: "localhost,127.0.0.1",
      NG_TRUST_PROXY_HEADERS:
        "x-forwarded-host,x-forwarded-proto,x-forwarded-port",
      ...config,
    });
    // Use node:http: fetch may ignore a caller-supplied Host header.
    const request = (path, headers = {}, method = "GET") =>
      new Promise((resolve, reject) => {
        const req = httpRequest(
          `http://127.0.0.1:${listenPort}${path}`,
          { method, headers: { Connection: "close", ...headers } },
          (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
              const responseHeaders = new Headers();
              for (let i = 0; i < res.rawHeaders.length; i += 2)
                responseHeaders.append(
                  res.rawHeaders[i],
                  res.rawHeaders[i + 1],
                );
              resolve(
                new Response(Buffer.concat(chunks), {
                  status: res.statusCode,
                  headers: responseHeaders,
                }),
              );
            });
          },
        );
        req.on("error", reject);
        req.end();
      });
    try {
      await test(request);
      evidence.push({ name, passed: true, serverLog: server.log() });
      console.log(name);
    } finally {
      server.child.kill();
    }
  }
  const forwarded = {
    "x-forwarded-host": "frontend.example",
    "x-forwarded-proto": "https",
    "x-forwarded-port": "443",
    "x-forwarded-for": "203.0.113.9",
    "x-forwarded-prefix": "/untrusted-prefix",
    forwarded: "host=evil.example;proto=http",
  };
  const proxy = {
    CANVAS_PROXY_ORIGIN: "https://frontend.example",
    CANVAS_TRUSTED_PROXY_IPS: "127.0.0.1",
  };
  for (const invalid of [
    { CANVAS_ALLOWED_HOSTS: "*" },
    { CANVAS_ALLOWED_HOSTS: "*.example" },
    { CANVAS_PROXY_ORIGIN: "https://frontend.example" },
    { CANVAS_TRUSTED_PROXY_IPS: "127.0.0.1" },
    { ...proxy, CANVAS_PROXY_ORIGIN: "http://frontend.example" },
    { ...proxy, CANVAS_PROXY_ORIGIN: "https://frontend.example/path" },
    { ...proxy, CANVAS_PROXY_ORIGIN: "https://*.example" },
    { ...proxy, CANVAS_TRUSTED_PROXY_IPS: "127.0.0.0/8" },
  ])
    await assert.rejects(
      start(process.env.TEST_SERVER_ENTRY, {
        CANVAS_ALLOWED_HOSTS: "localhost,127.0.0.1",
        ...invalid,
      }),
      /CANVAS_|Set both/,
    );
  evidence.push({
    name: "Invalid/wildcard/incomplete proxy configuration fails closed",
    passed: true,
  });
  async function ssr(response) {
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /ng-server-context="ssr"/);
    assert.match(html, /Enter a heading/);
  }
  if (process.env.TEST_LEGACY_SERVER_ENTRY) {
    await scenario(
      "Legacy regression reproduced",
      {
        NG_ALLOWED_HOSTS: "frontend.example,localhost,127.0.0.1",
        NG_TRUST_PROXY_HEADERS: "",
      },
      async (req) => {
        if (process.env.TEST_ANGULAR_MAJOR === "21") {
          const response = await req("/components/heading/0", forwarded);
          assert.equal(response.status, 200);
          const html = await response.text();
          assert.match(html, /<app-root><\/app-root>/);
          assert(!html.includes('ng-server-context="ssr"'));
        } else {
          const response = await req(
            "/api/disable-draft",
            { ...forwarded, Origin: "https://frontend.example" },
            "POST",
          );
          assert.equal(response.status, 403);
          assert.equal(await response.text(), "Origin not allowed");
        }
      },
      process.env.TEST_LEGACY_SERVER_ENTRY,
    );
  }
  await scenario(
    "Direct deployment ignores all forwarding and still SSRs",
    {},
    async (req) => {
      await ssr(await req("/components/heading/0"));
      await ssr(await req("/components/heading/0", forwarded));
      assert.equal(
        (
          await req(
            "/api/disable-draft",
            { ...forwarded, Origin: "https://frontend.example" },
            "POST",
          )
        ).status,
        403,
      );
      assert.equal(
        (await req("/api/canvas/page?path=/", { Host: "evil.example" })).status,
        400,
      );
    },
  );
  await scenario(
    "Pinned HTTPS proxy: SSR, native exit and intact CSRF",
    proxy,
    async (req) => {
      await ssr(await req("/components/heading/0", forwarded));
      const assertion = (await (await fetch(mock + "/assertion")).json())
        .assertion;
      const draft = await req(
        "/api/draft?assertion=" + encodeURIComponent(assertion),
        forwarded,
      );
      assert.equal(draft.status, 307);
      const cookie = draft.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
      const exit = await req(
        "/api/disable-draft",
        { ...forwarded, Cookie: cookie, Origin: "https://frontend.example" },
        "POST",
      );
      assert.equal(exit.status, 303);
      assert.equal(exit.headers.get("location"), "/");
      assert(
        exit.headers.getSetCookie().some((c) => {
          const expiry = /Expires=([^;]+)/i.exec(c)?.[1];
          return (
            /Max-Age=0/i.test(c) || (expiry && Date.parse(expiry) <= Date.now())
          );
        }),
      );
      assert.equal(
        (
          await req(
            "/api/disable-draft",
            { ...forwarded, Cookie: cookie, Origin: "https://evil.example" },
            "POST",
          )
        ).status,
        403,
      );
      for (const spoof of [
        { Host: "evil.example" },
        { "x-forwarded-host": "evil.example" },
        { "x-forwarded-proto": "http" },
        { "x-forwarded-host": "frontend.example,evil.example" },
        { "x-forwarded-host": ["frontend.example", "frontend.example"] },
        { "x-forwarded-proto": "https,http" },
        { "x-forwarded-port": "444" },
        { "x-forwarded-port": "443,444" },
        { "x-forwarded-host": "frontend.example/path" },
        { "x-forwarded-host": "user@frontend.example" },
        {
          "x-forwarded-host": "frontend.example:443",
          "x-forwarded-port": "8443",
        },
      ])
        assert.equal(
          (await req("/api/canvas/page?path=/", { ...forwarded, ...spoof }))
            .status,
          400,
          JSON.stringify(spoof),
        );
      // With no X-Forwarded-Port, the HTTPS default still reconstructs correctly.
      const { ["x-forwarded-port"]: _port, ...withoutPort } = forwarded;
      await ssr(await req("/components/heading/0", withoutPort));
    },
  );
  await scenario(
    "Untrusted immediate peer cannot spoof proxy identity via XFF",
    { ...proxy, CANVAS_TRUSTED_PROXY_IPS: "127.0.0.2" },
    async (req) => {
      assert.equal(
        (
          await req("/api/canvas/page?path=/", {
            ...forwarded,
            "x-forwarded-for": "127.0.0.2",
          })
        ).status,
        400,
      );
      await ssr(await req("/components/heading/0"));
    },
  );
  await scenario(
    "Exact direct host deployment",
    { CANVAS_ALLOWED_HOSTS: "direct.example" },
    async (req) => {
      await ssr(await req("/components/heading/0", { Host: "direct.example" }));
      assert.equal((await req("/components/heading/0")).status, 400);
    },
  );
  await scenario(
    "Pinned non-default HTTPS port",
    { ...proxy, CANVAS_PROXY_ORIGIN: "https://frontend.example:8443" },
    async (req) => {
      const headers = { ...forwarded, "x-forwarded-port": "8443" };
      await ssr(await req("/components/heading/0", headers));
      assert.equal(
        (
          await req(
            "/api/disable-draft",
            { ...headers, Origin: "https://frontend.example:8443" },
            "POST",
          )
        ).status,
        303,
      );
      assert.equal(
        (
          await req(
            "/api/disable-draft",
            { ...headers, Origin: "https://frontend.example" },
            "POST",
          )
        ).status,
        403,
      );
    },
  );
  if (process.env.TEST_EVIDENCE_FILE)
    await writeFile(
      process.env.TEST_EVIDENCE_FILE,
      JSON.stringify(evidence, null, 2),
    );
} finally {
  for (const child of owned) if (child.exitCode === null) child.kill();
}
