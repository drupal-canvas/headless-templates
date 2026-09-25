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

### Server rendering and SWR

SWR fetchers do not run during server rendering, for public pages or drafts.
Prefetch with server-side `getClient()` to include data in the initial HTML;
otherwise components render their loading or empty state until the browser
fetches. Portable components stay synchronous, using `useJsonApiClient()` and
SWR rather than becoming async components.

The example follows the
[SDK reference](https://git.drupalcode.org/project/canvas/-/blob/d1ffcdd69d7be9dc753c8deccc0b1905f588acca/packages/headless/README.md#server-rendering-and-swr).
When adopting it, add `swr` as a direct application dependency (`npm install swr`);
it is not included in the template.

Define an application-owned client boundary at `components/swr-fallback.tsx`
(this is not an SDK export):

```tsx
'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

export default function SwrFallback({
  fallback,
  children,
}: {
  fallback: Record<string, unknown>;
  children: ReactNode;
}) {
  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>;
}
```

In `app/[[...slug]]/page.tsx`, add these imports, then replace the final return
inside `CatchAllPage`, keeping the existing page lookup and not-found/redirect
handling. This example assumes Drupal exposes `node--article` with a `title`:

```tsx
import { getClient } from '@drupal-canvas/headless-next';
import SwrFallback from '@/components/swr-fallback';

// Inside CatchAllPage, after the redirect handling:
const client = await getClient();
const articles =
  (await client.getCollection<{ id: string; title: string }[]>(
    'node--article',
  )) ?? [];
// Project only the fields needed across the server/client boundary.
const fallback = {
  articles: articles.map(({ id, title }) => ({ id, title })),
};

return (
  <SwrFallback fallback={fallback}>
    <CanvasComponentTree tree={page.content} context={page.context} />
  </SwrFallback>
);
```

A portable article-list component registered with Canvas and placed in the page
can consume that fallback with the exact same string key, `articles`:

```jsx
import { useJsonApiClient } from 'drupal-canvas/react';
import useSWR from 'swr';

export default function ArticleList() {
  const client = useJsonApiClient();
  const { data, error } = useSWR(client ? 'articles' : null, () =>
    client.getCollection('node--article'),
  );

  if (error) return <p>Unable to load articles.</p>;
  if (!data) return <p>Loading articles…</p>;
  return (
    <ul>
      {data.map((article) => (
        <li key={article.id}>{article.title}</li>
      ))}
    </ul>
  );
}
```

The renderer supplies a non-null draft client during SSR so the SWR key stays
enabled and fallback data can render. Direct fetches through that draft client
reject with `ServerRenderingDraftFetchError`; use the server integration's
`await getClient()` for prefetching, as above. After hydration, SWR fetches through
the browser client and same-origin proxy.

Keep fallback data request-scoped, not in a shared server cache. Pass only
hydration-safe data across the boundary, never clients or credentials.
`DefaultSerializer`'s `getMeta()` and `getLinks()` functions do not serialize;
the example passes plain fields instead. Token renewal does not clear
application SWR caches; the application owns cache invalidation.

## Commands

| Command             | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start Next.js                          |
| `npm run build`     | Create a production build              |
| `npm start`         | Run the production server              |
| `npm run workbench` | Preview components in Canvas Workbench |
| `npm run check`     | Run ESLint and TypeScript              |
