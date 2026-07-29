# Canvas headless template: TanStack Start

A minimal TanStack Start frontend for Drupal Canvas with React code components and Tailwind CSS.

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
| `npm run dev` | Start TanStack Start |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the build |
| `npm run canvas -- --help` | Run Canvas CLI |
| `npm run workbench` | Preview components in Canvas Workbench |
| `npm run check` | Run ESLint and TypeScript |

Components live in `src/components`; global Tailwind styles live in `src/styles.css`. The Canvas Vite plugin generates the component registry, the API routes and middleware provide draft sessions and metadata, and the catch-all route renders Drupal content through `CanvasComponentTree`.
