# Canvas headless template: Nuxt

A minimal Nuxt SSR frontend for Drupal Canvas with native Vue code components and Tailwind CSS.

## Setup

```bash
cp .env.example .env
npm ci
npm run dev
```

The dev server runs at <http://localhost:3000>.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Nuxt |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the build |
| `npm run canvas -- --help` | Run Canvas CLI |
| `npm run check` | Run ESLint and Nuxt type checks |

Components live in `app/components`; global Tailwind styles live in `app/assets/css/main.css`. The Nuxt module injects draft-session routes, `/api/canvas/components`, and the `CanvasComponentTree` renderer used by the catch-all page.
