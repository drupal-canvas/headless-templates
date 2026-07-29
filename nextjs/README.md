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
- **Canvas integration:** `withCanvas()` generates the component registry, while the routes under `app/api` handle draft sessions and component metadata. The catch-all route renders Drupal content through `CanvasComponentTree`.

## Commands

| Command             | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start Next.js                          |
| `npm run build`     | Create a production build              |
| `npm start`         | Run the production server              |
| `npm run workbench` | Preview components in Canvas Workbench |
| `npm run check`     | Run ESLint and TypeScript              |
