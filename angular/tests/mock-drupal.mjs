// Loopback-only test transport. This is NOT Drupal JWT/permission validation,
// and is never imported by the application or its production server.
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const componentRoot = fileURLToPath(
  new URL("../src/components/", import.meta.url),
);
export const cases = [];
for (const name of (await readdir(componentRoot)).sort()) {
  const { mocks } = JSON.parse(
    await readFile(resolve(componentRoot, name, "mocks.json"), "utf8").catch(
      (error) => {
        if (error.code !== "ENOENT") throw error;
        return JSON.stringify({
          mocks: [{ name: "Default", props: { text: "© Canvas" } }],
        });
      },
    ),
  );
  for (const [index, mock] of mocks.entries())
    cases.push({ name, index, mock });
}
// Exercise the default divider variant, not present in the shared mocks.
cases.push({
  name: "accordion",
  index: 2,
  mock: {
    ...cases.find((c) => c.name === "accordion").mock,
    props: { variant: "default", borderColor: "primary_300" },
  },
});

export function fixtureTree(name, index = 0, origin = "http://127.0.0.1:4520") {
  const entry = cases.find((c) => c.name === name && c.index === index);
  if (!entry) return null;
  const { mock } = entry;
  const node = (type, data, id) => {
    const props = structuredClone(data.props ?? {});
    // Deterministic local media avoids external requests/flaky screenshots.
    for (const key of ["image", "backgroundImage"]) {
      if (props[key]?.src)
        props[key].src =
          `${origin}/image.svg?w=${props[key].width ?? 800}&h=${props[key].height ?? 600}`;
    }
    if (props.video?.src) props.video.src = `${origin}/video.mp4`;
    return {
      element: `js-${type}`,
      props: { ...props, canvasUuid: id },
      slots: Object.fromEntries(
        Object.entries(data.slots ?? {}).map(([slot, ids]) => [
          slot,
          ids.map((child) => {
            const element = mock.elements[child];
            return node(element.type, element, `${id}-${child}`);
          }),
        ]),
      ),
    };
  };
  return node(name, mock, `${name}-${index}`);
}

export function startMockDrupal(port = 4520) {
  const origin = `http://127.0.0.1:${port}`;
  let exchanges = 0;
  const requests = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, origin);
    const json = (data, status = 200) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(data));
    };
    if (url.pathname === "/cases")
      return json(
        cases.map(({ name, index, mock }) => ({
          name,
          index,
          label: mock.name,
        })),
      );
    if (url.pathname === "/stats") return json({ exchanges, requests });
    if (url.pathname === "/assertion") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      const editorOrigin = url.searchParams.get("editorOrigin") ?? origin;
      if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(editorOrigin))
        return json(
          { message: "Only loopback fixture editors are allowed" },
          400,
        );
      const claims = {
        sub: "42",
        path: url.searchParams.get("path") ?? "/components/accordion/0",
        resourceVersion: "rel:working-copy",
        renewUrl: editorOrigin + "/renew",
        ttl: Number(url.searchParams.get("ttl") ?? 900),
      };
      return json({
        assertion: `e30.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.fixture`,
      });
    }
    if (url.pathname === "/oauth/token" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const assertion = new URLSearchParams(body).get("assertion");
      const claims = JSON.parse(
        Buffer.from(assertion.split(".")[1], "base64url").toString(),
      );
      exchanges++;
      return json({
        access_token: `fixture-private-token-${exchanges}`,
        token_type: "Bearer",
        expires_in: claims.ttl ?? 900,
      });
    }
    if (url.pathname === "/image.svg") {
      res.writeHead(200, {
        "Content-Type": "image/svg+xml",
        "Access-Control-Allow-Origin": "*",
      });
      return res.end(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${Number(url.searchParams.get("w"))}" height="${Number(url.searchParams.get("h"))}"><rect width="100%" height="100%" fill="#cbd5e1"/><path d="M0 0L800 600M800 0L0 600" stroke="#94a3b8" stroke-width="4"/></svg>`,
      );
    }
    if (url.pathname === "/video.mp4" && process.env["TEST_VIDEO_FILE"]) {
      res.writeHead(200, {
        "Content-Type": "video/mp4",
        "Access-Control-Allow-Origin": "*",
      });
      return res.end(await readFile(process.env["TEST_VIDEO_FILE"]));
    }
    if (url.pathname === "/canvas/content-api/entity")
      return json({
        managedByCanvas: true,
        content: fixtureTree("card", 0, origin),
        entity: {
          entityType: "node",
          bundle: "article",
          id: url.searchParams.get("id"),
          uuid: "fixture-entity",
          langcode: "en",
        },
      });
    if (url.pathname === "/canvas/content-api") {
      const uri = url.searchParams.get("requestUri") ?? "/";
      requests.push({ uri, authenticated: !!req.headers.authorization });
      if (uri === "/redirect")
        return json({
          redirect: {
            url: "/components/heading/0",
            statusCode: 301,
            external: false,
          },
        });
      const parts = new URL(uri, origin).pathname.split("/");
      let content =
        uri === "/"
          ? fixtureTree("hero", 0, origin)
          : fixtureTree(parts[2], Number(parts[3] ?? 0), origin);
      if (uri === "/gallery")
        content = {
          element: "div",
          slots: {
            default: [...new Set(cases.map((c) => c.name))].flatMap((name) => [
              `<h1 data-case="${name}">${name}</h1>`,
              fixtureTree(name, 0, origin),
            ]),
          },
        };
      if (url.searchParams.has("componentId"))
        content = fixtureTree(
          url.searchParams.get("componentId").replace(/^js[.-]/, ""),
          0,
          origin,
        );
      if (!content) return json({ message: "Not found" }, 404);
      return json({
        content,
        head: {
          title: `Fixture ${uri}`,
          meta: [{ name: "description", content: `Description ${uri}` }],
          link: [{ rel: "canonical", href: origin + uri }],
          script: [
            {
              type: "application/ld+json",
              textContent: { "@type": "Article", name: uri },
            },
          ],
        },
        route: {
          name: "entity.node.canonical",
          requestUri: uri,
          managedByCanvas: true,
          params: { node: "42" },
          entity: {
            entityType: "node",
            bundle: "article",
            id: "42",
            uuid: "fixture-entity",
            langcode: "en",
          },
        },
      });
    }
    return json({ message: "Not found" }, 404);
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(`Mock Drupal listening on ${origin}`),
  );
  return server;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  startMockDrupal(Number(process.env["MOCK_PORT"] ?? 4520));
