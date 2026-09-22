# Request authority and trusted proxies

The Node starter explicitly configures **both** `createWebRequestFromNodeRequest`
and `AngularNodeAppEngine`. It does not use Express `trust proxy`, Angular's
version-dependent omitted options, or the `NG_TRUST_PROXY_HEADERS` environment
variable to establish trust.

## Direct deployment (default)

With no proxy or canonical-origin variables set, no forwarding headers are trusted. RFC `Forwarded`
and all `X-Forwarded-*` headers are removed before conversion **and before SSR**.
This matters on Angular 21: leaving untrusted forwarding headers on the Request
causes a deliberate CSR fallback, even with the correct allowed host configured.
Angular 22's omitted request-conversion policy instead ignores HTTPS forwarding,
which previously caused the unchanged Canvas Origin check to reject draft exit.

The default exact hostnames are `localhost,127.0.0.1`. Set the actual direct
hostname(s) explicitly when deploying:

```sh
export CANVAS_ALLOWED_HOSTS=frontend.example
```

Use comma-separated exact lowercase hostnames, without schemes, paths or ports;
bracket IPv6 hostnames. No wildcards. The boundary checks raw Host and the final
request URL **before static files and Canvas API routes**, not only when Angular
renders. These hosts are also passed to Angular's own validator. `NG_ALLOWED_HOSTS`
or changing `angular.json` alone is not a substitute for this server boundary.

## Single canonical public origin (no header-based proxy trust)

For a deployment with **one fixed public application address**, an alternative
mode defines that address independently of ingress identity:

```sh
unset CANVAS_PROXY_ORIGIN CANVAS_TRUSTED_PROXY_IPS
export CANVAS_CANONICAL_ORIGIN=https://frontend.example
export CANVAS_ALLOWED_HOSTS=localhost
```

Use the actual externally configured HTTPS frontend origin and the exact expected
**upstream** Host hostname(s). The example `localhost` is not a claim that loopback
is exclusive or authenticated. Do not include signed preview query parameters or
credentials in this setting. Canonical and strict proxy settings are mutually
exclusive, including empty-but-present proxy settings; invalid/conflicting
configuration fails startup.

This mode:

- Validates the original raw Host, including duplicates and malformed values,
  before any handler. Its allowlist is separate from the canonical hostname added
  to Angular's URL validator. Raw Host can admit/reject a request but cannot choose
  its effective origin.
- Removes **all** RFC Forwarded and X-Forwarded-* headers before forwarded-header
  validation or conversion. Spoofed values, chains and duplicate forwarding
  headers have no effect. Converter and engine both use `trustProxyHeaders: false`.
- Validates exactly the converter's target (`originalUrl ?? url`) as origin-form.
  Absolute/authority-form targets, `//`, raw backslashes, fragments and control
  characters are rejected. Encoded path/query bytes are not decoded or resolved
  against a base. Inputs WHATWG URL would normalize (such as dot segments) are
  rejected rather than silently reinterpreted; ordinary percent encoding, plus
  signs, and an empty query delimiter are retained.
- Constructs the effective URL from the configured origin and validated target,
  asserting the resulting origin equals configuration, including a non-default
  HTTPS port. It preserves the method, body stream (without reading or teeing),
  abort signal and headers. **Browser Origin, cookies and Authorization are never
  rewritten.** The same canonical Request goes to Canvas and Angular.

This is an **application-address configuration**, not proxy authentication, TLS
verification, or shared-local-workload isolation. No exclusive socket peer or
forwarded-header overwrite guarantee is claimed or required by this mode. The
operator still supplies the correct public URL and actual HTTPS delivery. Every
accepted connection addresses that one application; this is not a multi-tenant
or request-selected-origin mode.

Alternate browser origins (including localhost, aliases and a different public
port) intentionally fail draft-exit Origin checks. A non-browser client can forge
Origin, as it could before; Origin is a browser-CSRF defense, not authorization.
Canonical addressing grants no assertion, access token, cookie or PKCE verifier.
Drupal authentication, metadata authorization, signed editor-origin policy,
cookie scope/attributes, renewal identity checks and cache policy remain unchanged.
Update configuration explicitly if the public address changes; never infer it
from a request. Actual browser SSR/exit still requires live-owner verification.

## HTTPS-terminating reverse proxy: explicit opt-in

This starter supports one public HTTPS origin, mounted at `/`. Configure both:

```sh
export CANVAS_PROXY_ORIGIN=https://frontend.example
export CANVAS_TRUSTED_PROXY_IPS=127.0.0.1
# Optional: if the proxy sends an internal Host other than localhost/127.0.0.1,
# list that exact hostname too. The pinned public hostname is added automatically.
export CANVAS_ALLOWED_HOSTS=localhost,127.0.0.1,frontend-internal.example
```

**Do not copy the example peer address without verifying your deployment.** The
IP list must match `req.socket.remoteAddress` of the final proxy connecting to
Node, never the browser address or an `X-Forwarded-For` value. IPv4-mapped IPv6
socket addresses are normalized; only exact IPs are accepted, not CIDRs. Missing
companion variables, non-HTTPS origins, origin paths/credentials and wildcard
hosts fail startup rather than falling back to broad trust.

The deployment owner must establish these prerequisites:

1. Only the audited proxy can connect as a configured peer. Restrict the Node
   listener with private networking/firewall/container policy. A shared NAT or
   loopback address also used by untrusted workloads is **not** a trusted identity.
   IP checks are not cryptographic proxy authentication.
2. The proxy validates the incoming public authority against this deployment's
   exact hostname and terminates TLS for it. It **overwrites**, rather than
   appends/preserves, client-provided `X-Forwarded-Host`, `X-Forwarded-Proto` and
   `X-Forwarded-Port` with its own validated values. Strip incoming duplicates.
3. Send a single `X-Forwarded-Host` and `X-Forwarded-Proto: https`. A single numeric
   `X-Forwarded-Port` is optional (443 by default). Non-default public ports belong
   in `CANVAS_PROXY_ORIGIN`; a conflicting host-port/forwarded-port is rejected.
4. Send a raw upstream Host from `CANVAS_ALLOWED_HOSTS` or the pinned public
   hostname. Do not derive any of these settings from a request or its Origin.

Only those three origin headers may reach Angular, and only after peer and value
validation. Their reconstructed origin must equal `CANVAS_PROXY_ORIGIN` exactly,
including the effective port. Comma chains, duplicate origin headers, invalid
hosts/schemes/ports and untrusted peers claiming forwarding are rejected with
400. Other forwarding headers—including `Forwarded`, `X-Forwarded-For` and
`X-Forwarded-Prefix`—are discarded, not trusted. Prefix routing is not supported.
A request without forwarding still uses the direct socket scheme and validated
Host; it cannot opt itself into the public HTTPS origin.

`CANVAS_SITE_URL` remains the **Drupal** server URL, not the public frontend origin.
Do not rewrite the browser's Origin header, alter cookies, disable TLS validation,
remove Canvas's same-origin checks, or set wildcard allowed hosts to make a proxy
work. A legitimate proxied same-origin exit should return 303; a foreign Origin
must still return 403. Metadata CORS and signed preview/session protocols remain
adapter-owned and unchanged.

## Owner handoff and evidence boundary

Apply a candidate only in an owner-controlled disposable deployment after its
mode-specific assumptions are confirmed. Strict proxy mode requires audited peer
identity and proxy overwrite/validation guarantees; canonical mode instead
requires an explicitly configured single public application origin and expected
raw upstream Host allowlist. Do not relax strict mode when its assumptions fail.
The template tests model the HTTP upstream of an HTTPS-terminating proxy; they
verify both majors' real SSR output, native POST exit/cookie deletion, exact host
validation, strict-mode spoof rejection and canonical-mode forwarding invariance. They do **not** establish those guarantees for a
particular cloud proxy. If the platform cannot satisfy strict proxy mode, do not
enable or weaken that mode. A single-origin application can instead use canonical
mode without claiming proxy identity; otherwise coordinate ingress requirements
with the deployment owner rather than broadening trust.

The read-only live checkpoint showed Angular 22 published SSR working but proxy
exit returning `Origin not allowed`, and Angular 21 emitting an empty app-root
while the anonymous page API correctly retained published content. The latter was
CSR fallback, not evidence of draft leakage. Corrected live SSR/exit must still be
verified by the live-service owner before any video describes this fix as a live
success. No live service, temporary Canvas patch, recording or raw evidence is
modified by this candidate.
