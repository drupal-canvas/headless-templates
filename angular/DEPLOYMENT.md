# Request authority and deployment

The Node server validates authority **before static assets and Canvas routes**,
then passes the same Request to Canvas and Angular SSR. It explicitly configures
both Angular request conversion and the SSR engine; Express `trust proxy`,
`NG_ALLOWED_HOSTS` and `NG_TRUST_PROXY_HEADERS` are not substitutes.

## Direct deployment (default)

```sh
export CANVAS_ALLOWED_HOSTS=frontend.example
```

The default hosts are `localhost,127.0.0.1`. Use comma-separated exact hostnames,
without ports, schemes or paths; bracket IPv6 hosts. Wildcards are rejected.
All `Forwarded` and `X-Forwarded-*` headers are stripped. This also prevents
Angular 21 from falling back to client rendering because untrusted forwarding
headers reached its SSR engine.

## Single canonical HTTPS origin

Use this mode when the application has one fixed public address, independently
of forwarded headers or proxy peer identity:

```sh
unset CANVAS_PROXY_ORIGIN CANVAS_TRUSTED_PROXY_IPS
export CANVAS_CANONICAL_ORIGIN=https://frontend.example
export CANVAS_ALLOWED_HOSTS=localhost
```

Set the actual public HTTPS origin and expected **upstream** Host hostname(s).
Canonical and strict-proxy settings are mutually exclusive, even when a
conflicting variable is present but empty. Invalid configuration fails startup.

- Raw Host must be singular, valid and allowed. The canonical hostname is also
  allowed by Angular's URL validator, but is not automatically a permitted raw
  upstream Host.
- All forwarding headers are removed before conversion. Spoofed values, chains
  and duplicates cannot change the effective origin.
- The original request target (`originalUrl ?? url`) must be origin-form.
  Absolute URLs, `//`, backslashes, fragments, control characters and targets
  that URL parsing would normalize are rejected. Ordinary percent encoding,
  plus signs and query delimiters are preserved.
- The configured origin, including any non-default HTTPS port, determines the
  effective URL. Method, body stream, abort signal, cookies, Authorization and
  **browser Origin** are preserved.

This configures an application address, **not proxy authentication or isolation
from other local workloads**. The operator must provide actual HTTPS delivery.
Aliases, localhost browser origins and different public ports intentionally fail
the draft-exit same-origin check. Change configuration if the public address
changes; never infer it from a request.

## Strict trusted-proxy mode

Use this alternative only when the final proxy peer and its header handling are
under your control:

```sh
export CANVAS_PROXY_ORIGIN=https://frontend.example
export CANVAS_TRUSTED_PROXY_IPS=127.0.0.1
export CANVAS_ALLOWED_HOSTS=localhost,127.0.0.1,frontend-internal.example
```

The public hostname is added to the allowed hosts. Both proxy variables are
required. The origin must be HTTPS, mounted at `/`, without credentials or query
parameters. Peer values must be exact socket IP addresses, not CIDRs or
`X-Forwarded-For` values; IPv4-mapped IPv6 addresses are normalized.

Before enabling this mode:

1. Restrict the Node listener so only the audited proxy connects as a configured
   peer. Shared NAT or loopback used by untrusted workloads is not trusted identity.
2. Have the proxy validate the public hostname and terminate TLS. It must
   **overwrite**, not append to, client-provided forwarding headers.
3. Send one `X-Forwarded-Host` and `X-Forwarded-Proto: https`, plus an optional
   numeric `X-Forwarded-Port` matching the configured origin (443 by default).
4. Send an allowed raw upstream Host. Do not derive configuration from requests.

Only those three origin headers from a trusted peer reach Angular. The resulting
origin must exactly match configuration. Duplicate/chained headers, malformed
hosts, conflicting ports and untrusted peers claiming forwarding are rejected.
Other forwarding headers are discarded; prefix routing is unsupported. Without
forwarding, the request uses its direct socket scheme and validated Host.

## Security boundaries

`CANVAS_SITE_URL` is the Drupal URL, not the frontend origin. Neither deployment
mode grants an assertion, token or session. Metadata authorization, signed editor
origins, PKCE renewal, cookie attributes and private/no-store policies remain
adapter-owned. Origin is a browser-CSRF defense, not non-browser authentication.

Do not rewrite browser Origin, weaken cookie/CSRF checks, disable TLS validation
or allow wildcard hosts to make deployment work. Verify actual SSR and native
POST draft exit through your ingress: legitimate same-origin exit returns 303;
foreign Origin must still return 403. If strict-proxy prerequisites cannot be
met, a single-origin application can use canonical mode without claiming proxy
identity.
