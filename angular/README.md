# Canvas headless template: Angular

Standalone Angular 22 frontend for Drupal Canvas, with request-time SSR, Tailwind CSS 4, and the same 18 components as the other headless templates. No Workbench, workspace, or cross-template imports.

## Release status

**Not yet installable from the public registry.** `@drupal-canvas/headless-angular` is unpublished. The `0.0.0` dependency is an explicit prerelease placeholder, not a released starter dependency. A release version and registry-resolved lockfile are required before distribution. Canvas now registers Angular in its experimental Create registry; the registry is owned by Canvas, not this template. Public installation remains gated on the adapter release.

Final public npm-bin validation uses the same independently copied, Angular-21-partially-compiled adapter tarball in temporary Angular 21 and 22 projects. No local tarball dependency or absolute lockfile resolution belongs in this template. See [validation](tests/README.md) for the evidence boundary and current blockers.

## Setup (after the adapter release)

Use this directory as the project root, not the repository root:

```sh
nvm use
npm install
export CANVAS_SITE_URL=https://your-drupal-site.example
npm run dev
```

The dev server listens on <http://localhost:4200>. `CANVAS_SITE_URL` is server-only. `.env.example` documents the variable; exporting it (or configuring it in the deployment environment) is required—Angular does not automatically load `.env` files.

Enable Canvas Headless on Drupal and configure the frontend URL there. Production cross-site editor previews require HTTPS. Coordinate shared Drupal configuration changes with its owner; `canvas validate` is local and does not sync components or mutate Drupal configuration.

Node must satisfy **`^22.22.3 || ^24.15.0 || >=26.0.0`** for Angular 22. This directory's `.nvmrc` pins the tested Node **24.21.0**, independently of the repository root's Node configuration.

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm start` | Generate/watch Canvas sources, then run public Angular CLI development server |
| `npm run check` | Generate Canvas sources and run Angular's strict template/TypeScript compiler |
| `npm run build` | Generate registry/metadata and build browser + request-time Node SSR bundles |
| `npm run preview` | Run the production SSR server (default port 4200; override `PORT`) |
| `npm run canvas -- validate` | Validate local component definitions; no remote sync |

Development uses `canvas-angular --watch -- ng serve`; builds use `canvas-angular -- ng build`. No private Vite configuration or framework-internal discovery hooks. Generated `src/canvas-components.generated.ts` and `src/canvas-manifest.generated.ts` are ignored. The manifest is server-only and embedded at build time, so deployment does not require component source files.

## Angular 21 configuration

The **same adapter artifact** is independently consumed by both configurations:

| Package group | Default | Angular 21 alternative |
| --- | --- | --- |
| `@angular/common`, `compiler`, `core`, `platform-browser`, `platform-server`, `router`, `compiler-cli` | 22.1.7 | 21.2.23 |
| `@angular/build`, `cli`, `ssr` | 22.1.8 | 21.2.24 |
| `typescript` | 6.0.2 | 5.9.3 |
| Node used for validation | 24.21.0 | 24.21.0 |

To select Angular 21 after the adapter is released:

```sh
# Update both dependency groups before invoking the resolver once.
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'package.json';
const pkg = JSON.parse(readFileSync(file, 'utf8'));
for (const group of ['dependencies', 'devDependencies']) {
  for (const name of Object.keys(pkg[group])) {
    if (name.startsWith('@angular/')) {
      pkg[group][name] = ['@angular/build', '@angular/cli', '@angular/ssr'].includes(name)
        ? '21.2.24' : '21.2.23';
    }
  }
}
pkg.devDependencies.typescript = '5.9.3';
writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
NODE
npm install
npm run check
npm run build
npm run canvas -- validate
```

Keep this starter's Node requirement when switching majors; Angular 21's lower engine floor does not override Canvas dependencies. Do not use a second adapter build for Angular 21.

## Application structure

- `src/components/*`: default-exported standalone components with ordinary Angular inputs. YAML machine names and mock files match the existing templates unchanged.
- `src/styles.css`: shared Tailwind theme, Canvas preview CSS, and Angular-host-aware accordion selectors.
- `src/routes.ts`, `src/page.ts`: catch-all resolver, `CanvasPageStore`, not-found UI, and draft banner presentation.
- `src/main.ts`, `src/main.server.ts`: hydration, routing, `provideCanvas()`, and `RenderMode.Server` for every route. No draft prerendering.
- `src/server.ts`: request-authority validation, static assets, generated manifest, and the adapter's `createCanvasHandler`. Configure exact `CANVAS_ALLOWED_HOSTS`; HTTPS-terminating proxies require the explicit origin/peer policy in [DEPLOYMENT.md](DEPLOYMENT.md). Setting Angular's host allowlist alone does not establish proxy trust.

The adapter owns `/api/draft`, POST `/api/draft/renew`, POST `/api/disable-draft`, authenticated `/api/canvas/components`, same-origin `/api/canvas/page` and `/api/canvas/entity`, and `/api/canvas/component-preview?componentId=…` for thumbnails. It also owns request-scoped Drupal access, redirects/404 status, route/entity identity, title/meta/link/JSON-LD updates, navigation/refresh, editor geometry, cookie/CSP policy, and the draft-session renewal protocol. The template does not reimplement these protocols.

The banner consumes `CanvasDraftSession` signals and the store's public session projection. Active embedded previews hide the banner; expired sessions show the expiry fallback and signed renewal link. Exit is a normal POST form with `ngNoForm`, not a prefetched link. Credentials, PKCE data, configuration, the server accessor and generated manifest must never enter browser imports or TransferState. App-owned Angular routes can use `RouterLink`; component link inputs remain ordinary anchors, matching the other templates. `CanvasPageStore.fetchEntity()` provides request-scoped SSR access and fixed same-origin browser entity requests.

## Component authoring

Use the adapter's `CanvasComponentTree` and `CanvasSlot`. Render each slot once within its registry component's own view. For example:

```ts
@Component({
  selector: 'app-section',
  imports: [CanvasSlot],
  host: { style: 'display: contents' },
  template: '<section><canvas-slot name="content" /></section>',
})
export default class Section {}
```

Angular hosts remain in the DOM even with `display: contents`. All registry hosts intentionally remove their boxes so grids, flex layouts and editor geometry measure the actual content. Direct-child selectors must still account for the `canvas-slot → canvas-children → canvas-element → app-*` host chain; the accordion stylesheet does this before hydration and after reordering. Do not use `ngSkipHydration` or private Angular APIs.

Only render trusted Drupal HTML. `CanvasMarkup` deliberately bypasses Angular sanitization for HTML-valued component props. Angular reassigns `[innerHTML]` during hydration or binding changes, replacing raw descendants rather than preserving their DOM identity. Ordinary HTML content/styles are supported; no ordinary-rich-text regression has been observed and no generic Drupal behavior machinery is added. Accordions, video controls and draft-exit forms are Angular/component markup, not raw renderer HTML.
