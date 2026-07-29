# Canvas headless template: Astro

A minimal Astro SSR frontend for Drupal Canvas with native Astro code components and Tailwind CSS.

## Setup

```bash
cp .env.example .env
npm ci
npm run dev
```

The dev server runs at <http://localhost:4321>. Configure the Canvas headless frontend URL to match it.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Astro |
| `npm run build` | Build the standalone Node server |
| `npm run preview` | Preview the build |
| `npm run canvas -- --help` | Run Canvas CLI |
| `npm run check` | Run ESLint and Astro type checks |

Components live in `src/components`; global Tailwind styles live in `src/styles/global.css`. The headless integration injects draft-session routes and `/api/canvas/components`, while the catch-all route renders Drupal content through `CanvasComponentTree`.
