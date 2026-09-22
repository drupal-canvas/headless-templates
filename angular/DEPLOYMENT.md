# Request authority and trusted proxies

The Node starter explicitly configures **both** `createWebRequestFromNodeRequest`
and `AngularNodeAppEngine`. It does not use Express `trust proxy`, Angular's
version-dependent omitted options, or the `NG_TRUST_PROXY_HEADERS` environment
variable to establish trust.

## Direct deployment (default)

With no proxy variables set, no forwarding headers are trusted. RFC `Forwarded`
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

Apply the candidate only in an owner-controlled disposable deployment after the
actual peer identity and proxy overwrite/validation guarantees are confirmed.
The template tests model the HTTP upstream of an HTTPS-terminating proxy; they
verify both majors' real SSR output, native POST exit/cookie deletion, exact host
validation and spoof rejection. They do **not** establish those guarantees for a
particular cloud proxy. If the platform cannot guarantee them, do not enable this
mode: coordinate a controlled ingress/authenticated proxy with the deployment
owner rather than broadening the allowlist.

The read-only live checkpoint showed Angular 22 published SSR working but proxy
exit returning `Origin not allowed`, and Angular 21 emitting an empty app-root
while the anonymous page API correctly retained published content. The latter was
CSR fallback, not evidence of draft leakage. Corrected live SSR/exit must still be
verified by the live-service owner before any video describes this fix as a live
success. No live service, temporary Canvas patch, recording or raw evidence is
modified by this candidate.
