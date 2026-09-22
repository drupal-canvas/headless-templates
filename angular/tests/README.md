# Angular template validation

## Final proof (owner-supplied refreshed adapter)

Tested on Node 24.21.0 with independent Angular 22.1.7 / CLI 22.1.8 / TS 6.0.2 and Angular 21.2.23 / CLI 21.2.24 / TS 5.9.3 dependency trees. Neither consumer depends on a sibling checkout. Both use the same copied Angular adapter:

```
headless-angular-0.0.0 sha256 7796f5617c86b7f6050f854de4aed35e67175d2e026dde49ecbae9e08625e4f3
headless-0.7.0         sha256 97d60e50dc60440deac729181fdb5bf1741f968351b7eead2ce76059f8f6dc6e
headless-host-0.4.1    sha256 3be359fced79a353e9fe448cb6b30f2b7d288699b692df3fb106de92fbba3787
```

Both consumers passed:

- **Public npm-bin commands** `npm run check`, `npm run build`, `npm run dev`, and `npm run canvas -- validate`. Strict Angular template/TypeScript compilation without warnings; production browser and Node SSR builds; zero prerendered routes; local validation of all 18 components. Starting the public dev command with both generated modules removed recreated them and served actual SSR. A temporary metadata name edit and its restoration were both reflected by the development metadata endpoint.
- All 35 existing `component.yml`/`mocks.json` files are byte-identical across the five templates. Footer has no mock file in the existing templates; the test transport supplies a test-only footer case without adding one to the component definition.
- Strengthened real Chromium comparison against an independently copied, unmodified Nuxt template: 74 cases at widths 1440 and 390, **148 comparisons / 1,580 canonical native elements on each side per Angular major**, all compared, zero unexpected unmatched elements, zero class/content/attribute or measured geometry/style differences (1px geometry and 0.01px CSS rounding tolerances), zero browser errors. All 18 components are covered: **72 shared mock cases plus test-only footer and default-divider accordion cases**.
- Correspondence uses normalized DOM position/tag, not CSS classes or content. `parity-comparison.mjs` explicitly enumerates allowed Canvas/Angular hosts, the Nuxt route announcer, trusted-markup binding spans, the card heading margin wrapper, and accordion/decorative-icon adaptations. Known animation wrappers are normalized while icon shapes remain checked. Unknown elements on either side fail; classes, text and relevant attributes are compared separately from computed styles and geometry. Generated accordion IDs are normalized only after checking their actual ARIA relationships.
- Six real-browser negative controls prove detection of a removed element, an unexpected element, a changed class, a changed computed style, changed content, and a changed link target. Mutations affect only the disposable browser DOM, followed by reload; no broken fixture/source files are committed.
- The README's atomic Angular 21 migration was executed verbatim through its single `npm install` in an isolated copy starting with the Angular 22 package manifest/lockfile and copied artifact dependencies. All framework/compiler/build/SSR versions and TypeScript resolved to the documented Angular 21 matrix without force or legacy peer-dependency flags.
- Actual HTTP SSR, published marker absence, title/meta/canonical/JSON-LD, HTTP 301/404, private/no-store responses, assertion-authenticated 18-component metadata, draft cookie attributes, public page/session allowlisting, route/entity context and SSR component thumbnails.
- Angular RouterLink navigation through the adapter's resolver updates content and owned head tags without a document reload. Accordion Enter/Space, expanded state, inert collapsed panels, independent open panels and hash navigation; native video controls with actual local media playback.
- The real shared preview host activates the template, receives geometry, refreshes without replacing the clicked accordion button or losing its state, renews a short-lived fixture session by timer, and hides the embedded active banner. Expiry shows the signed renewal link; the ordinary POST exit navigates to a public page with no draft markers.
- All-component desktop/mobile screenshots were inspected. The Angular 22 and Nuxt gallery WCAG 2 A/AA axe scans reported zero violations, with background-image contrast requiring manual review. This is not a claim of complete WCAG conformance.

### Remaining blockers / evidence limits

- **Resolved:** the initial artifact's public-bin symlink no-op. The owner-supplied immutable artifact from Canvas `141fe459` passes final validation through the normal npm scripts; no direct script-path workaround was used for these final checks. The same artifact is installed on both majors, with identical installed renderer hashes.
- The refreshed artifact includes the owner's refresh/navigation overlap, refresh redirect, and watcher recovery fixes. Those focused adapter regressions were validated by its owner; the template's complete parity and integration checks were rerun against the refreshed artifact. No Canvas files, dependencies or artifacts were patched or rebuilt here.
- **Post-release follow-up, not a demo blocker:** CI publishes the adapter automatically after merge. Until then, validation and the demo use the supplied immutable tarball. Update the template dependency and generate its registry-resolved lockfile after release; do not commit local tarball resolutions. Canvas already registers Angular experimentally, and this template provides `npm run dev`. No manual publication, merge or push is authorized or performed.
- **Live-integration gate:** the transport is deliberately fake and loopback-only. It does not verify Drupal JWT signatures, single-use assertions or permissions. **No live Drupal integration or HTTPS cross-site CHIPS browser-matrix proof is claimed.** Before that testing, the service owner must approve/provide a Drupal endpoint with Canvas Headless enabled, trusted HTTPS frontend/editor origins and any actual signed preview URLs. Shared Drupal/services have not been configured or changed.

## Proxy regression candidate

The read-only live-service checkpoint identified two different failures on the
same HTTPS frontend: Angular 22 rejected native draft exit with `Origin not
allowed`; Angular 21 returned an empty app-root CSR shell even after its exact
host was allowed. Its anonymous page API still contained published content, not
the temporary editor change. See [DEPLOYMENT.md](../DEPLOYMENT.md) for the explicit
trust boundary and owner-applied configuration.

The candidate was checked and built through public npm scripts on both pinned
majors using the same immutable adapter above. `proxy-server.mjs` exercises real
Node HTTP requests against each production build and retains an optional legacy
build for direct comparison. Both majors passed:

- Their respective **legacy failure reproduced** (21 empty CSR shell, 22 exit
  403), not inferred from a successful data endpoint.
- Direct deployment ignores spoofed forwarding and still emits actual SSR;
  exact allowed hosts are enforced even on adapter API routes.
- An explicitly trusted immediate peer plus pinned HTTPS origin produces SSR,
  permits native same-origin POST exit with cookie deletion/303, and continues
  rejecting foreign browser Origins with 403.
- Unknown peers cannot become trusted through X-Forwarded-For. Spoofed hosts,
  schemes, ports, duplicate/comma-chain origin headers, malformed authorities
  and conflicting ports are rejected. Unneeded forwarding headers are discarded.
- Exact direct custom hosts and a pinned non-default HTTPS port work. Wildcard,
  incomplete and invalid proxy configuration fails startup.

Run against **owned disposable** bundles, never the live deployment:

```sh
TEST_SERVER_ENTRY="$OWNED_SERVER_BUNDLE" TEST_ANGULAR_MAJOR=22 TEST_EVIDENCE_FILE="$EVIDENCE_FILE" node tests/proxy-server.mjs
```

Repeat with Angular 21. Optionally set `TEST_LEGACY_SERVER_ENTRY` to an unchanged
pre-fix bundle to reproduce its specific failure. The test launches only its own
loopback mock/server processes and stops them in `finally`. It uses node:http so
Host spoof tests really send the supplied Host (fetch can ignore that override).
It simulates the upstream HTTP side of TLS termination, not an actual trusted
cloud ingress. Live owner confirmation/application and real browser SSR/exit
verification remain prerequisites before a video can present the fix as a live
success. All existing live recordings/evidence remain untouched.

## Canonical-address candidate

Both Angular majors also passed public check/build and the expanded proxy suite
with the separate canonical-address mode. Header-based strict proxy behavior was
not weakened. The same immutable adapter/dependency trees were reused, with new
owned build output; no live installs, Canvas files or recordings were changed.

`canonical-request.mjs` supplies six tests per major for exact URL invariance
under baseline/spoof/chained/duplicate forwarding; encoded path/query preservation;
actual `originalUrl ?? url` validation; malformed/duplicate/unlisted raw Host;
once-consumed Node POST streams and unchanged cookie/auth/Origin headers; retained
body-stream identity and abort propagation; invalid/conflicting configuration.
Run in each installed disposable consumer on the documented Node version:

```sh
node --import @angular/compiler --test tests/canonical-request.mjs
```

The expanded `proxy-server.mjs` production-server suite verifies actual SSR with
all those forwarding variants, canonical POST exit and cookie deletion, foreign/
missing/null Origin rejection, authenticated vs anonymous page contexts, streamed
JSON renewal, unchanged assertion-protected metadata, fixed non-default HTTPS
ports, and invalid Host/targets rejected before adapter content requests. Raw TCP
probes cover duplicate Host and control characters without a client URL parser
normalizing them first. The direct and strict-proxy regression scenarios and both
legacy failure reproductions continue to pass.

These are local request-boundary/mock-transport proofs, not live ingress identity,
TLS assurance or local-workload isolation. Canonical mode defines an application
address, not authentication. Live-owner application and browser verification are
still required before claiming a corrected live workflow or delivering its video.

## Reproduce with owner-supplied artifacts

Copy supplied tarballs into a directory you own. Do not build or alter a sibling checkout's artifacts. Then, from this standalone template:

```sh
node tests/validate-packed.mjs "$ARTIFACT_DIR"
```

This copies the three tarballs into a new OS-temporary directory, records their hashes, creates independent Angular 22/21 copies of this template, installs the same packages in each, and runs the **public** check/build/local-validation commands. It verifies generated files and the actual SSR output exist, so a silent CLI no-op cannot pass. Local package/lock resolutions exist only in those temporary copies. It does not start services or mutate the source template.

The printed directory contains both independently built consumers. Start them on free loopback ports with `CANVAS_SITE_URL=http://127.0.0.1:4520` and `PORT=4521` / `4522`. Start the test transport separately:

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
