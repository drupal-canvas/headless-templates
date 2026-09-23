# Canvas headless template: Angular

A minimal Angular frontend for Drupal Canvas with standalone Angular components and Tailwind CSS.

## Setup

```bash
npx @drupal-canvas/create@latest --template angular
```

The dev server runs at <http://localhost:4200>. After enabling the Canvas Headless module, configure this URL as a headless frontend.

For an existing checkout, copy `.env.example` to `.env` and set `CANVAS_SITE_URL` to your Drupal site URL. The server loads `.env` automatically. Use the Node version in `.nvmrc`.

See [deployment](DEPLOYMENT.md) for production hosts and HTTPS proxy configuration.

## Project structure

- **Components:** `src/components` contains the standalone Angular components exposed to Canvas.
- **Styles:** `src/styles.css` contains the global Tailwind styles.
- **Canvas integration:** `canvas-angular` generates the component registry and server-only metadata, while `src/server.ts` handles draft sessions, component metadata, and component-library thumbnails. The catch-all route renders Drupal content through `CanvasComponentTree`.

## Commands

| Command                      | Purpose                                    |
| ---------------------------- | ------------------------------------------ |
| `npm run dev`                | Start Angular                              |
| `npm run build`              | Build the browser bundles and Node server  |
| `npm run preview`            | Preview the build                          |
| `npm run check`              | Run Angular template and TypeScript checks |
| `npm run canvas -- validate` | Validate Canvas components                 |
