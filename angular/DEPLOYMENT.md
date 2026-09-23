# Angular deployment

Build with `npm run build`, then run `npm run preview`. The Node server listens on port 4200, or the port set by `PORT`.

Set `CANVAS_SITE_URL` to the Drupal site URL. The server loads `.env` automatically; existing process environment variables take precedence. Keep these values server-side.

Local development uses `localhost` and `127.0.0.1` by default. For deployment, choose one of the configurations below. Cross-site editor previews require HTTPS.

## Direct deployment

Set the hostname that receives requests:

```dotenv
CANVAS_ALLOWED_HOSTS=frontend.example
```

Use comma-separated exact hostnames without ports, schemes, or paths. Bracket IPv6 addresses. Wildcards are not supported. Forwarding headers are ignored.

## Single HTTPS origin

Use this configuration when a proxy serves the application at one fixed HTTPS address:

```dotenv
CANVAS_CANONICAL_ORIGIN=https://frontend.example
CANVAS_ALLOWED_HOSTS=localhost
```

Set `CANVAS_ALLOWED_HOSTS` to the actual upstream Host hostname sent to Node. The public hostname is not automatically allowed as an upstream Host.

The server uses the configured public origin and ignores forwarding headers. The proxy must provide HTTPS; this setting does not enable TLS or authenticate the proxy. Requests must use origin-form paths, not absolute URLs.

Remove `CANVAS_PROXY_ORIGIN` and `CANVAS_TRUSTED_PROXY_IPS` from both `.env` and the process environment when using this mode. The two proxy modes are mutually exclusive, even if a conflicting variable is empty.

## Trusted HTTPS proxy

Use this alternative only when you control the final proxy and can restrict access to the Node listener:

```dotenv
CANVAS_PROXY_ORIGIN=https://frontend.example
CANVAS_TRUSTED_PROXY_IPS=127.0.0.1
CANVAS_ALLOWED_HOSTS=localhost,127.0.0.1,frontend-internal.example
```

Remove `CANVAS_CANONICAL_ORIGIN` when using this mode. Both proxy variables are required. The public origin must be HTTPS with no path, credentials, query, or fragment. Its hostname is also allowed as an upstream Host.

Trusted peer values must be exact socket IP addresses, not CIDRs or `X-Forwarded-For` values. IPv4-mapped IPv6 addresses are normalized. Only trust loopback or shared NAT addresses if untrusted workloads cannot connect through them.

Configure the proxy to:

1. Validate the public hostname and terminate TLS.
2. Overwrite client-supplied forwarding headers rather than append to them.
3. Send one `X-Forwarded-Host` and `X-Forwarded-Proto: https`, with an optional `X-Forwarded-Port` matching the public origin.
4. Send an allowed upstream Host and preserve the browser's `Origin` header.

The resulting origin must match `CANVAS_PROXY_ORIGIN`. Untrusted peers claiming forwarding, duplicate or chained headers, and conflicting ports are rejected. Other forwarding headers are discarded; path-prefix routing is unsupported. Requests without forwarding use their direct socket scheme and Host.

## Verification

The server validates request authority before serving static files or Canvas routes. Express `trust proxy`, `NG_ALLOWED_HOSTS`, and `NG_TRUST_PROXY_HEADERS` do not replace this configuration.

Verify page rendering and draft exit through the public URL. A legitimate same-origin draft-exit POST returns 303; a foreign `Origin` returns 403. Aliases and different ports are different origins.

Do not disable TLS verification, weaken cookie or origin checks, or allow wildcard hosts to make deployment work. These settings configure request URLs; they do not grant Canvas authentication or draft sessions.
