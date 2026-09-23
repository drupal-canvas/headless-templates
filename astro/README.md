# Canvas headless template: Astro

A minimal Astro frontend for Drupal Canvas with native Astro components and Tailwind CSS.

> **Release-blocked ADR21 preparation:** the reference data helpers now target
> the new shared client, but retained published pins still lack that contract. Wait for
> [Canvas MR1666](https://git.drupalcode.org/project/canvas/-/merge_requests/1666),
> package publication, and a validated version/lockfile refresh before distributing
> this revision.

## Setup

```bash
npx @drupal-canvas/create@latest --template astro
```

The dev server runs at <http://localhost:4321>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

## Project structure

- **Components:** `src/components` contains the Astro components exposed to Canvas.
- **Styles:** `src/styles/global.css` contains the global Tailwind styles.
- **Canvas integration:** The headless integration adds draft-session routes and exposes component metadata at `/api/canvas/components`. The catch-all route renders Drupal content through `CanvasComponentTree`.

## Data access after ADR21

Native Astro components keep using the Astro SDK and server frontmatter; no React
hooks/providers are added. Page/site data is available in the SDK's `page.context`
for application use, not automatically as React context.

The updated Canvas integration mounts the same-origin JSON:API proxy at
`CANVAS_JSONAPI_PROXY_PATH` (default `/api/canvas/jsonapi`); do not add a duplicate
application route. Server code retains `getClient(Astro)` with the request context
and existing draft-session lifecycle. The reference helpers in `src/lib/content.ts`
now consume collections as arrays with flattened resource fields from
`DefaultSerializer`, not `data`/`attributes` documents.

## Commands

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start Astro                      |
| `npm run build`   | Build the standalone Node server |
| `npm run preview` | Preview the build                |
| `npm run check`   | Run ESLint and Astro type checks |
