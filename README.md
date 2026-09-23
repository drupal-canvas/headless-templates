# Drupal Canvas headless templates

> **ADR21 preparation — not ready to merge or distribute.** All five
> Next.js, TanStack Start, Nuxt, Astro and Angular starters are being adapted to ADR21
> Canvas APIs. Upstream refreshed the package pins and locks, but those releases
> still lack the required ADR21 APIs. See the
> [adoption and release prerequisites](docs/adr21-adoption.md).

Framework-native starters for decoupled Drupal Canvas frontends. Create a project with Canvas Create:

```bash
npx @drupal-canvas/create@latest --experimental-headless
```

Choose a template interactively, or select one directly:

```bash
npx @drupal-canvas/create@latest --template nextjs
```

The templates are Astro, Next.js, Nuxt, TanStack Start, and Angular. Each generated project includes draft preview, the Canvas component metadata endpoint, catch-all Drupal page rendering, Tailwind CSS, the Canvas CLI, and the same selected components from [Nebula](https://github.com/acquia/nebula).

Canvas Workbench is included in the React templates (Next.js and TanStack Start).
