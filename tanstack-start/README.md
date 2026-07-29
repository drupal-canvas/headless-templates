# Canvas headless template: TanStack Start

A minimal TanStack Start frontend for Drupal Canvas with React components and Tailwind CSS.

## Setup

```bash
npx @drupal-canvas/create@latest --template tanstack-start
```

The dev server runs at <http://localhost:3000>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

## Project structure

- **Components:** `src/components` contains the React components exposed to Canvas.
- **Styles:** `src/styles.css` contains the global Tailwind styles.
- **Canvas integration:** The Canvas Vite plugin generates the component registry, while the API routes and middleware handle draft sessions and component metadata. The catch-all route renders Drupal content through `CanvasComponentTree`.

## Commands

| Command             | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start TanStack Start                   |
| `npm run build`     | Create a production build              |
| `npm run preview`   | Preview the build                      |
| `npm run workbench` | Preview components in Canvas Workbench |
| `npm run check`     | Run ESLint and TypeScript              |
