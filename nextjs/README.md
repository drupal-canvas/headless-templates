# Canvas headless template: Next.js

A minimal Next.js App Router frontend for Drupal Canvas with React code components and Tailwind CSS.

## Setup

```bash
cp .env.example .env.local
npm ci
npm run dev
```

The dev server runs at <http://localhost:3000>.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js |
| `npm run build` | Create a production build |
| `npm start` | Run the production server |
| `npm run canvas -- --help` | Run Canvas CLI |
| `npm run workbench` | Preview components in Canvas Workbench |
| `npm run check` | Run ESLint and TypeScript |

Components live in `components`; global Tailwind styles live in `app/globals.css`. `withCanvas()` generates the component registry, the routes under `app/api` provide draft sessions and metadata, and the catch-all route renders Drupal content through `CanvasComponentTree`.
