# Canvas headless template: Nuxt

A minimal Nuxt frontend for Drupal Canvas with native Vue components and Tailwind CSS.

## Setup

```bash
npx @drupal-canvas/create@latest --template nuxt
```

The dev server runs at <http://localhost:3000>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

## Project structure

- **Components:** `app/components` contains the Vue components exposed to Canvas.
- **Styles:** `app/assets/css/main.css` contains the global Tailwind styles.
- **Canvas integration:** The Nuxt module adds draft-session routes and exposes component metadata at `/api/canvas/components`. The catch-all page renders Drupal content through `CanvasComponentTree`.

## Commands

| Command           | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start Nuxt                      |
| `npm run build`   | Create a production build       |
| `npm run preview` | Preview the build               |
| `npm run check`   | Run ESLint and Nuxt type checks |
