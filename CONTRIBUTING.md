# Contributing

Each template must remain usable as a standalone project.

## Component changes

When adding or changing a component:

1. Apply shared component changes in all five framework component directories:
   - `astro/src/components`
   - `nextjs/components`
   - `nuxt/app/components`
   - `tanstack-start/src/components`
   - `angular/src/components`
2. Keep `component.yml` and `mocks.json` identical across frameworks.
3. Use [Nebula's example components](https://github.com/acquia/nebula/tree/main/examples/components) as the source of truth. Keep the React implementations identical to Nebula except for required framework directives and adaptations for intentionally omitted dependencies, and keep the Astro, Vue and Angular ports visually equivalent. Existing template implementations define the actual cross-framework parity baseline; framework ports should not introduce a new visual design.
4. Verify the component through the framework's `CanvasComponentTree` renderer.
5. Run `npm run check` and `npm run build` inside every template.
6. Run `npm run canvas -- validate` in every template.
7. Verify previews with `npm run workbench` in Next.js and TanStack Start. Angular has no Workbench: verify real-browser SSR/hydration, responsive component parity, interactions and editor geometry through `CanvasComponentTree`, on both supported Angular majors with the same adapter artifact. See [Angular validation](angular/tests/README.md).

Angular components use ordinary inputs, default exports and the adapter's `CanvasSlot`. Persistent Angular hosts must be accounted for in grid/flex layouts and direct-child selectors. Keep generated manifests and all server credentials out of browser imports. Adapter and Canvas Create registry changes belong in Canvas, not this template repository.

## Dependency changes

Update each affected `package.json` and lockfile independently. Do not add npm workspaces, root dependencies, package hoisting, or imports between templates. Root-level repository automation is welcome as long as copied templates do not depend on it.
