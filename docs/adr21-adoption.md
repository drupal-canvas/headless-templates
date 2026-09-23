# ADR21 template adoption — release-blocked preparation

This source change prepares **Next.js, TanStack Start, Nuxt, Astro and Angular** for
[Canvas MR1666](https://git.drupalcode.org/project/canvas/-/merge_requests/1666),
reviewed at
[`5a491e83`](https://git.drupalcode.org/project/canvas/-/commit/5a491e839627c50eff0ebd1e849c655322b9be25).
It is not a released, buildable dependency update. All five current templates
are included; each still needs a verified compatible dependency graph.

## Required order

1. Merge the Canvas implementation and publish packages containing the approved
   ADR21 contract. A higher version number alone is not evidence of that contract.
2. Verify the published runtime exposes `drupal-canvas/react`, the SDK returns
   `page.context` and uses the shared JSON:API client, and the adapters expose the
   runtime/proxy integrations used here.
3. Update the affected template manifests **and each independent lockfile** to
   actual released versions. Ensure their transitive runtime/SDK versions also
   contain ADR21; do not mix a new renderer with an old runtime. Refresh the
   React templates' Workbench and CLI/tooling as appropriate, including the
   matching Vite plugin used by Workbench.
4. Refresh the bundled upstream headless skill when its ADR21 guidance is
   available. This preparation corrects that skill locally in all five templates;
   `skills-lock.json` still records the original upstream snapshot, not a made-up
   upstream hash for these local edits.
5. Run each template's check/build, component validation and applicable preview
   checks with the final released dependency graph before merging this template
   change or distributing the updated starters.

Upstream `3e86935` refreshed all five templates' published dependencies. This PR
retains those manifests and independent locks exactly; it does not revert them
or substitute local MR packages. The retained releases still lack the ADR21
contract, so the new imports and renderer props are **not expected to build
against these pins**. No future version numbers, local package paths, npm
overrides or validation-only dependencies belong in this PR.

Inspection of the actual locked releases confirms that `drupal-canvas@0.6.0`
lacks `/react`, `headless-next@0.6.0` lacks `/CanvasRuntime`, and
`headless-react@0.4.2` lacks `JsonApiRuntimeProvider`. Shared SDK `0.8.0` does not
declare `Page.context` and lacks the proxy API and runtime configuration accessor; its public
client still returns resource documents with nested attributes, not the ADR21
flattened collections. The newer Astro `0.5.2`, Nuxt `0.5.2`, TanStack Start
`0.6.1` and Angular `0.2.0` releases do not supply the missing integrations.
These are observed contract gaps, not assumptions based on version numbers.

## What changes

| Template       | Required integration                                                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js        | `CanvasRuntime` wraps the layout content; the page renderer receives `page.context`; an explicit same-origin JSON:API route delegates to the SDK.                                                                                               |
| TanStack Start | A server function returns nonsecret JSON:API runtime configuration to the root loader; `JsonApiRuntimeProvider` wraps the outlet; the page renderer receives context; the proxy route delegates all supplied handlers, including PUT rejection. |
| Nuxt           | The updated SDK module mounts the proxy automatically. Native Vue rendering and request-scoped server access remain unchanged.                                                                                                                  |
| Astro          | The updated SDK integration mounts the proxy automatically. Native Astro rendering and request-context server access remain unchanged.                                                                                                          |
| Angular        | Native `provideCanvas()` / `CanvasPageStore` binding stays intact. Template-side custom mounting delegates the JSON:API proxy through the adapter's documented request accessor and finalizes responses.                                        |

The four existing reference content-list helpers now consume `DefaultSerializer` output:
collections are arrays, and attributes such as `title`, `path` and Drupal numeric
IDs are directly on each resource. They no longer unwrap `document.data` or read
`resource.attributes`. Existing aliases and canonical URL fallbacks are retained.
These helpers are reference examples, not a newly introduced listing feature.
Angular has no corresponding collection helper or `attributes` consumer to
migrate; adding a listing or SWR example there is not required.

The default proxy path is `/api/canvas/jsonapi`. If changing
`CANVAS_JSONAPI_PROXY_PATH`, Next.js and TanStack Start must move their explicitly
mounted route to match it; Astro and Nuxt mount the configured path through their
integrations. Never pass browser-supplied credentials or arbitrary destinations
to a replacement proxy implementation.

## React component contract

```tsx
import { usePageContext, useJsonApiClient } from 'drupal-canvas/react';
import { Image, FormattedText } from 'drupal-canvas'; // existing paths unchanged
```

The seven new hooks/providers and their two provider prop types use `/react`;
there are no new root aliases. Hooks return null when required context is
missing. Call them unconditionally in valid hook positions, then handle null.
Legacy getters and `new JsonApiClient()` are not supported in headless code;
server code uses the adapter's request-aware `getClient()`.

Page/site context contains data, not a client or token. Runtime configuration is
serializable and nonsecret. Authentication and preview tokens remain in the
existing server/session integration. Draft activation, renewal, exit, CSP,
metadata and component-preview endpoints are not redesigned here.

No existing starter component uses SWR, so this preparation adds neither SWR nor
an artificial prefetch feature. When an application later adds portable SWR
components, prefetch draft data with server `getClient()` and pass authorized,
request-scoped fallback data with matching keys. The renderer's draft client
cannot fetch during SSR; it is distinct from the server prefetch client. Public
SSR may use a direct unauthenticated client, while browser requests use the
same-origin proxy. Renewal does not automatically clear application caches.

Native Vue, Astro and Angular components do not acquire React hooks/providers.
They can use SDK page data and their framework's server-loading conventions.

## Angular adapter boundary

The template pins `@drupal-canvas/headless-angular@0.2.0` with shared SDK
`^0.8.0` (locked to `0.8.0`). Its published package points to Canvas's
`packages/headless-angular`, which does not exist at the approved ADR21 reference
commit. Its actual public declarations and implementation were inspected
separately: it does not automatically mount the JSON:API proxy.

`src/canvas-handler.ts` uses the documented `createCanvasRequest()` accessor's
`server` and `finalize()` methods to mount the shared ADR21 proxy. It honors the
configured proxy path, delegates all methods (including unsupported-method
rejection) to the SDK, and leaves existing routes with `createCanvasHandler()`.
The existing request-authority policy still runs before either handler. Cookies,
CSP and private/no-store responses continue through adapter finalization.

`provideCanvas()` remains in both bootstraps. `CanvasPageStore.page()` carries the
SDK page, including `page.context` when supplied by the updated shared SDK. The
Angular tree component accepts only `tree` and `components`, not a React-style
`context` input. Server accessors, clients and credentials must not enter
TransferState; there is no new Angular client provider or collection feature.

Release gate: verify the chosen Angular adapter against the ADR21 shared SDK,
including proxy/session behavior and Angular 21/22 SSR/hydration. The published
`0.2.0` adapter works with its declared shared SDK `0.8.0` for existing request
accessors, sessions and response finalization, but that SDK lacks
`DEFAULT_JSONAPI_PROXY_PATH` and `handleJsonApiProxy`. The new template handler
therefore cannot yet import against the retained published graph.

Do not substitute the older local MR SDK labelled `0.7.0` for the declared
`^0.8.0` dependency to claim compatibility. Retain upstream CSP behavior,
including `CANVAS_EDITOR_ORIGINS` and the configured site-origin fallback,
when validating a future ADR21 release. No Angular version or lock change is
made by this PR. Upstream automatic proxy mounting could later replace this
custom mounting after review; absence of an adapter in the old Canvas snapshot
is not a reason to exclude Angular.

## Reviewing and validating the preparation

Run the dependency-free repository regression tests with Node 22.19+ or a
supported Node 24 release:

```sh
node --experimental-vm-modules --test tests/adr21-*.test.mjs
```

These execute the real TypeScript helper modules with stubbed framework/SDK
boundaries and check wiring. They are not framework build, browser, auth or SSR
certification. Final validation still follows `CONTRIBUTING.md` with released
packages.

Before publication, local MR tarballs may be used only in a disposable copy.
Record the Canvas source SHA, tarball hashes, dependency graph and which checks
actually ran. Local dependency substitutions and build artifacts must never
enter the template manifests or locks.
