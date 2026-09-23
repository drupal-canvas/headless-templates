// Node server only. Never import this module into the browser application.
import { isIP } from "node:net";
import type { IncomingMessage } from "node:http";
import { createWebRequestFromNodeRequest } from "@angular/ssr/node";

const FORWARDED_ORIGIN_HEADERS = [
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
] as const;
const proxyHeader = (name: string) =>
  name === "forwarded" || name.startsWith("x-forwarded-");
const normalizeIP = (ip: string) =>
  ip.startsWith("::ffff:") && isIP(ip.slice(7)) === 4 ? ip.slice(7) : ip;

function authority(value: string): URL {
  if (!value || value !== value.trim() || /[,\\\s/?#@]/.test(value))
    throw new Error("Invalid host");
  const url = new URL(`http://${value}`);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid host");
  return url;
}

function canonicalOrigin(value: string): URL {
  if (
    !/^https:\/\/[^\s/?#\\@]+\/?$/.test(value) ||
    /[\u0000-\u0020\u007f-\u009f]/.test(value)
  )
    throw new Error("CANVAS_CANONICAL_ORIGIN must be one HTTPS origin");
  const url = new URL(value);
  if (url.hostname.includes("*") || url.username || url.password)
    throw new Error(
      "CANVAS_CANONICAL_ORIGIN cannot contain credentials or wildcards",
    );
  return url;
}

function canonicalUrl(origin: string, target: string): URL {
  if (
    typeof target !== "string" ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    /[\\#\u0000-\u0020\u007f-\u009f]/.test(target)
  )
    throw new Error("Expected an origin-form request target");
  // Concatenation only after origin-form validation, never relative URL
  // resolution. Reject inputs WHATWG URL would normalize instead of silently
  // reinterpreting dot segments, raw Unicode, or other path/query bytes.
  const url = new URL(origin + target);
  if (url.origin !== origin || url.href !== origin + target)
    throw new Error("Request target would change during URL normalization");
  return url;
}

/** Retarget without reading/teeing the body. Node requires duplex for streams. */
export function copyRequestToUrl(request: Request, url: URL): Request {
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: request.headers,
    signal: request.signal,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    body: request.body,
    ...(request.body ? { duplex: "half" as const } : {}),
  };
  return new Request(url, init);
}

export function requestPolicy(env: NodeJS.ProcessEnv = process.env) {
  const allowedHosts = (env["CANVAS_ALLOWED_HOSTS"] ?? "localhost,127.0.0.1")
    .split(",")
    .map((host) => {
      const value = host.trim().toLowerCase();
      if (value.includes("*") || authority(value).hostname !== value)
        throw new Error(
          "CANVAS_ALLOWED_HOSTS must contain exact hostnames without ports",
        );
      return value;
    });
  const origin = env["CANVAS_PROXY_ORIGIN"];
  const peers = env["CANVAS_TRUSTED_PROXY_IPS"];
  const canonical = env["CANVAS_CANONICAL_ORIGIN"];
  // Presence counts: even an empty configured value must not silently select
  // another mode or disable a conflicting security setting.
  if (canonical !== undefined && (origin !== undefined || peers !== undefined))
    throw new Error(
      "CANVAS_CANONICAL_ORIGIN conflicts with proxy-origin/peer settings",
    );
  const applicationOrigin =
    canonical === undefined ? undefined : canonicalOrigin(canonical);
  if (!!origin !== !!peers)
    throw new Error(
      "Set both CANVAS_PROXY_ORIGIN and CANVAS_TRUSTED_PROXY_IPS, or neither",
    );
  let publicOrigin: string | undefined;
  const trustedPeers = new Set<string>();
  if (origin && peers) {
    const url = new URL(origin);
    if (
      url.hostname.includes("*") ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error(
        "CANVAS_PROXY_ORIGIN must be one HTTPS origin without a path or credentials",
      );
    publicOrigin = url.origin;
    allowedHosts.push(url.hostname);
    for (const peer of peers.split(",")) {
      const ip = peer.trim();
      if (!isIP(ip))
        throw new Error(
          "CANVAS_TRUSTED_PROXY_IPS must contain exact socket peer IPs, not ranges or forwarded client addresses",
        );
      trustedPeers.add(normalizeIP(ip));
    }
  }
  // Explicit even in direct mode: Angular 21 and 22 have different defaults.
  const trustProxyHeaders: false | readonly string[] = publicOrigin
    ? FORWARDED_ORIGIN_HEADERS
    : false;
  return {
    allowedHosts: [...new Set(allowedHosts)],
    publicOrigin,
    canonicalOrigin: applicationOrigin?.origin,
    // Canonical hostname is permitted for Angular's URL check, but does not
    // broaden the separate raw upstream Host allowlist.
    engineAllowedHosts: [
      ...new Set([
        ...allowedHosts,
        ...(applicationOrigin ? [applicationOrigin.hostname] : []),
      ]),
    ],
    trustedPeers,
    trustProxyHeaders,
  };
}

export function prepareRequest(
  req: IncomingMessage,
  policy: ReturnType<typeof requestPolicy>,
): Request {
  // Canonical mode never interprets forwarded values, including duplicates.
  // Remove them before any forwarded-header validation or Angular conversion.
  if (policy.canonicalOrigin) {
    for (const name of Object.keys(req.headers))
      if (proxyHeader(name)) delete req.headers[name];
  }
  // Raw Host validation is mandatory in every mode, before all handlers.
  for (const name of policy.canonicalOrigin
    ? ["host"]
    : ["host", ...FORWARDED_ORIGIN_HEADERS]) {
    const count = req.rawHeaders
      .filter((_, index) => index % 2 === 0)
      .filter((header) => header.toLowerCase() === name).length;
    if (count > 1) throw new Error("Repeated authority header");
  }
  const host = req.headers.host;
  if (!host || !policy.allowedHosts.includes(authority(host).hostname))
    throw new Error("Host not allowed");
  if (policy.canonicalOrigin) {
    // Match the public converter's exact target selection, including Express's
    // originalUrl, rather than validating a different req.url after routing.
    const target =
      (req as IncomingMessage & { originalUrl?: string }).originalUrl ??
      req.url ??
      "";
    const url = canonicalUrl(policy.canonicalOrigin, target);
    const converted = createWebRequestFromNodeRequest(req, false);
    const canonical = copyRequestToUrl(converted, url);
    if (new URL(canonical.url).origin !== policy.canonicalOrigin)
      throw new Error("Canonical request origin changed");
    return canonical;
  }
  const forwarded = Object.keys(req.headers).some(proxyHeader);
  const trusted =
    policy.publicOrigin &&
    policy.trustedPeers.has(normalizeIP(req.socket.remoteAddress ?? ""));
  if (policy.publicOrigin && forwarded && !trusted)
    throw new Error("Proxy peer not allowed");
  const useProxy = !!(trusted && forwarded);
  if (useProxy) {
    const hostname = req.headers["x-forwarded-host"];
    const protocol = req.headers["x-forwarded-proto"];
    const port = req.headers["x-forwarded-port"];
    if (typeof hostname !== "string" || protocol !== "https")
      throw new Error("Expected a single forwarded HTTPS host/proto");
    authority(hostname);
    if (
      port !== undefined &&
      (typeof port !== "string" ||
        !/^\d+$/.test(port) ||
        Number(port) < 1 ||
        Number(port) > 65535)
    )
      throw new Error("Invalid forwarded port");
  }
  // Strip unsupported/untrusted headers, including RFC Forwarded and prefix.
  // Merely passing [] to Angular 21 would otherwise deopt these requests to CSR.
  for (const name of Object.keys(req.headers)) {
    if (
      proxyHeader(name) &&
      (!useProxy ||
        !policy.trustProxyHeaders ||
        !policy.trustProxyHeaders.includes(name))
    )
      delete req.headers[name];
  }
  const request = createWebRequestFromNodeRequest(
    req,
    policy.trustProxyHeaders,
  );
  const url = new URL(request.url);
  if (!policy.allowedHosts.includes(url.hostname))
    throw new Error("Host not allowed");
  if (useProxy) {
    if (url.origin !== policy.publicOrigin)
      throw new Error("Forwarded origin not allowed");
    // If host already contains a port, Angular ignores X-Forwarded-Port. Reject
    // a conflicting port anyway, rather than accepting ambiguous proxy input.
    const port = req.headers["x-forwarded-port"];
    if (port !== undefined && Number(port) !== Number(url.port || 443))
      throw new Error("Conflicting forwarded port");
  }
  return request;
}
