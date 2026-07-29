# Canvas headless template: Astro

A minimal Astro frontend for Drupal Canvas with native Astro components and Tailwind CSS.

## Setup

```bash
npx @drupal-canvas/create@latest --template astro
```

The dev server runs at <http://localhost:4321>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

## Project structure

- **Components:** `src/components` contains the Astro components exposed to Canvas.
- **Styles:** `src/styles/global.css` contains the global Tailwind styles.
- **Canvas integration:** The headless integration adds draft-session routes and exposes component metadata at `/api/canvas/components`. The catch-all route renders Drupal content through `CanvasComponentTree`.

## Commands

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start Astro                      |
| `npm run build`   | Build the standalone Node server |
| `npm run preview` | Preview the build                |
| `npm run check`   | Run ESLint and Astro type checks |
