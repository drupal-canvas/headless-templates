# Contributing

Each template must remain usable as a standalone project.

## Component changes

When adding or changing a component:

1. Apply the change in all four framework component directories:
   - `astro/src/components`
   - `next/components`
   - `nuxt/app/components`
   - `tanstack-start/src/components`
2. Keep `component.yml` and `mocks.json` identical across frameworks.
3. Use [Nebula's example components](https://github.com/acquia/nebula/tree/main/examples/components) as the source of truth. Keep the React implementations identical to Nebula except for required framework directives and adaptations for intentionally omitted dependencies, and keep the Astro and Vue ports visually equivalent.
4. Verify the component through the framework's `CanvasComponentTree` renderer.
5. Run `npm run check` and `npm run build` inside every template.
6. Run `npm run canvas -- validate` in every template.
7. Verify previews with `npm run workbench` in Next.js and TanStack Start.

## Dependency changes

Update each affected `package.json` and lockfile independently. Do not add npm workspaces, root dependencies, package hoisting, or imports between templates. Root-level repository automation is welcome as long as copied templates do not depend on it.
