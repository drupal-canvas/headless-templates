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
  if (!value || value !== value.trim() || /[,\\\s]/.test(value))
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
  const trustProxyHeaders: readonly string[] = publicOrigin
    ? FORWARDED_ORIGIN_HEADERS
    : [];
  return {
    allowedHosts: [...new Set(allowedHosts)],
    publicOrigin,
    trustedPeers,
    trustProxyHeaders,
  };
}

export function prepareRequest(
  req: IncomingMessage,
  policy: ReturnType<typeof requestPolicy>,
): Request {
  // Reject ambiguous authority/origin inputs instead of Angular's first-value
  // selection. X-Forwarded-For is never used to decide whether a peer is trusted.
  for (const name of ["host", ...FORWARDED_ORIGIN_HEADERS]) {
    const count = req.rawHeaders
      .filter((_, index) => index % 2 === 0)
      .filter((header) => header.toLowerCase() === name).length;
    if (count > 1) throw new Error("Repeated authority header");
  }
  const host = req.headers.host;
  if (!host || !policy.allowedHosts.includes(authority(host).hostname))
    throw new Error("Host not allowed");
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
      (!useProxy || !policy.trustProxyHeaders.includes(name))
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
