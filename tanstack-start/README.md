# Canvas headless template: TanStack Start

A minimal TanStack Start frontend for Drupal Canvas with React components and Tailwind CSS.

> **Release-blocked ADR21 preparation:** the retained package pins do not yet
> provide the APIs used here. Do not distribute this revision until
> [Canvas MR1666](https://git.drupalcode.org/project/canvas/-/merge_requests/1666)
> is merged, its packages are published, and this template's versions and lockfile
> are refreshed and validated.

## Setup

```bash
npx @drupal-canvas/create@latest --template tanstack-start
```

The dev server runs at <http://localhost:3000>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

## Project structure

- **Components:** `src/components` contains the React components exposed to Canvas.
- **Styles:** `src/styles.css` contains the global Tailwind styles.
- **Canvas integration:** The Canvas Vite plugin generates the component registry, while the API routes and middleware handle draft sessions, component metadata, and component-library thumbnails. The catch-all route renders Drupal content through `CanvasComponentTree`.

## Portable React components

The root loader obtains nonsecret JSON:API runtime configuration through a server
function and supplies it via `JsonApiRuntimeProvider`. The page renderer receives
`context={page.context}`. Components import `usePageContext`, `useSiteContext`
and `useJsonApiClient` from `drupal-canvas/react`; handle nullable results.
Existing `Image` and `FormattedText` imports stay at `drupal-canvas`.

The `/api/canvas/jsonapi/$` route delegates to the SDK's proxy handlers, including
PUT so unsupported requests reach the shared 405 response. If changing
`CANVAS_JSONAPI_PROXY_PATH`, move this route to match it. Session credentials stay
server-side; do not import the SDK's server APIs directly into isomorphic loaders.
The reference content helpers use `getClient()` through server functions and
consume arrays of flattened resources, not `data`/`attributes` documents.

No starter component uses SWR. If adding it, prefetch draft data with server
`getClient()` and provide request-scoped fallback data with matching keys. The
renderer cannot fetch draft data during SSR; never serialize clients or tokens.

## Commands

| Command             | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start TanStack Start                   |
| `npm run build`     | Create a production build              |
| `npm run preview`   | Preview the build                      |
| `npm run workbench` | Preview components in Canvas Workbench |
| `npm run check`     | Run ESLint and TypeScript              |
