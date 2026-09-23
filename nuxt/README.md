# Canvas headless template: Nuxt

A minimal Nuxt frontend for Drupal Canvas with native Vue components and Tailwind CSS.

> **Release-blocked ADR21 preparation:** the reference data helpers now target
> the new shared client, but retained published pins still lack that contract. Wait for
> [Canvas MR1666](https://git.drupalcode.org/project/canvas/-/merge_requests/1666),
> package publication, and a validated version/lockfile refresh before distributing
> this revision.

## Setup

```bash
npx @drupal-canvas/create@latest --template nuxt
```

The dev server runs at <http://localhost:3000>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

## Project structure

- **Components:** `app/components` contains the Vue components exposed to Canvas.
- **Styles:** `app/assets/css/main.css` contains the global Tailwind styles.
- **Canvas integration:** The Nuxt module adds draft-session routes and exposes component metadata at `/api/canvas/components`. The catch-all page renders Drupal content through `CanvasComponentTree`.

## Data access after ADR21

Native Vue components keep using the Nuxt SDK and framework data-loading paths;
React hooks/providers are not added to this template. Page/site data is available
in the SDK's `page.context` for application use, not automatically as React context.

The updated Canvas Nuxt module mounts the same-origin JSON:API proxy at
`CANVAS_JSONAPI_PROXY_PATH` (default `/api/canvas/jsonapi`); do not add a duplicate
application route. Server code retains request-scoped `getClient(event)` and the
existing draft-session lifecycle. The reference `/api/content` route now returns
arrays of flattened resources from `DefaultSerializer`, without unwrapping `data`
or accessing `attributes`. See `shared/content.ts` for types and path helpers.

## Commands

| Command           | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start Nuxt                      |
| `npm run build`   | Create a production build       |
| `npm run preview` | Preview the build               |
| `npm run check`   | Run ESLint and Nuxt type checks |
