# Angular template validation

## Initial proof (current copied adapter)

Tested on Node 24.21.0 with independent Angular 22.1.7 / CLI 22.1.8 / TS 6.0.2 and Angular 21.2.23 / CLI 21.2.24 / TS 5.9.3 dependency trees. Neither consumer depends on a sibling checkout. Both use the same copied Angular adapter:

```
headless-angular-0.0.0 sha256 f3b07a16f38e8d38448b69f7baa02b34b240c064d32050b57cdd8de21d7299f6
headless-0.7.0         sha256 97d60e50dc60440deac729181fdb5bf1741f968351b7eead2ce76059f8f6dc6e
headless-host-0.4.1    sha256 3be359fced79a353e9fe448cb6b30f2b7d288699b692df3fb106de92fbba3787
```

Both consumers passed:

- Strict Angular template/TypeScript compilation without warnings; production browser and Node SSR builds; zero prerendered routes; local Canvas validation of all 18 components.
- All 35 existing `component.yml`/`mocks.json` files are byte-identical across the five templates. Footer has no mock file in the existing templates; the test transport supplies a test-only footer case without adding one to the component definition.
- Real Chromium comparison against an independently copied, unmodified Nuxt template: 74 cases at widths 1440 and 390, **148 comparisons / 1,244 matching native elements per Angular major**, zero measured geometry/style differences (1px geometry and 0.01px CSS rounding tolerances), zero browser errors. All 18 components are covered. Shared mocks supply 73 cases; a default-divider accordion case supplements the bordered/separated mocks.
- Actual HTTP SSR, published marker absence, title/meta/canonical/JSON-LD, HTTP 301/404, private/no-store responses, assertion-authenticated 18-component metadata, draft cookie attributes, public page/session allowlisting, route/entity context and SSR component thumbnails.
- Angular RouterLink navigation through the adapter's resolver updates content and owned head tags without a document reload. Accordion Enter/Space, expanded state, inert collapsed panels, independent open panels and hash navigation; native video controls with actual local media playback.
- The real shared preview host activates the template, receives geometry, refreshes without replacing the clicked accordion button or losing its state, renews a short-lived fixture session by timer, and hides the embedded active banner. Expiry shows the signed renewal link; the ordinary POST exit navigates to a public page with no draft markers.
- All-component desktop/mobile screenshots were inspected. The Angular 22 and Nuxt gallery WCAG 2 A/AA axe scans reported zero violations, with background-image contrast requiring manual review. This is not a claim of complete WCAG conformance.

### Remaining blockers / evidence limits

1. The initial packed `canvas-angular` bin compares its symlink argv path with its real module path and silently exits without running generation/Angular CLI. Reported to the adapter owner. Initial compiler/build checks invoked the copied package's real `tools/build.mjs` path, **not** the broken public bin. This is not a production workaround committed to application scripts. Final validation must pass the normal npm scripts against the refreshed artifact.
2. The adapter owner is independently addressing refresh/navigation abort races, refresh redirects, and watcher recovery after an invalid component-directory configuration switch. Final regression validation awaits that refreshed artifact; no adapter files or artifacts were patched or rebuilt here.
3. The adapter is unpublished. No registry-resolved lockfile or Canvas Create Angular selection can be delivered until its owner releases/integrates it. No publication is authorized or performed by these tests.
4. The transport is deliberately fake and loopback-only. It does not verify Drupal JWT signatures, single-use assertions or permissions. **No live Drupal integration or HTTPS cross-site CHIPS browser-matrix proof is claimed.** Shared Drupal configuration has not been changed.

## Reproduce with owner-supplied artifacts

Copy supplied tarballs into a directory you own. Do not build or alter a sibling checkout's artifacts. Then, from this standalone template:

```sh
node tests/validate-packed.mjs "$ARTIFACT_DIR"
```

This copies the three tarballs into a new OS-temporary directory, records their hashes, creates independent Angular 22/21 copies of this template, installs the same packages in each, and runs the **public** check/build/local-validation commands. It verifies generated files and the actual SSR output exist, so a silent CLI no-op cannot pass. Local package/lock resolutions exist only in those temporary copies. It does not start services or mutate the source template.

The printed directory contains both independently built consumers. After the owner's CLI fix, start them on free loopback ports with `CANVAS_SITE_URL=http://127.0.0.1:4520` and `PORT=4521` / `4522`. Start the test transport separately:

```sh
# TEST_VIDEO_FILE must point to a short local MP4 you own.
TEST_VIDEO_FILE="$VIDEO_FILE" node tests/mock-drupal.mjs
```

The default mock port is 4520 (`MOCK_PORT` can override it). Media URLs in fixtures are rewritten to deterministic local SVGs and the local MP4; production mocks remain unchanged. No tests call Canvas sync or alter remote configuration.

For the full shared-host test, in **each disposable consumer only**, bundle `tests/host.ts` with its installed esbuild into `dist/angular/browser/host.js`, and copy `tests/host.html` into that browser directory. These are test-only files, not starter routes or deployed assets:

```sh
./node_modules/.bin/esbuild tests/host.ts --bundle --format=esm --platform=browser --outfile=dist/angular/browser/host.js
cp tests/host.html dist/angular/browser/host.html
```

Use the global `agent-browser` CLI. Preserve an existing harness-provided `AGENT_BROWSER_SESSION`; otherwise create a session owned by your task. Run browser checks sequentially:

```sh
TEMPLATE_ORIGIN=http://127.0.0.1:4522 EVIDENCE_DIR="$EVIDENCE_DIR" node tests/browser-integration.mjs
TEMPLATE_ORIGIN=http://127.0.0.1:4522 REFERENCE_ORIGIN="$REFERENCE_ORIGIN" EVIDENCE_DIR="$EVIDENCE_DIR" node tests/browser-parity.mjs
```

Repeat for port 4521. `REFERENCE_ORIGIN` should serve the same fixture paths from an independently copied existing template; the comparison never imports or edits that template. `MOCK_ORIGIN` overrides the default test transport URL. Evidence includes JSON assertions, per-case measurements, and all-component screenshots. The scripts close their browser session in `finally`; stop only the servers/processes you started. No videos are produced.
