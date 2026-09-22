# Drupal Canvas headless templates

Framework-native starters for decoupled Drupal Canvas frontends. Create a project with Canvas Create:

```bash
npx @drupal-canvas/create@latest --experimental-headless
```

Choose a template interactively, or select one directly:

```bash
npx @drupal-canvas/create@latest --template nextjs
```

The available templates are Astro, Next.js, Nuxt, and TanStack Start. Each generated project includes draft preview, the Canvas component metadata endpoint, catch-all Drupal page rendering, Tailwind CSS, the Canvas CLI, and the same selected components from [Nebula](https://github.com/acquia/nebula).

Canvas Workbench is included in the React templates (Next.js and TanStack Start).

An [Angular 22 template](angular/README.md), with an independently tested Angular 21 configuration, is also under development. It includes the same 18 components and uses the Angular Canvas adapter without Workbench. Angular is registered in Canvas Create's experimental registry. CI publishes the adapter after merge; public installation and a registry-resolved lockfile follow that release. Local validation and demos use the immutable packed artifact and do not require publication; see the template README for details.
