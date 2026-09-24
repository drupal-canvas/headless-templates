# Canvas headless template: Next.js

A minimal Next.js frontend for Drupal Canvas with React components and Tailwind CSS.

## Setup

```bash
npx @drupal-canvas/create@latest --template nextjs
```

The dev server runs at <http://localhost:3000>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

## Project structure

- **Components:** `components` contains the React components exposed to Canvas.
- **Styles:** `app/globals.css` contains the global Tailwind styles.
- **Canvas integration:** `withCanvas()` generates the component registry, while the routes under `app/api` handle draft sessions, component metadata, and component-library thumbnails. The catch-all route renders Drupal content through `CanvasComponentTree`.
- **Framing policy:** `proxy.ts` applies the SDK's request-time CSP on every request. Keep it mounted for page and editor previews. To add an application CSP, compose it with `applyCanvasHeaders()` from `@drupal-canvas/headless-next/middleware` on the same response, rather than setting a static CSP in `next.config.ts`.

## Portable React components

The root `CanvasRuntime` supplies nonsecret JSON:API runtime configuration, and
`CanvasComponentTree` receives `context={page.context}`. Components can import
`usePageContext`, `useSiteContext` and `useJsonApiClient` from
`drupal-canvas/react`; handle their nullable results. Existing `Image` and
`FormattedText` imports stay at `drupal-canvas`.

The `/api/canvas/jsonapi/[[...path]]` route mounts the SDK's same-origin proxy.
If changing `CANVAS_JSONAPI_PROXY_PATH`, move the route to the matching path.
Session credentials stay server-side. Server data loading uses `getClient()`;
its default serializer returns collections directly as arrays with flattened
resource fields (see `lib/content.ts`), not `data`/`attributes` documents.

For components that use SWR, prefetch draft data with server `getClient()` and
provide request-scoped SWR fallback data with matching keys;
the renderer's draft client must not fetch during SSR. Do not serialize clients
or credentials into component props.

## Commands

| Command             | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start Next.js                          |
| `npm run build`     | Create a production build              |
| `npm start`         | Run the production server              |
| `npm run workbench` | Preview components in Canvas Workbench |
| `npm run check`     | Run ESLint and TypeScript              |
