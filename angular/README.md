# Canvas headless template: Angular

Standalone Angular 22 frontend for Drupal Canvas with request-time SSR,
Tailwind CSS and the same 18 components as the other templates. Angular 21 is
also supported. No Workbench or cross-template imports.

## Release status

The adapter is not yet published. CI publishes `@drupal-canvas/headless-angular`
`0.0.0` after the initial merge, matching this template's exact dependency pin.
The subsequent version merge request releases `0.1.0`. Public installation and
a registry-resolved template lockfile await the initial release; do not commit
local tarball dependencies or publish manually.

## Setup (after the adapter release)

Run from this directory:

```sh
nvm use
npm install
cp .env.example .env
# Set CANVAS_SITE_URL in .env to your Drupal site URL.
npm run dev
```

The dev server listens on <http://localhost:4200>. Enable Canvas Headless on
Drupal and configure the frontend URL there. `CANVAS_SITE_URL` is server-only.
The server automatically loads `.env`; existing process environment variables
take precedence. Cross-site editor previews require HTTPS.

Node must satisfy `^22.22.3 || ^24.15.0 || >=26.0.0`; `.nvmrc` pins 24.21.0.

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm start` | Generate/watch Canvas sources and start Angular CLI |
| `npm run check` | Run strict Angular template and TypeScript checks |
| `npm run build` | Build browser and request-time Node SSR bundles |
| `npm run preview` | Run production SSR (port 4200, or `PORT`) |
| `npm run canvas -- validate` | Validate local components without remote sync |

## Angular 21

Use the same adapter package with these dependency versions. Update both
`dependencies` and `devDependencies` before running `npm install`:

| Packages | Angular 22 default | Angular 21 |
| --- | --- | --- |
| `@angular/common`, `compiler`, `core`, `platform-browser`, `platform-server`, `router`, `compiler-cli` | 22.1.7 | 21.2.23 |
| `@angular/build`, `cli`, `ssr` | 22.1.8 | 21.2.24 |
| `typescript` | 6.0.2 | 5.9.3 |

Keep the starter's Node requirement, then run check, build and Canvas validation.
The adapter is partially compiled with Angular 21 for both consumers.

## Project structure

- `src/components/*`: standalone components with ordinary inputs and default
  exports. YAML machine names and mocks match the other templates.
- `src/styles.css`: Tailwind theme, Canvas preview CSS and host-aware accordion
  selectors.
- `src/routes.ts`, `src/page.ts`: catch-all resolver, not-found UI and draft banners.
- `src/main.ts`, `src/main.server.ts`: hydration, routing and Canvas providers;
  all routes use `RenderMode.Server`, not prerendering.
- `src/server.ts`, `src/request-policy.ts`: validated request conversion, static
  assets and adapter mounting. See [deployment](DEPLOYMENT.md) for exact allowed
  hosts and canonical-origin or trusted-proxy configuration.

`canvas-angular` generates the ignored registry and server-only metadata modules
before Angular CLI runs. Production metadata is embedded in the server bundle;
component source files are not needed at runtime. Never import the generated
manifest or server credentials into browser code.

The adapter owns draft activation/renewal/exit, authenticated metadata, page and
entity access, component thumbnails, head updates and editor geometry. The app
owns banner presentation. Active embedded previews hide the banner; expired
sessions show the signed renewal link. Exit uses a normal POST form with
`ngNoForm`.

## Component authoring

Use `CanvasComponentTree` and `CanvasSlot` from the Angular adapter. Render each
slot once within its registry component's view. Registry hosts use
`host: { style: 'display: contents' }` to avoid extra layout boxes, but remain in
the DOM: direct-child selectors must account for Angular hosts, as the accordion
stylesheet does. Do not bypass hydration.

Only render trusted Drupal HTML. `CanvasMarkup` deliberately bypasses Angular
sanitization; raw HTML descendants are replaced during hydration or updates.
Use Angular templates for stateful interactions.
