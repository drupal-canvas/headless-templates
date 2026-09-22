// Bundle only for the loopback test transport, never into the starter app.
import { createHeadlessPreviewHost } from "@drupal-canvas/headless-host";

const iframe = document.querySelector<HTMLIFrameElement>("iframe")!;
const frontendOrigin = new URL(location.href).searchParams.get("frontend")!;
const mockOrigin =
  new URL(location.href).searchParams.get("mock") ?? location.origin;
const events: unknown[] = [];
let assertions = 0;
const host = createHeadlessPreviewHost({
  iframe,
  frontendOrigin,
  draftUrl: frontendOrigin + "/api/draft",
  fetchAssertion: async (params) => {
    const query = new URLSearchParams(params);
    query.set("ttl", String(assertions++ === 0 ? 20 : 900));
    query.set("editorOrigin", location.origin);
    return (await (await fetch(mockOrigin + "/assertion?" + query)).json())
      .assertion;
  },
  onEvent: (event) => events.push(event),
});
Object.assign(window, { fixtureHost: host, fixtureEvents: events });
document
  .querySelector("#refresh")!
  .addEventListener("click", () => host.refresh());
void host.activate({ path: "/components/accordion/0" });
window.addEventListener("pagehide", () => host.destroy(), { once: true });
