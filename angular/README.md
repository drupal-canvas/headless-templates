# Canvas headless template: Angular

A minimal Angular frontend for Drupal Canvas with standalone Angular components and Tailwind CSS.

> **Release-blocked ADR21 preparation:** the retained Angular adapter `0.2.0`
> and shared SDK `0.8.0` still lack the required proxy contract. This PR preserves
> upstream's versions and lockfile. Verify compatible releases and refresh the
> dependency graph before distributing this revision. A higher version alone is
> not proof of compatibility with
> [Canvas MR1666](https://git.drupalcode.org/project/canvas/-/merge_requests/1666).

## Setup

```bash
npx @drupal-canvas/create@latest --template angular
```

The dev server runs at <http://localhost:4200>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

For an existing checkout, copy `.env.example` to `.env` and set `CANVAS_SITE_URL` to your Drupal site URL. The server loads `.env` automatically. Use the Node version in `.nvmrc`.

See [deployment](DEPLOYMENT.md) for production hosts and HTTPS proxy configuration.

## Project structure

- **Components:** `src/components` contains the standalone Angular components exposed to Canvas.
- **Styles:** `src/styles.css` contains the global Tailwind styles.
- **Canvas integration:** `canvas-angular` generates the component registry and server-only metadata, while `src/server.ts` handles draft sessions, component metadata, and component-library thumbnails. The catch-all route renders Drupal content through `CanvasComponentTree`.

## ADR21 data and proxy integration

Keep `provideCanvas()` in both bootstraps and use `CanvasPageStore` for native
Angular page/session signals. With the updated shared SDK, page/site data is at
`store.page()?.context`; the tree renderer still takes `tree` and `components`,
not a React `context` input. Do not add React providers or hooks to Angular.

The published Angular adapter's automatic handler does not mount ADR21's JSON:API
proxy. The server-only `src/canvas-handler.ts` uses its documented request accessor
to delegate `/api/canvas/jsonapi` (or `CANVAS_JSONAPI_PROXY_PATH`) to the shared
SDK proxy and finalize its response. Existing authority checks, sessions, cookies,
CSP, metadata, thumbnails and native SSR remain in place.

There are no JSON:API collection examples here to migrate. If adding server-side
queries later, the request accessor's `server.getClient()` uses ADR21's default
serializer: collections are arrays and resource fields are flattened, not nested
under `data`/`attributes`. Never serialize this accessor, a client or credentials
into TransferState. This preparation adds no listing or prefetch feature.

Full Angular 21/22 checks, SSR/hydration and authenticated proxy validation remain
release prerequisites. Angular has no Workbench integration.

## Commands

| Command                      | Purpose                                    |
| ---------------------------- | ------------------------------------------ |
| `npm run dev`                | Start Angular                              |
| `npm run build`              | Build the browser bundles and Node server  |
| `npm run preview`            | Preview the build                          |
| `npm run check`              | Run Angular template and TypeScript checks |
| `npm run canvas -- validate` | Validate Canvas components                 |
